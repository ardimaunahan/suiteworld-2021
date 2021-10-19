/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define([
    'N/ui/serverWidget',
    '../lib/moment.min'
], function(
    serverWidget,
    moment
) {
    const onRequest = (scriptContext) => {
        const {response} = scriptContext;
        const form = serverWidget.createForm({
            title: 'Method 1: define()'
        });
        const fields = [
            {
                id: 'custpage_items',
                label: 'items',
                type: serverWidget.FieldType.SELECT,
                source: 'item'
            },
            {
                id: 'custpage_tran',
                label: 'Transaction',
                type: serverWidget.FieldType.SELECT,
                source: 'transaction'
            },
            {
                id: 'custpage_sd_ser_moment',
                label: 'Server Side Moment',
                type: serverWidget.FieldType.TEXT,
                defaultValue: `<div id="sd_ser_moment">${moment()}</div>`,
                displayType: serverWidget.FieldDisplayType.INLINE
            },
            {
                id: 'custpage_sd_cs_moment',
                label: 'Client Side Moment',
                type: serverWidget.FieldType.TEXT,
                defaultValue: `<div id="sd_client_moment"></div>`,
                displayType: serverWidget.FieldDisplayType.INLINE
            },
            {
                id: 'custpage_sd_qrcode',
                label: 'QR Code',
                type: serverWidget.FieldType.INLINEHTML,
                breakType: serverWidget.FieldBreakType.STARTCOL,
                defaultValue: `<div id="sd_qrcode_con"></div>`
            }
        ];
        fields.forEach((f) => {
            let op = {
                id: f.id,
                label: f.label,
                type: f.type
            };
            if (f.source) {
                op = Object.assign({}, op, {source: f.source});
            }
            const field = form.addField(op);
            if (f.breakType) {
                field.updateBreakType({breakType: f.breakType});
            }
            if (f.defaultValue) {
                field.defaultValue = f.defaultValue;
            }

            if (f.displayType) {
                field.updateDisplayType({displayType: f.displayType});
            }
        });
        form.clientScriptModulePath = './SD_CS_Method1.js';

        response.writePage(form);
    };

    return {onRequest};
});
