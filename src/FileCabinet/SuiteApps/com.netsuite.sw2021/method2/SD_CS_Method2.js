/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/https'],
/**
 * @param{https} https
 */
function(https) {

    /**
     * Function to be executed after page is initialized.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.mode - The mode in which the record is being accessed (create, copy, or edit)
     *
     * @since 2015.2
     */
    function pageInit(scriptContext) {
        return true;
    }

    function onButtonClick(){
        alert(angular.toJson(window.sddemo.angularTodos));
    }

    return {
        pageInit: pageInit,
        onButtonClick:onButtonClick
    };

});
