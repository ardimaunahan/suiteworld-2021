/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define([
    'N/ui/serverWidget',
    'N/runtime'
], function(
    serverWidget,
    runtime
) {
    const onRequest = (scriptContext) => {
        const {response} = scriptContext;
        const form = serverWidget.createForm({
            title: 'Bonus: Object Detection'
        });

        form.addField({
            id: 'custpage_custom_html',
            type: 'inlinehtml',
            label: ' '
        }).defaultValue = _loadHtmlFile();

        response.writePage(form);
    };

    const _loadHtmlFile = () => {
        const htmlText = `
            <iframe src="/c.${runtime.accountId}/suiteapp/com.netsuite.sw2021/bonus/index.html" frameBorder="0" style="width:95vw; height: 700px; overflow:scroll"></iframe>
        `;

        return htmlText;
    };

    return {onRequest};
});
