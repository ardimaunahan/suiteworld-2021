/**
 * Copyright (c) 2021, Oracle and/or its affiliates. All rights reserved.
 *
 */
define([
    'knockout',
    'ojs/ojattributegrouphandler',
    'text!../data/commonCategoriesSingleGroupData.json',
    'text!../data/commonCategoriesTimeSeriesData.json',
    'text!../data/commonCategoriesBubbleData.json',
    'ojs/ojarraydataprovider',
    'ojs/ojknockout',
    'ojs/ojlegend',
    'ojs/ojchart'
], function(
    ko,
    ojattributegrouphandler1,
    singleGroupData,
    timeSeriesData,
    bubbleData,
    ArrayDataProvider
) {
    class ChartModel {
        constructor() {
            // Use ColorAttributeGroupHandler for consistent coloring
            this.colorHandler = new ojattributegrouphandler1.ColorAttributeGroupHandler();
            this.data = JSON.parse(singleGroupData);

            this.singleGroupDataProvider = new ArrayDataProvider(this.data, {
                keyAttributes: 'id'
            });

            this.timeSeriesDataProvider = new ArrayDataProvider(JSON.parse(timeSeriesData), {
                keyAttributes: 'id'
            });

            this.bubbleDataProvider = new ArrayDataProvider(JSON.parse(bubbleData), {
                keyAttributes: 'id'
            });

            this.legendDataProvider = new ArrayDataProvider(this.data, {
                keyAttributes: 'text'
            });

            this.hiddenCategoriesValue = ko.observableArray([this.data[0].series]);
        }
    }

    class View {
        render() {
            ko.applyBindings(new ChartModel(), document.getElementById('chart-container'));
        }
    }

    return View;
});
