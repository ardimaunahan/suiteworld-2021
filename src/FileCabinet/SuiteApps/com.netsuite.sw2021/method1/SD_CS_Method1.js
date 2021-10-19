/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 */
define([
    '../lib/qrcode.min',
    '../lib/moment.min',
    'N/url',
    'N/record',
    'N/runtime'
], function(
    QRCode,
    moment,
    url,
    record,
    runtime
) {
    let qrObj = null;
    let appUrl = null;

    function pageInit(scriptContext) {
        /* QRCode is non AMD module
         * so it will always populate (or) pollute global name space
         * i.e. in our case window
         * */
        if (!QRCode) {
            QRCode = window.QRCode;
        }

        appUrl = url.resolveDomain({
            hostType: url.HostType.APPLICATION,
            accountId: runtime.accountId
        });

        let cl = document.getElementById('sd_client_moment');
        cl.innerText = moment();
    }

    function fieldChanged(scriptContext) {
        const rec = scriptContext.currentRecord;

        let data = '';
        let value = rec.getValue({fieldId: scriptContext.fieldId});
        if (value) {
            if (scriptContext.fieldId === 'custpage_items') {
                let temp = url.resolveRecord({
                    recordType: record.Type.INVENTORY_ITEM,
                    recordId: value
                });
                data = `https://${appUrl}${temp}`;
            } else {
                let tranUrl = '/app/accounting/transactions/transaction.nl?id=';
                data = `https://${appUrl}${tranUrl}${value}`;
            }

            if (data) {
                if (qrObj) {
                    qrObj.clear();
                    qrObj.makeCode(data);
                } else {
                    qrObj = new QRCode(document.getElementById('sd_qrcode_con'), data);
                }
            }
        }
    }

    return {
        pageInit: pageInit,
        fieldChanged: fieldChanged
    };
});
