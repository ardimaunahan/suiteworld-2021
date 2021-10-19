/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 */
define([
    'N/runtime',
    '../common/SD_Constants'
], function(
    runtime,
    constants
) {
    const pageInit = (scriptContext) => {
        var externalBaseUrl = _getExternalBaseUrl();
        vanilla.require.config({
            baseUrl: externalBaseUrl + '/method4/',
            paths: {
                jet: 'jet',
                ojtranslations: 'resources/ojtranslations'
            }
        });

        vanilla.require(['jet/DemoCharts'], function(JetView) {
            new JetView().render();
        });
    };

    const _getExternalBaseUrl = () => {
        return '/c.' + runtime.accountId + '/suiteapp/' + constants.APP_ID;
    };

    return {
        pageInit
    };
});
