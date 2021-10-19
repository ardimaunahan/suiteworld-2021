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
            title: 'Method 2: &lt;script&gt; tag'
        });

        let field = form.addField({
            id: 'custpage_sd_style_con',
            label: ' ',
            type: serverWidget.FieldType.INLINEHTML
        });
        field.defaultValue = getFileContent('./method2.html');
        form.addButton({id: 'custpage_sd_btn', label: "To-Do's", functionName: 'onButtonClick'});
        form.clientScriptModulePath = './SD_CS_Method2.js';
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
