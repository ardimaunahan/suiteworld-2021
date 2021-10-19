/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define([
    'N/ui/serverWidget',
    'N/file'
], function(
    serverWidget,
    file
) {
    const onRequest = (scriptContext) => {
        const {response} = scriptContext;
        const form = serverWidget.createForm({
            title: 'Method 3: require.config()'
        });
        let field = form.addField({
            label: ' ',
            id: 'custpage_ml_demo1',
            type: serverWidget.FieldType.INLINEHTML
        });
        let fileContent = getFileContent('./method3.html');
        let modelSummaryUrl = file.load('./modelSummary.JPG').url;
        fileContent = fileContent.replace('{{modelSummaryUrl}}',modelSummaryUrl);
        field.defaultValue = fileContent;
        const fileUrlField = form.addField({
            label: ' ',
            id: 'custpage_ml_file_url',
            type: serverWidget.FieldType.TEXT
        });
        fileUrlField.updateDisplayType({displayType: serverWidget.FieldDisplayType.HIDDEN});
        fileUrlField.defaultValue = file.load('./Sunspots.csv').url;
        form.clientScriptModulePath = './SD_CS_Method3.js';

        response.writePage(form);
    };

    function getFileContent(id) {
        let filecontent = '';
        try {
            const fileObj = file.load({
                id: id
            });
            filecontent = fileObj.getContents();
        } catch (e) {
            log.error('error while loading file');
        }
        return filecontent;
    }

    return {onRequest};
});
