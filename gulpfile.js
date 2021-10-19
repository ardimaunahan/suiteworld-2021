const run = require('gulp-run-command').default;
const replace = require('gulp-replace');
const {dest, series, src} = require('gulp');
const argv = require('yargs').argv;
const PluginError = require('plugin-error');
const merge = require('merge-stream');
const del = require('del');
const rename = require('gulp-rename');

// START: CONFIGURATION
const sourceDir = 'src/FileCabinet/SuiteApps/com.netsuite.sw2021/';
const availableViews = {
    'jet/DemoCharts': {
        destination: sourceDir + 'method4'
    }
};
// END: CONFIGURATION

const buildOutputDir = 'JET/suiteapp/';
const jetIndexDir = 'JET/src/';
const jetMainJsDir = 'JET/src/js/';
const buildConfigDir = 'JET/scripts/config/';
// The section that gets replaced with the actual view to build in oraclejet-build.js.
const defaultReplacementString =
    '//inject:viewName\n' + "var viewName = '[Insert View Name Here]';\n" + '//endinject:viewName';

function build() {
    console.log('Building JET view for SuiteApp...');
    return new Promise((resolve, reject) => {
        try {
            const viewName = argv.view || 'missing view';

            validateParameters(viewName);
            cleanIndexAndMain();
            copyIndexAndMain(viewName);
            updateBuildConfig(viewName);

            const command = `ojet build --release`;
            series(run(command, {cwd: './JET'}))((_) => {
                resetBuildConfig();
                copyToSuiteApp(viewName);

                console.log('Build complete');

                resolve();
            });
        } catch (error) {
            console.log(error);
            reject(error);
        }
    });
}

function serve() {
    console.log('Running ojet serve...');

    return new Promise((resolve, reject) => {
        try {
            const viewName = argv.view || 'missing view';

            validateParameters(viewName);
            cleanIndexAndMain();
            copyIndexAndMain(viewName);

            const command = `ojet serve`;
            series(run(command, {cwd: './JET'}))((_) => {
                console.log('Serve complete');
                resolve();
            });
        } catch (error) {
            console.log(error);
            reject(error);
        }
    });
}

function updateBuildConfig(viewName) {
    return src([`${buildConfigDir}oraclejet-build.js`])
        .pipe(
            replace(
                /\/\/inject:viewName[\s\S]*\/\/endinject:viewName/m,
                '//inject:viewName\n' +
                    "var viewName = '" +
                    viewName +
                    "';\n" +
                    '//endinject:viewName'
            )
        )
        .pipe(dest(buildConfigDir));
}

function resetBuildConfig() {
    return src([`${buildConfigDir}oraclejet-build.js`])
        .pipe(
            replace(/\/\/inject:viewName[\s\S]*\/\/endinject:viewName/m, defaultReplacementString)
        )
        .pipe(dest(buildConfigDir));
}

function validateParameters(viewName) {
    const pluginName = 'gulpfile';

    if (!viewName) throw new PluginError(pluginName, 'Missing parameter: "--view"');

    if (Object.keys(availableViews).indexOf(viewName) === -1)
        throw new PluginError(
            pluginName,
            'Invalid value for "--view". Refer to "availableViews" variable.'
        );
}

function copyToSuiteApp(viewName) {
    return src(`${buildOutputDir}/**`).pipe(dest(`${availableViews[viewName].destination}`));
}

function cleanIndexAndMain() {
    const indexHtml = `${jetIndexDir}index.html`;
    const mainJs = `${jetMainJsDir}main.js`;

    return del([indexHtml, mainJs]);
}

function copyIndexAndMain(viewName) {
    const copyIndexHtml = src(`${jetMainJsDir}${viewName}.html`)
        .pipe(rename('index.html'))
        .pipe(dest(jetIndexDir));
    const copyMainJs = src(`${jetMainJsDir}${viewName}Main.js`)
        .pipe(rename('main.js'))
        .pipe(dest(jetMainJsDir));

    return merge(copyIndexHtml, copyMainJs);
}

module.exports = {
    build,
    serve
};
