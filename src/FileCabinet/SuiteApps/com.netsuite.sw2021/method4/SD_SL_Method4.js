/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define([
    'N/ui/serverWidget',
    'N/file',
    'N/runtime',
    '../common/SD_Constants'
], function(
    serverWidget,
    file,
    runtime,
    constants
) {
    const onRequest = (scriptContext) => {
        const {response} = scriptContext;
        const form = serverWidget.createForm({
            title: 'Method 4: 3rd party requirejs'
        });

        form.addField({
            id: 'custpage_custom_html',
            type: 'inlinehtml',
            label: ' '
        }).defaultValue = _loadHtmlFile();

        form.clientScriptModulePath = './SD_CS_Method4';

        response.writePage(form);
    };

    const _loadHtmlFile = () => {
        var htmlText = file.load('./jet/DemoCharts.html').getContents();
        var externalBaseUrl = '/c.' + runtime.accountId + '/suiteapp/' + constants.APP_ID;
        htmlText = htmlText.replace(/{{EXTERNAL_BASE_URL}}/g, externalBaseUrl);

        return htmlText;
    };

    return {onRequest};
});
