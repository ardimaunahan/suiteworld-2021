/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */
define([
    'N/currentRecord',
    'N/runtime'
], function(
    currentRecord,
    runtime
) {
    function scopedFunCall() {
        let eurl = '/SuiteApps/com.netsuite.sw2021/';
        const scopedRequire = require.config({
            context: 'suite_world',
            baseUrl: eurl,
            paths: {
                danfo: 'lib/danfo.js',
                moment: 'lib/moment.min.js',
                Plotly: 'lib/plotly-2.2.0.min.js'
            }
        });
        scopedRequire(['Plotly', 'danfo', 'moment'], function(b, c, d) {
            window.Plotly = b;
            dfd = window.dfd;
            moment = d;
            const cr = currentRecord.get();
            const fileUrl = cr.getValue({fieldId: 'custpage_ml_file_url'});
            handleSunspotData(fileUrl).then((e) => {
                console.log('handleSunspotData completed', e);
            });
        });
    }

    function pageInit(scriptContext) {
        scopedFunCall();
    }

    async function handleSunspotData(fileUrl) {
        let loaderEl = document.getElementById('sd_3_loader');
        if (loaderEl) {
            loaderEl.innerHTML = `<b>Fetching Sunspot Data</b>`;
        }
        const df = await dfd.read_csv(fileUrl);

        if (loaderEl) {
            loaderEl.style.display = 'none';
        }
        console.log('df', df);

        df.rename({
            mapper: {Date: 'date', 'Monthly Mean Total Sunspot Number': 'spots'},
            inplace: true
        });
        var layout = {
            title: 'Sunspot Chart',
            xaxis: {
                title: 'Date'
            },
            yaxis: {
                title: 'Monthly Mean Total Sunspot Number'
            }
        };
        let df1 = df.set_index({key: 'date'});
        df1.plot('plot_div').line({columns: ['spots'], layout});

        let rowsLength = df.shape[0];
        console.log('shape', df.shape);
        let startyear = 1749;
        let year1900 = (1900 - startyear) * 12;
        let sliceStr = year1900 - 1 + ':';
        console.log('sliceStr', sliceStr);
        let newDf = df.iloc({rows: [sliceStr]});
        console.log('df new shape', newDf.shape);

        //newDf = newDf.set_index({key: 'date'});

        let spotsDf = newDf.loc({columns: ['spots']});
        let labels = newDf.loc({columns: ['date']}).tensor.dataSync();
        spotsDf.print();
        let timePortion = 64;
        let tf = dfd.tf;
        let epochs = 100;
        let processedData = process(spotsDf, timePortion);
        let built = await buildCnn2(processedData, tf, timePortion);
        let {model, tensorData} = await modelBuildHandler(built, tf, epochs);
        let predictedX = await predict(built, model, tensorData);
        var predX = predictedX.dataSync();
        var predictedXInverse = minMaxInverseScaler(predX, processedData.min, processedData.max);
        var predXPadLeft = tf.pad(
            tf.tensor1d(predictedXInverse.data),
            [[timePortion, 0]] /*,
            processedData.min*/
        );
        let pDF = new dfd.DataFrame({
            date: labels,
            actual: processedData.originalData,
            predicted: predXPadLeft.dataSync()
        });
        pDF = pDF.iloc({rows: [timePortion + ':']});
        pDF = pDF.set_index({key: 'date'});
        pDF.plot('table1').table();
        let newLayout = Object.assign({}, layout, {hovermode: 'y unified'});
        pDF.plot('div1').line({
            columns: ['actual', 'predicted'] /* , mode: 'lines+markers' */,
            layout: newLayout
        });
        return pDF;
    }

    const minMaxInverseScaler = function(data, min, max) {
        let scaledData = data.map(function(value) {
            return value * (max - min) + min;
        });

        return {
            data: scaledData,
            min: min,
            max: max
        };
    };

    const minMaxScaler = function(data, min, max) {
        let scaledData = data.map(function(value) {
            return (value - min) / (max - min);
        });

        return {
            data: scaledData,
            min: min,
            max: max
        };
    };

    function process(df, timePortion) {
        let scaler = new dfd.MinMaxScaler();

        scaler.fit(df);

        let df_enc = scaler.transform(df);
        //df_enc.print()
        let trainX = [],
            trainY = [],
            size = df.size;
        let scaledFeatures = df_enc.tensor.dataSync();

        try {
            // Create the train sets
            for (let i = timePortion; i < size; i++) {
                for (let j = i - timePortion; j < i; j++) {
                    trainX.push(scaledFeatures[j]);
                }

                trainY.push(scaledFeatures[i]);
            }
        } catch (ex) {
            //resolve(ex);
            console.log(ex);
        }

        return {
            size: size - timePortion,
            timePortion: timePortion,
            trainX: trainX,
            trainY: trainY,
            min: df.min().min(),
            max: df.max().min(),
            originalData: df.tensor.dataSync(),
            scaler: scaler
        };
    }

    async function buildCnn2(data, tf, timePortion) {
        // Linear (sequential) stack of layers
        const model = tf.sequential();

        // Define input layer
        model.add(
            tf.layers.inputLayer({
                inputShape: [timePortion, 1]
            })
        );

        // Add the first convolutional layer
        model.add(
            tf.layers.conv1d({
                kernelSize: 2,
                filters: 128,
                strides: 1,
                use_bias: true,
                activation: 'relu',
                kernelInitializer: 'VarianceScaling'
            })
        );

        // Add the Average Pooling layer
        model.add(
            tf.layers.averagePooling1d({
                poolSize: [2],
                strides: [1]
            })
        );

        // Add the second convolutional layer
        model.add(
            tf.layers.conv1d({
                kernelSize: 2,
                filters: 64,
                strides: 1,
                use_bias: true,
                activation: 'relu',
                kernelInitializer: 'VarianceScaling'
            })
        );

        // Add the Average Pooling layer
        model.add(
            tf.layers.averagePooling1d({
                poolSize: [2],
                strides: [1]
            })
        );

        // Add Flatten layer, reshape input to (number of samples, number of features)
        model.add(
            tf.layers.flatten({
                /*inputShape: timePortion*/
            })
        );

        // Add Dense layer,
        model.add(
            tf.layers.dense({
                units: 1,
                kernelInitializer: 'VarianceScaling',
                activation: 'linear'
            })
        );

        return {
            model: model,
            data: data
        };
    }

    async function cnn2(model, data, epochs) {
        console.log('MODEL SUMMARY: ');
        model.summary();

        // Optimize using adam (adaptive moment estimation) algorithm
        model.compile({optimizer: 'adam', loss: 'meanSquaredError'});
        let start = null;
        // Train the model
        let result = await model.fit(data.tensorTrainX, data.tensorTrainY, {
            epochs: epochs,
            callbacks: {
                onEpochEnd: (epoch, logs) => {
                    let el = window.document.getElementById('epochlogger');
                    el.innerHTML = `<span>Epoch ${epoch + 1} of ${epochs} and loss ${
                        logs.loss
                    }</span>`;
                },
                onTrainBegin: (log) => {
                    start = moment();
                },
                onTrainEnd: (logs) => {
                    let end = moment();
                    let duration = moment.duration(end.diff(start));
                    let el = window.document.getElementById('epochlogger');
                    el.innerHTML += `<br><span><b> Total time for training in Minutes: </b>${duration.asMinutes()} </span>`;
                }
            }
        });

        console.log(
            'Loss after last Epoch (' +
                result.epoch.length +
                ') is: ' +
                result.history.loss[result.epoch.length - 1]
        );
        return model;
    }

    async function modelBuildHandler(built, tf, epochs) {
        // Transform the data to tensor data
        // Reshape the data in neural network input format [number_of_samples, timePortion, 1];
        let tensorData = {
            tensorTrainX: tf
                .tensor1d(built.data.trainX)
                .reshape([built.data.size, built.data.timePortion, 1]),
            tensorTrainY: tf.tensor1d(built.data.trainY)
        };

        // Train the model using the tensor data
        // Repeat multiple epochs so the error rate is smaller (better fit for the data)
        let model = await cnn2(built.model, tensorData, epochs);
        return {model, tensorData};
    }

    async function predict(built, model, tensorData) {
        // Rember the min and max in order to revert (min-max scaler) the scaled data later
        let max = built.data.max;
        let min = built.data.min;

        // Predict for the same train data
        // We gonna show the both (original, predicted) sets on the graph
        // so we can see how well our model fits the data
        var predictedX = model.predict(tensorData.tensorTrainX);
        return predictedX;
    }

    return {
        pageInit: pageInit
    };
});
