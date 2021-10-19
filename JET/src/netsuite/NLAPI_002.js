









/*--------------- Client SuiteScript Implementation ------------*/

/*--------------- Event Handler implementations for custom code ------------*/
var isRUMEnabled = typeof(NLRUM) !== 'undefined';
var callClientScript = (function () {
	var msgRouter = null;
	function doCallClientScript(trigger, args)
	{
		if (!!window && !!window.location && !!window.location.href && /(\?|&)withcurrentrecord\b/.test(window.location.href))
			return true;

		var returnResult = true;
		if (includedVersion2plusScript())
		{
			fetchClientScripts();
			returnResult = runClientScript(trigger, args);
		}
		else
		{
			returnResult = oldScriptCall(trigger, args);
		}
		return returnResult;
	}
	return doCallClientScript;
})();

var fetchClientScripts = (function ()
{
    var ranAlready = false;
	function doFetching(debug) {

		if (!ranAlready && includedVersion2plusScript()) {
			require.initDebug(debug);
			// init debug mode
			require.forceSync(true);
			// make N modules available to the global context, as requireJS will do intakeDefines() to handle all modules available int he queue
			require.setInternal(true);
			// this is internal require
			try
			{
				/*
				 Here we flush the queue of define calls populated by N.js so that all APIs are cached prior to executing any
				 scripts. This allows us to prevent duplication of API modules, which is a side effect of using RequireJS
				 Multiversion support to avoid require.config() conflicts, since every require() scope is intended to be completely isolated
				 and have its own version of modules (for example 2 different versions of jQuery).
				 */
				require(['N'], function () {});
				require(['N/msgRouter'], function(msgRouterModule) {msgRouter = msgRouterModule;});
			}
			finally
			{
				require.setInternal(false);
			}

			for (var idx = 0; idx < _clientScriptContext.superScriptList.length; idx++) {
				var thisScript = _clientScriptContext.superScriptList[idx];
				if (thisScript.version === "1.0") {
					moduleKeeper[idx] = JSON.parse(thisScript.scriptInfo);
				}
				else {
					var entryPointRequire = require;
					if (thisScript.scriptInfo.indexOf("N/") !== 0) {
						var rConfig = JSON.parse(thisScript.amdConfig);
						rConfig['context'] = thisScript.scriptInfo;
						entryPointRequire = require.config(rConfig);
					}
					entryPointRequire([thisScript.scriptInfo], function (scriptNum, scriptModule) {
						moduleKeeper[scriptNum] = scriptModule;
					}.bind(undefined, idx));
				}
			}
			require.forceSync(false);

			ranAlready = true;
		}
	}
    return doFetching;
})();

function includedVersion2plusScript()
{
    return (typeof(require) !== 'undefined') && (typeof(_clientScriptContext) !== 'undefined') && (_clientScriptContext.superScriptList.length > 0);
}

function organizeArgs(trigger, currRec, args)
{
    function getZeroBasedIndex(idx)
    {
        if (isNaN(idx))
        {
            return idx;
        }
        else
        {
            idx = parseInt(idx, 10);
            return (idx < 0) ? idx : idx - 1;
        }
    }
    var returnMe;
    switch(trigger)
    {
        case "pageInit":
            returnMe = [{currentRecord: currRec, mode: args[0]}];
            break;

        case "saveRecord":
            returnMe = [{currentRecord: currRec}];
            break;

        case "lineInit":
        case "validateDelete":
        case "validateInsert":
        case "validateLine":
            returnMe = [{currentRecord: currRec, sublistId: args[0]}];
            break;

        case "recalc":
            returnMe = [{currentRecord: currRec, sublistId: args[0], operation: args[1]}];
            break;

        case "postSourcing":
            returnMe = [{currentRecord: currRec, sublistId: args[0], fieldId: args[1], line: getZeroBasedIndex(args[2])}];
            break;

        case "validateField":
        case "fieldChanged":
            returnMe = [{currentRecord: currRec, sublistId: args[0], fieldId: args[1], line: getZeroBasedIndex(args[2]), column: getZeroBasedIndex(args[3])}];
            break;

        default:
            returnMe = [];
    }
    return returnMe;
}

var triggerInfo = {
                    pageInit: { fieldId: "nlapiPI", needsReturn: false },
                    saveRecord: { fieldId: "nlapiSR", needsReturn: true },
                    lineInit: { fieldId: "nlapiLI", needsReturn: false },
                    validateDelete: { fieldId: "nlapiVD", needsReturn: true },
                    validateInsert: { fieldId: "nlapiVI", needsReturn: true },
                    validateLine: { fieldId: "nlapiVL", needsReturn: true },
                    postSourcing: { fieldId: "nlapiPS", needsReturn: false },
                    recalc: { fieldId: "nlapiRC", needsReturn: false },
                    validateField: { fieldId: "nlapiVF", needsReturn: true },
                    fieldChanged: { fieldId: "nlapiFC", needsReturn: false }
                  };
if (Object.freeze)
{
    triggerInfo = Object.freeze(triggerInfo);
}

function oldScriptCall(trigger, args)
{
    var thisTriggerInfo = triggerInfo[trigger];
    var thisScriptList = document.forms['main_form'].elements[thisTriggerInfo.fieldId];
    var returnMatters = thisTriggerInfo.needsReturn;

    var isValid = true;
    if ( (thisScriptList != null) && (thisScriptList.value.length > 0) )
    {
        var scripts = thisScriptList.value.split(String.fromCharCode(1));
        for (var i = 0; isValid && i < scripts.length; i++)
        {
	        if (isRUMEnabled && !isValEmpty(scripts[i]))
		        NLRUM.clientScriptBegin(trigger, fScriptIds[i]);

            isValid = nsapiCallUserScript(trigger, fScriptIds[i], scripts[i], args);
            isValid = returnMatters ? isValid : true;

	        if (isRUMEnabled && !isValEmpty(scripts[i]))
		        NLRUM.clientScriptEnd(trigger, fScriptIds[i], args, nlapiGetRecordType(), "1.0");
        }
    }
    return isValid;
}

function runClientScript(trigger, args)
{
    var args = args || [];
    var isValid = true;
    var isInternal = nsapiIsInternal();
    var globalReqConfig = require.config;
    try
    {
        nsapiSetIsInternal(false);
        var returnMatters = triggerInfo[trigger].needsReturn;
        var runtimeModule = moduleKeeper[moduleKeeper.length - 2];
        var currentRecordModule = moduleKeeper[moduleKeeper.length - 1];
        var currentRecord = currentRecordModule.get();
	    msgRouter.pushQueue(currentRecord);
		try {
			var argsV2 = organizeArgs(trigger, currentRecord, args);
			for (var i = 0; i < moduleKeeper.length - 2; i++) {
				var moduleInfo = _clientScriptContext.superScriptList[i];

				if (moduleInfo.isLibraryModule || moduleInfo.excludeFromClientScriptExecution)
					continue;
				var activeModule = moduleKeeper[i];
				var thisVersion = (typeof(moduleInfo.version) !== 'undefined') ? moduleInfo.version : "1.0";
				var thisId = moduleInfo.scriptId;
				if (nlapiGetContext().usage)
					nlapiGetContext().usage[thisId] = 0;

				var origScriptId = window.NLScriptId;
				// How can this singleton ever be correct in an async environment???
				window.NLScriptId = thisId;

				try {
					runtimeModule.setupScriptRun(moduleInfo);

					var realTrigger = ((thisVersion === "2.0") && (trigger === "recalc")) ? "sublistChanged" : trigger;

					if (!!activeModule && activeModule.hasOwnProperty(realTrigger)) {
						var validCall = (thisVersion === "1.0" && realTrigger === "fieldChanged" && document.forms['main_form'].elements.nlapiFC != null) ? (document.forms['main_form'].elements.nlapiFC.value !== '') : true;
						if (validCall) {
							var functionTrigger = activeModule[realTrigger];
							var currentClientScriptFunction;
							if (typeof(functionTrigger) === "function")
								currentClientScriptFunction = functionTrigger;
							else if (typeof(functionTrigger) === "string") {
								namespacePaths = functionTrigger.split(".");
								currentClientScriptFunction = this[namespacePaths[0]];
								namespacePaths = namespacePaths.splice(1);
								for (var j in namespacePaths) {
									if (namespacePaths.hasOwnProperty(j))
										currentClientScriptFunction = currentClientScriptFunction[namespacePaths[j]];
								}
							}
							var currentArguments = (thisVersion === "2.0") ?
								argsV2 :
								(function (args) {
									var result = [];
									for (var i = 0; i < args.length; i++) {
										result.push(typeof args[i] === 'undefined' ? null : args[i]);
									}
									return result;
								})(args);

							//2.0
							if (typeof(currentClientScriptFunction) === "function") {
								if (typeof(nlapi) !== 'undefined' && nlapi && nlapi.async) nlapi.async.prepareForAsync({info: moduleInfo, version: thisVersion, record: currentRecord, trigger: realTrigger, args: args});
								try {
									if (isRUMEnabled)
										NLRUM.clientScriptBegin(realTrigger, thisId);

									require.config = myRequireConfig;
									isValid = !!currentClientScriptFunction.apply(null, currentArguments);

 									if (isRUMEnabled)
									    NLRUM.clientScriptEnd(realTrigger, thisId, args, nlapiGetRecordType(), thisVersion)
								}
								finally {
									if (typeof(nlapi) !== 'undefined' && nlapi && nlapi.async) nlapi.async.unloadAsync();
									require.config = globalReqConfig;
								}
								if (returnMatters && !isValid)
									break;
							}
						}
					}
				}
				finally {
					window.NLScriptId = origScriptId;
				}
			}
		}
		finally
		{
			msgRouter.popQueue();
		}
    }
    catch(e)
    {
        var fn = thisId;
        var id = e.getCode != null && typeof(e.getCode) == "function" ? e.getId() : null;
        var code = e.getCode != null && typeof(e.getCode) == "function" ? e.getCode() : typeof(e) == "string" ? new String(e) : typeof(e) == "object" && e.name && e.message ? "JS_EXCEPTION" : "UNEXPECTED_ERROR";
        if (code == "UNEXPECTED_ERROR" && id != null)
            code += " (id="+id+")";
        var msg = e.getDetails != null && typeof(e.getDetails) == "function" ? emptyIfNull(e.getDetails()) : typeof(e) == "string" ? "" : typeof(e) == "object" && e.name && e.message ? e.name+' '+e.message : e.toString()
        var suppressnotification = e.getCode != null && typeof(e.getCode) == "function" && e.suppressnotification === true;
        var supportsLogging = thisId != "customform";
        alert(window.nsScriptErrorMsg+'\n\n'+fn+' ('+trigger+')\n'+''+(isValEmpty(nlapiGetContext().getBundleId()) ? '' : ' ('+ nlapiGetContext().getBundleId() +')')+'\n\n'+""+code+'\n'+msg)
        if (supportsLogging)
            nsServerCall(nsJSONProxyURL, "logError", [code, msg, id, fn, thisId, suppressnotification, nlapiGetRecordType(), nlapiGetRecordId()]);
        throw e;
    }
    finally
    {
        nsapiUpdateMachines();
        nsapiSetIsInternal(isInternal);
    }
    return isValid;

	function isFilePathLike(path) {
		return Object.prototype.toString.call(path) === '[object String]' && ( path.indexOf("/") >=0  || path ==="N" || path ==="N.js")
	}

	function myRequireConfig(configObj) {
		if (configObj && configObj.context && isFilePathLike(configObj.context)) {
			var errorMessage = nsServerCall(nsJSONProxyURL, "getErrorMessage", ['INVALID_CONFIGURATION_UNABLE_TO_CHANGE_REQUIRE_CONFIGURATION_FOR_1',configObj.context, null, null, null]);
			throw nlapiCreateError('INVALID_CONFIGURATION_UNABLE_TO_CHANGE_REQUIRE_CONFIGURATION_FOR_1',errorMessage);
		}
		return globalReqConfig(configObj);
	}

}

function nlapiPageInit(type)
{
    var origflag = NS.form.isInited();
    try
    {
        NS.form.setInited(true );/* --- set page_init flags so that machine calls function correctly. */
        window.loadcomplete = true; /* --- mark the window as loadcomplete (originally done in window.setIsInited) - enables nlapiValidateField */
        if (document.forms['main_form'].elements.wfPI != null && document.forms['main_form'].elements.wfPI.value.length > 0)
        {
            nsapiCallScript( "pageInit", "internal", document.forms['main_form'].elements.wfPI.value, [type] );
        }
        if (document.forms['main_form'].elements.nsapiPI != null && document.forms['main_form'].elements.nsapiPI.value.length > 0)
        {
            nsapiCallScript( "pageInit", "internal", document.forms['main_form'].elements.nsapiPI.value, [type] );
        }
        callClientScript("pageInit", [type]);
    }
    finally	/* restore page_init flags upon completion */
    {
        NS.form.setInited(origflag);
    }
}

function enableDisabledFields (isValid)
{
    if (isValid)  /* if the save is valid, enabled any disabled main form fields prior to returning */
    {
        for (var fldnam in nsDisabledFields)
        {
            if (nsDisabledFields[fldnam])
                disableField(getFormElement(document.forms['main_form'], fldnam), false);
            nsDisabledFields[fldnam] = false;
        }
    }
}
function nlapiSaveRecord()
{
    var isValid = true;

    if (document.forms['main_form'].elements.wfSR != null && document.forms['main_form'].elements.wfSR.value.length > 0)
    {
        isValid = nsapiCallScript("saveRecord", "internal", document.forms['main_form'].elements.wfSR.value);
        if (!isValid)
            return false;
    }
    if (document.forms['main_form'].elements.nsapiSR != null && document.forms['main_form'].elements.nsapiSR.value.length > 0)
    {
        isValid = nsapiCallScript("saveRecord", "internal", document.forms['main_form'].elements.nsapiSR.value);
        if (!isValid)
            return false;
    }
    isValid = isValid && callClientScript("saveRecord");
    return isValid;
}

function nlapiValidateField(type, fldnam, linenum, column, optionswin)
{
    if (!window.loadcomplete || document.page_is_resetting)
        return false;
    var isValid = true;
    if (type != null && linenum == null && column == null)
        linenum = nlapiGetCurrentLineItemIndex(type);
    var fld = nsapiResolveField(type, fldnam, linenum, column);
    if (fld == null)  // bail (for now) if the field cannot be found
        return isValid;
    if (optionswin != null)
        optwin = optionswin;
    var checkValidOrig = fld.checkvalid;
    try
    {
        fld.checkvalid = false;
        if (document.forms['main_form'].elements.wfVF != null && document.forms['main_form'].elements.wfVF.value.length > 0)
        {
            isValid = nsapiCallScript( "validateField", "internal", document.forms['main_form'].elements.wfVF.value, [type, fldnam, linenum, column] );
            if (!isValid)
                return false;
        }
        if (document.forms['main_form'].elements.nsapiVF != null && document.forms['main_form'].elements.nsapiVF.value.length > 0)
        {
            isValid = nsapiCallScript( "validateField", "internal", document.forms['main_form'].elements.nsapiVF.value, [type, fldnam, linenum, column] );
            if (!isValid)
                return false;
        }
        isValid = isValid && callClientScript("validateField", [type, fldnam, linenum, column]);
        return isValid;
    }
    finally
    {
        optwin = null;
        fld.checkvalid = checkValidOrig;
        if (!isValid)
        {
            if (typeof(ftabs) != 'undefined')
            {
                var tab = ftabs[getFieldName(fldnam)];
                if (tab != null && tab != "main" && !isTabShown(tab))
                    ShowTab(tab,true);
            }

            if (!fld.donotfocus)
            {
                setFieldFocus( fld );
                if (fld.select != null)
                    fld.select();
            }
        }
    }
}
function nlapiFieldChanged(type, fldnam, linenum, column, optionswin)
{
    if (!window.loadcomplete || document.page_is_resetting)
        return;
    var origflag = NS.form.isInited();
    var origsetter = NS.form.setInited;
    try
    {	/* --- set inited flags so that machine calls function correctly. */
        NS.form.setInited( true );
        NS.form.setInited = function (val) { origsetter.call(NS.form, val); origflag = val; };
        if (type != null && linenum == null && column == null)
            linenum = nlapiGetCurrentLineItemIndex(type)
        var fld = nsapiResolveField(type, fldnam, linenum, column);
        if (fld == null)  // bail (for now) if the field cannot be found
            return;
        if (optionswin != null)
            optwin = optionswin;

        if (document.forms['main_form'].elements.wfFC != null && document.forms['main_form'].elements.wfFC.value.length > 0)
        {
            nsapiCallScript( "fieldChanged", "internal", document.forms['main_form'].elements.wfFC.value, [type, fldnam, linenum, column] )
        }
        if (document.forms['main_form'].elements.nsapiFC != null && document.forms['main_form'].elements.nsapiFC.value.length > 0)
        {
            nsapiCallScript( "fieldChanged", "internal", document.forms['main_form'].elements.nsapiFC.value, [type, fldnam, linenum, column] )
        }
        nsFireUserOnChange(type, fldnam, linenum, column);
    }
    finally
    {
        NS.form.setInited = origsetter;
        NS.form.setInited( origflag );
        optwin = null;
    }
}

function nsFireUserOnChange(type, fldnam, linenum, column)
{
    callClientScript("fieldChanged", [type, fldnam, linenum, column]);
}

function nlapiPostSourcing(type, fldnam, linenum)
{
    if (!window.loadcomplete || document.page_is_resetting)
        return;
    var origflag = NS.form.isInited();
    try
    {	/* --- set inited flags so that machine calls function correctly. */
        NS.form.setInited( true );
        linenum = type != null && linenum == null ? nlapiGetCurrentLineItemIndex(type) : linenum;
        if (document.forms['main_form'].elements.wfPS != null && document.forms['main_form'].elements.wfPS.value.length > 0)
        {
            nsapiCallScript( "postSourcing", "internal", document.forms['main_form'].elements.wfPS.value, [type, fldnam, linenum] )
        }
        if (document.forms['main_form'].elements.nsapiPS != null && document.forms['main_form'].elements.nsapiPS.value.length > 0)
        {
            nsapiCallScript( "postSourcing", "internal", document.forms['main_form'].elements.nsapiPS.value, [type, fldnam, linenum] )
        }
        callClientScript("postSourcing", [type, fldnam, linenum]);
    }
    finally	/* unset page_init flags. */
    {
        NS.form.setInited( origflag );
    }

}
function nlapiLineInit(type)
{
    try
    {
        if (document.forms['main_form'].elements.nsapiLI != null && document.forms['main_form'].elements.nsapiLI.value.length > 0)
        {
            nsapiCallScript( "lineInit", "internal", document.forms['main_form'].elements.nsapiLI.value, [type] )
        }
        callClientScript("lineInit", [type]);
    }
    finally
    {
        optwin = null;
    }
}
function nlapiLineCommit(type, linenum)
{
    try
    {
        if (document.forms['main_form'].elements.nsapiLC != null && document.forms['main_form'].elements.nsapiLC.value.length > 0)
        {
            nsapiCallScript( "lineCommit", "internal", document.forms['main_form'].elements.nsapiLC.value, [type, linenum] )
        }
    }
    finally
    {
        optwin = null;
    }
}
function nlapiPostDeleteLine(type, linenum)
{
    try
    {
        if (document.forms['main_form'].elements.nsapiPD != null && document.forms['main_form'].elements.nsapiPD.value.length > 0)
        {
            nsapiCallScript( "postDeleteLine", "internal", document.forms['main_form'].elements.nsapiPD.value, [type, linenum] )
        }
    }
    finally
    {
        optwin = null;
    }
}
function nlapiValidateDelete(type)
{
    try
    {
        var isValid = true;
        if (document.forms['main_form'].elements.nsapiVD != null && document.forms['main_form'].elements.nsapiVD.value.length > 0)
        {
            isValid = nsapiCallScript( "validateDelete", "internal", document.forms['main_form'].elements.nsapiVD.value, [type] )
        }
        isValid = isValid && callClientScript("validateDelete", [type]);
        return isValid;
    }
    finally
    {
        optwin = null;
    }
}
function nlapiValidateInsert(type)
{
    try
    {
        var isValid = true;
        if (document.forms['main_form'].elements.nsapiVI != null && document.forms['main_form'].elements.nsapiVI.value.length > 0)
        {
            isValid = nsapiCallScript( "validateInsert", "internal", document.forms['main_form'].elements.nsapiVI.value, [type] )
        }
        isValid = isValid && callClientScript("validateInsert", [type]);
        return isValid;
    }
    finally
    {
        optwin = null;
    }
}
function nlapiValidateLine(type)
{
    try
    {
        var isValid = true;
        if (document.forms['main_form'].elements.nsapiVL != null && document.forms['main_form'].elements.nsapiVL.value.length > 0)
        {
            isValid = nsapiCallScript("validateLine", "internal", document.forms['main_form'].elements.nsapiVL.value, [type])
            if (!isValid)
                return false;
        }
        isValid = isValid && callClientScript("validateLine", [type]);
        return isValid;
    }
    finally
    {
        optwin = null;
    }
}
function nlapiRecalc(type, localRecalc, operation)
{
    try
    {
        if (localRecalc)
        {
            eval( isEditMachine(type) ? type+'_machine.recalc(!window.loadcomplete)' : type+'RecalcMachine(true)' )
            return;
        }
        operation = operation != null ? operation : "commit";
        if (document.forms['main_form'].elements.nsapiRC != null && document.forms['main_form'].elements.nsapiRC.value.length > 0)
        {
            nsapiCallScript( "recalc", "internal", document.forms['main_form'].elements.nsapiRC.value, [type, operation] )
        }
        callClientScript("recalc", [type, operation]);
    }
    finally
    {
        optwin = null;
    }
}

/*--------------- Utility Functions for Setting/Getting/Manipulating fields and machines for current record ------------*/
var nlapiSetFieldValue = (function(){
    function coreSetFieldValue(fldnam, value, firefieldchanged, synchronous, strictFireFieldChanged)
    {
        nsapiAssertTrue(!isSubrecordField(null, fldnam),  'SSS_INVALID_OPERATION_USING_SUBRECORD_FIELD');
        var unsupported = ' applied unapplied total lastmodifieddate createddate datecreated roi openingbalance ';
        if (nsapiIsInternal() || unsupported.indexOf(' '+getFieldName(fldnam)+' ') == -1)
        {
            var stype = typeof(ftypes) != 'undefined' && ftypes[getFieldName(fldnam)] != null ? ftypes[getFieldName(fldnam)] : null;
            value = process_currency_field_value(value, stype);
            var form = typeof(ftabs) != 'undefined' && ftabs[getFieldName(fldnam)] != null ? document.forms[ftabs[getFieldName(fldnam)]+'_form'] : document.forms['main_form'];
            if (form == null)
                form = document.forms['qadd_form'];
            var fld = getFormElement( form, getFieldName(fldnam) );
            if (fld == null)
                fld = getFormElement( form, getFieldName(fldnam)+"_send" );
            if ( fld != null )
            {
                var slavingOrig = getSlavingAsync();
                try
                {
                    if (synchronous)
                        setSlavingAsync(false);
                    var ids = '', labels = '';
	                // ensure that the value being passed in is numeric (for appropriate fld type)
	                if (strictFireFieldChanged && !Array.isArray(value) && (isNumericField(fld) || isCurrencyField(fld)))
		                value = NLStringToNumber(value);
                    if ( isPopupSelect( fld ) || isPopupMultiSelect( fld ) || isDisplayOnlySelect( fld ) )
                    {
                        var queryValue = value;
                        if(Array.isArray(value))
                            queryValue = value.join(String.fromCharCode(5));

                        var selectmap = NLEntryForm_querySelectText( fldnam, null, null, queryValue );
                        for ( var i in selectmap )
                        {
                            if(selectmap.hasOwnProperty(i))
                            {
                                ids = selectmap[i] != null ? (ids != '' ? ids + String.fromCharCode(5) : '') + i : ids;
                                labels = selectmap[i] != null ? (labels.length > 0 ? labels + String.fromCharCode(5) : '') + selectmap[i] : labels;
                            }
                        }
                    }
                    else
                    {
                        ids = value;
                        labels = null;
                    }
                    setFormValue(fld, ids, labels );
                    if (document.getElementById(fldnam+"_val") != null)
                    {
                        var displayValue = ids;
                        if (stype == "checkbox")
                            displayValue = (ids == "T" ? nsYesString : nsNoString);
                        else if (isNumericField(fld) || isCurrencyField(fld))
                            displayValue = NLNumberToString(ids);
                        setInlineTextValue(document.getElementById(fldnam+"_val"), displayValue);
                    }

                    if (fld.type != "hidden" && nlapiGetField(fldnam).getType() == "radio")
                        fld = getSelectedRadio( fld );

                    nsapiFireOnChange(fld, firefieldchanged, strictFireFieldChanged);
                }
                finally
                {
                    setSlavingAsync(slavingOrig);
                }
            }
            else if (document.getElementById(fldnam+"_val") != null)	// handle DISPLAYONLY|COMPUTED or inlinehtml fields */
            {
                fld = document.getElementById(fldnam+"_val");
                if (isNumericField(fld) || isCurrencyField(fld))
                    value = NLNumberToString(value);
                setInlineTextValue( fld, value );
            }
            else
            {
                if (typeof fieldtosubrecordmap != 'undefined')
                {
                    var subrecordname = fieldtosubrecordmap['main_'+fldnam];
                    if (subrecordname != null && subrecordname.length> 0 )
                    {
                        var subrecordfieldname = fieldtosubrecordfieldmap['main_'+fldnam+'_'+subrecordname];
                        if ( subrecordfieldname != null && subrecordfieldname.length> 0)
                        {
                            var subrecord =  nlapiLoadSubrecord(subrecordname);

                            if (subrecord)
                            {
                                subrecord.setFieldValue(subrecordfieldname,value);
                                nsFireUserOnChange(null,fldnam,null,null);
                            }
                        }
                    }
                }
            }
        }
    }

    function nlapiSetFieldValue(fldnam,value,firefieldchanged,synchronous)
    {
        var strictFireFieldChanged = false;
        coreSetFieldValue(fldnam, value, firefieldchanged, synchronous, strictFireFieldChanged);
    }

    function nlapiSetFieldValueV2(fldnam,value,firefieldchanged,synchronous)
    {
        var strictFireFieldChanged = true;
        coreSetFieldValue(fldnam, value, firefieldchanged, synchronous, strictFireFieldChanged);
    }

    nlapiSetFieldValue.v2 = nlapiSetFieldValueV2;

    return nlapiSetFieldValue;
}());

var nlapiSetSelectValue = (function(){
    function coreSetSelectValue(fldnam, value, label, firefieldchanged, synchronous, strictFireFieldChanged)
    {
        nsapiAssertTrue(!isSubrecordField(null, fldnam),  'SSS_INVALID_OPERATION_USING_SUBRECORD_FIELD');
        var form = typeof(ftabs) != 'undefined' && ftabs[getFieldName(fldnam)] != null ? document.forms[ftabs[getFieldName(fldnam)]+'_form'] : document.forms['main_form'];
        var fld = getFormElement( form, getFieldName(fldnam) );
        if ( fld != null )
        {
            var slavingOrig = getSlavingAsync();
            try
            {
                if (synchronous)
                    setSlavingAsync(false);
                setFormValue(fld, value, label );
                nsapiFireOnChange(fld, firefieldchanged, strictFireFieldChanged);
            }
            finally
            {
                setSlavingAsync(slavingOrig);
            }
        }
    }

    function nlapiSetSelectValue(fldnam, value, label, firefieldchanged, synchronous)
    {
        var strictFireFieldChanged = false;
        coreSetSelectValue(fldnam, value, label, firefieldchanged, synchronous, strictFireFieldChanged);
    }

    function nlapiSetSelectValueV2(fldnam, value, label, firefieldchanged, synchronous)
    {
        var strictFireFieldChanged = true;
        coreSetSelectValue(fldnam, value, label, firefieldchanged, synchronous, strictFireFieldChanged);
    }

    nlapiSetSelectValue.v2 = nlapiSetSelectValueV2;

    return nlapiSetSelectValue;
}());

var nlapiSetMatrixValue = (function(){
    function coreSetMatrixValue(type, name, column, value, firefieldchanged, synchronous, strictFireFieldChanged)
    {
        nsapiAssertTrue(!isSubrecordField(type, name), 'SSS_INVALID_OPERATION_USING_SUBRECORD_FIELD');
        nsapiCheckArgs([type, name, column], ['type', 'name', 'column'], 'nlapiSetMatrixValue');
        if (hasEncodedMatrixField(type, name, column))
        {
            var hdr = getFormValue(document.forms['main_form'].elements[type + "header"]);
            var fld = hdr != null ? getFormElement(nvl(document.forms[type + '_form'], document.forms['main_form']), hdr + column) : null; // sublist could be hidden
            if (fld == null)    // send flag only available when sublist is not hidden
                fld = getFormElement(document.forms[type + '_form'], hdr + column + "_send");
            if (fld != null)
            {
	            // ensure that the value being passed in is numeric (for appropriate fld type)
	            if (strictFireFieldChanged && (isNumericField(fld) || isCurrencyField(fld)))
		            value = NLStringToNumber(value);
                var slavingOrig = getSlavingAsync();
                try
                {
                    if (synchronous)
                        setSlavingAsync(false);
                    setFormValue(fld, value);
                    nsapiFireOnChange(fld, firefieldchanged, strictFireFieldChanged);
                }
                finally
                {
                    setSlavingAsync(slavingOrig);
                }
            }
        }
    }

    function nlapiSetMatrixValue(type, name, column, value, firefieldchanged, synchronous)
    {
        var strictFireFieldChanged = false;
        coreSetMatrixValue(type, name, column, value, firefieldchanged, synchronous, strictFireFieldChanged);
    }

    function nlapiSetMatrixValueV2(type, name, column, value, firefieldchanged, synchronous)
    {
        var strictFireFieldChanged = true;
        coreSetMatrixValue(type, name, column, value, firefieldchanged, synchronous, strictFireFieldChanged);
    }

    nlapiSetMatrixValue.v2 = nlapiSetMatrixValueV2;

    return nlapiSetMatrixValue;
}());

function nlapiSetFieldValues(fldnam,values,firefieldchanged,synchronous)
{
    nsapiAssertTrue(!isSubrecordField(null, fldnam),  'SSS_INVALID_OPERATION_USING_SUBRECORD_FIELD');
    var fldObj = nlapiGetField(fldnam)
    if ( fldObj == null || fldObj.getType() != "multiselect" )
        return;

    nlapiSetFieldValue(fldnam, values != null ? values.join(String.fromCharCode(5)) : "", firefieldchanged, synchronous);
}

var nlapiSetFieldText = (function(){
    function coreSetFieldText(fldnam, txt, firefieldchanged, synchronous, strictFireFieldChanged)
    {
        var fldObj = nlapiGetField(fldnam);
        if ( fldObj == null || fldObj.getType().indexOf("select") == -1 )
            return;
        txt = resolveDeprecatedFieldText(fldnam, txt);
        var form = typeof(ftabs) != 'undefined' && ftabs[getFieldName(fldnam)] != null ? document.forms[ftabs[getFieldName(fldnam)]+'_form'] : document.forms['main_form'];
        var sel = getFormElement( form, getFieldName(fldnam) );
        if ( isPopupSelect( sel ) ) /* add trailing backslash to query text to facilitate exact-match queries (EQUALS filter versus STARTSWITH) unless the % trailing wildcard is used */
        {
            var fld = getFormElement( form, getFieldName(fldnam)+"_display" );
            var startsWithSearch = !isValEmpty( txt ) && txt.charAt( txt.length - 1 ) == '%';
            try
            {   /* strip out user-specified trailing slash or wildcard whenever applicable. */
                fld.value = startsWithSearch || (!isValEmpty( txt ) && txt.charAt( txt.length - 1 ) == '\\') ? txt.substring(0, txt.length - 1) : txt;
                NLPopupSelect_setExactMatchQuery( fld, !startsWithSearch );
                var slavingOrig = getSlavingAsync();
                try
                {
                    if (synchronous)
                        setSlavingAsync(false);
                    nsapiFireOnChange(fld, firefieldchanged, strictFireFieldChanged);
                }
                finally
                {
                    setSlavingAsync(slavingOrig);
                }
            }
            finally
            {
                NLPopupSelect_setExactMatchQuery( fld, false );
            }
        }
        else if ( fldObj.getType() == "multiselect" )
        {
            var ids = [];
            var texts = txt != null ? (""+txt).split(String.fromCharCode(5)) : [];
            for ( var i = 0; i < texts.length; i++ )
                ids[i] = getSelectValueForText(sel,texts[i])
            nlapiSetFieldValues(fldnam,ids,firefieldchanged,synchronous);
        }
        else if ( fldObj.isHidden() )
        {
            if ( isValEmpty(txt) )
                nlapiSetFieldValue(fldnam,txt,firefieldchanged,synchronous);
            else
            {
                var selectmap = NLEntryForm_querySelectValue( fldnam, null, txt );
                //Issue 379606: Add logging with more information when calling nlapiGetFieldText on hidden fields in NLCORP
                if (nlapiGetContext().getCompany() === 'NLCORP')
                    nsServerCall(nsJSONProxyURL,'logErrorDbAudit', ['NLEntryForm_querySelectValue triggered on hidden field: ' + fldnam, 'recordType: ' + nlapiGetRecordType() + ', recordId: ' + nlapiGetRecordId() + ', cf: ' + nlapiGetFieldValue('customform') + ', scriptId: ' + nlapiGetContext().getScriptId()],null,'GET');
                nlapiSetFieldValue(fldnam,selectmap != null ? selectmap[txt] : '',firefieldchanged,synchronous);
            }
        }
        else
        {
            nlapiSetFieldValue(fldnam,getSelectValueForText(sel,txt),firefieldchanged,synchronous);
        }
    }

    function nlapiSetFieldText(fldnam, txt, firefieldchanged, synchronous)
    {
        var strictFireFieldChanged = false;
        coreSetFieldText(fldnam, txt, firefieldchanged, synchronous, strictFireFieldChanged);
    }

    function nlapiSetFieldTextV2(fldnam, txt, firefieldchanged, synchronous)
    {
        var strictFireFieldChanged = true;
        coreSetFieldText(fldnam, txt, firefieldchanged, synchronous, strictFireFieldChanged);
    }

    nlapiSetFieldText.v2 = nlapiSetFieldTextV2;

    return nlapiSetFieldText;
}());

var nlapiSetFieldTexts = (function(){
    function coreSetFieldTexts(fldnam, texts, firefieldchanged, synchronous, strictFireFieldChanged)
    {
        var fldObj = nlapiGetField(fldnam);
        if (fldObj == null || fldObj.getType() != "multiselect")
            return null;

        var form = typeof(ftabs) != 'undefined' && ftabs[getFieldName(fldnam)] != null ? document.forms[ftabs[getFieldName(fldnam)]+'_form'] : document.forms['main_form'];
        var fld = getFormElement( form, getFieldName(fldnam) );
        if ( !isMultiSelect(fld) && !isPopupMultiSelect(fld) )
            return;

        if ( texts == null || texts.length == 0 )
        {
            nlapiSetFieldValues(fldnam, [], firefieldchanged, synchronous);
        }
        else if ( isPopupMultiSelect( fld ) || isDisplayOnlySelect( fld ) )	/* add trailing backslash to query text to facilitate exact-match queries (EQUALS filter versus STARTSWITH) unless the % trailing wildcard is used */
        {
            var slavingOrig = getSlavingAsync();
            try
            {
                if (synchronous)
                    setSlavingAsync(false);
                var ids = '', labels = '';
                var selectmap = NLEntryForm_querySelectValue( fldnam, null, texts.join(String.fromCharCode(5)) );
                for ( var i in selectmap )
                {
                    if(selectmap.hasOwnProperty(i))
                    {
                        ids = selectmap[i] != null ? (ids != '' ? ids + String.fromCharCode(5) : '') + selectmap[i] : ids;
                        labels = selectmap[i] != null ? (labels != '' ? labels + String.fromCharCode(5) : '') + i : labels;
                    }
                }
                setFormValue(fld, ids, labels);
                nsapiFireOnChange(fld, firefieldchanged, strictFireFieldChanged);
            }
            finally
            {
                setSlavingAsync(slavingOrig);
            }
        }
        else
        {
            var ids = [];
            for ( var i = 0; i < texts.length; i++ )
                ids[i] = getSelectValueForText(fld,texts[i])
            nlapiSetFieldValues(fldnam,ids,firefieldchanged,synchronous);
        }
    }

    function nlapiSetFieldTexts(fldnam, texts, firefieldchanged, synchronous)
    {
        var strictFireFieldChanged = false;
        coreSetFieldTexts(fldnam, texts, firefieldchanged, synchronous, strictFireFieldChanged);
    }

    function nlapiSetFieldTextsV2(fldnam, texts, firefieldchanged, synchronous)
    {
        var strictFireFieldChanged = true;
        coreSetFieldTexts(fldnam, texts, firefieldchanged, synchronous, strictFireFieldChanged);
    }

    nlapiSetFieldTexts.v2 = nlapiSetFieldTextsV2;

    return nlapiSetFieldTexts;
}());

function nlapiGetFieldValue(fldnam)
{
    nsapiAssertTrue(!isSubrecordField(null, fldnam),  'SSS_INVALID_OPERATION_USING_SUBRECORD_FIELD');

    if (typeof fieldtosubrecordmap != 'undefined')
    {
        var subrecordname = fieldtosubrecordmap['main_'+ fldnam];

        if (subrecordname != null && subrecordname.length> 0 )
        {
            var subrecordfieldname = fieldtosubrecordfieldmap['main_'+ fldnam+'_'+ subrecordname];
            if ( subrecordfieldname != null && subrecordfieldname.length> 0)
            {
                var subrecord =  nlapiLoadSubrecord(subrecordname);

                if (subrecord)
                {
                    return subrecord.getFieldValue(subrecordfieldname);
                }
            }
        }
    }
    var form = typeof(ftabs) != 'undefined' && ftabs[getFieldName(fldnam)] != null ? document.forms[ftabs[getFieldName(fldnam)]+'_form'] : document.forms['main_form'];
    if (form == null)
        form = document.forms['qadd_form'];
    var stype = typeof(ftypes) != 'undefined' && ftypes[getFieldName(fldnam)] != null ? ftypes[getFieldName(fldnam)] : null;
    var fld = getFormElement( form, getFieldName(fldnam) );
    if (fld == null)
        fld = getFormElement( form, getFieldName(fldnam)+"_send" );
    var value;
    if (fld == null && document.getElementById(fldnam+"_val") != null)
    {
        fld = document.getElementById(fldnam+"_val");
        value = getInlineTextValue( fld );
        if (isNumericField(fld) || isCurrencyField(fld))
            value = NLStringToNumber(value);
    }
    else
        value = getFormValue(fld);
    return isValEmpty(value) && stype == "checkbox" ? 'F' : value;
}
function nlapiGetFieldValues(fldnam)
{
    nsapiAssertTrue(!isSubrecordField(null, fldnam),  'SSS_INVALID_OPERATION_USING_SUBRECORD_FIELD');
    var fldObj = nlapiGetField(fldnam)
    if (fldObj == null || fldObj.getType() != "multiselect")
        return null;
    if (fldObj.isHidden())
        return nlapiGetFieldValue(fldnam).split(String.fromCharCode(5))
    var form = typeof(ftabs) != 'undefined' && ftabs[getFieldName(fldnam)] != null ? document.forms[ftabs[getFieldName(fldnam)]+'_form'] : document.forms['main_form'];
    var fld = getFormElement( form, getFieldName(fldnam) );
    if (fld == null)
        fld = getFormElement( form, getFieldName(fldnam)+"_send" );
    return isMultiSelect(fld) || isPopupMultiSelect(fld) ? getFormValue(fld, true) : null;
}
function nlapiGetFieldTextOrValue(fldnam)
{
    var bUseId = false;
    if (fldnam.indexOf(".") > 0)
    {
        fldnam = fldnam.substr(0,fldnam.indexOf("."))
        bUseId = true;
    }
    var fldObj = nlapiGetField(fldnam)
    if ( fldObj == null )
        return null;
    else if (bUseId || fldObj.getType().indexOf("select") == -1 )
        return nlapiGetFieldValue(fldnam)
    else
        return nlapiGetFieldText(fldnam);
}
function nlapiGetFieldText(fldnam)
{
    var fldObj = nlapiGetField(fldnam)
    if ( fldObj == null || fldObj.getType().indexOf("select") == -1 )
        return null;
    if (document.getElementById(fldnam+"_displayval") != null)
        return getInlineTextValue(document.getElementById(fldnam+"_displayval"));
    var form = typeof(ftabs) != 'undefined' && ftabs[getFieldName(fldnam)] != null ? document.forms[ftabs[getFieldName(fldnam)]+'_form'] : document.forms['main_form'];
    var fld = getFormElement( form, getFieldName(fldnam) );
    if (fld != null)
    {
        if (fldObj.isHidden())
        {
            var val = nlapiGetFieldValue(fldnam);
            if (isValEmpty(val))
                return "";
            else
            {
                var labels = NLEntryForm_querySelectText( fldnam, null, null, val )
                //Issue 379606: Add logging with more information when calling nlapiGetFieldText on hidden fields in NLCORP
                if (nlapiGetContext().getCompany() === 'NLCORP')
                    nsServerCall(nsJSONProxyURL,'logErrorDbAudit', ['NLEntryForm_querySelectText triggered on hidden field: ' + fldnam, 'recordType: ' + nlapiGetRecordType() + ', recordId: ' + nlapiGetRecordId() + ', cf: ' + nlapiGetFieldValue('customform') + ', scriptId: ' + nlapiGetContext().getScriptId()],null,'GET');
                return labels != null ? labels[val] : "";
            }
        }
        if (fldObj.getType() == "multiselect")
            return getSelectText( fld, true ).join(String.fromCharCode(5))
        return getSelectText(fld);
    }
    return null;
}
function nlapiGetMatrixValue(type, name, column)
{
    nsapiAssertTrue(!isSubrecordField(type, name),  'SSS_INVALID_OPERATION_USING_SUBRECORD_FIELD');
    nsapiCheckArgs( [type, name, column], ['type', 'name', 'column'], 'nlapiGetMatrixValue' );
    if ( hasEncodedMatrixField(type, name, column) )
    {
        var header = getFormValue( document.forms['main_form'].elements[type+"header"] )
        if ( header != null )
            return getFormValue(getFormElement( nvl(document.forms[type+'_form'],document.forms['main_form']), header+column )); // sublist could be hidden
    }
    return null;
}
function nlapiGetFieldTexts(fldnam)
{
    var fldObj = nlapiGetField(fldnam)
    if (fldObj == null || fldObj.getType() != "multiselect")
        return null;
    if (fldObj.isHidden())
    {
        var val = nlapiGetFieldValue(fldnam);
        if (isValEmpty(val))
            return [];
        else
        {
            var labels = []
            var query = NLEntryForm_querySelectText(fldnam, null, null, val)
            for (var i in query)
                if(query.hasOwnProperty(i))
                    labels.push(query[i])
            return labels;
        }
    }
    else if (document.getElementById(fldnam+"_displayval") != null)
    {
        var x = getInlineTextValue(document.getElementById(fldnam+"_displayval"));
        return isValEmpty(x) ? [] : x.split('\n');
    }
    var form = typeof(ftabs) != 'undefined' && ftabs[getFieldName(fldnam)] != null ? document.forms[ftabs[getFieldName(fldnam)]+'_form'] : document.forms['main_form'];
    var fld = getFormElement( form, getFieldName(fldnam) );
    return isMultiSelect(fld) || isPopupMultiSelect(fld) ? getSelectText( fld, true ) : null;
}
function nlapiSetCurrentLineItemValues(type,fldnam,values,firefieldchanged,synchronous)
{
    nlapiSetCurrentLineItemValue(type, fldnam, values != null ? values.join(String.fromCharCode(5)) : "", firefieldchanged, synchronous);
}

var nlapiSetCurrentLineItemValue = (function()
{
    function coreSetCurrentLineItemValue(type, fldnam, value, firefieldchanged, synchronous, strictFireFieldChanged)
    {
        nsapiAssertTrue(!isSubrecordField(type, fldnam), 'SSS_INVALID_OPERATION_USING_SUBRECORD_FIELD');
        if (hasEncodedField(type, fldnam))
        {
            value = process_currency_field_value(value, getEncodedFieldType(type, fldnam));
            var linenum = isEditMachine(type) ? "" : emptyIfNull(nlapiGetCurrentLineItemIndex(type));
            var fld = getFormElement(document.forms[type.toLowerCase() + '_form'], getFieldName(fldnam) + linenum);
            var slavingOrig = getSlavingAsync();
            try
            {
                if (synchronous)
                    setSlavingAsync(false);
                // ensure that the value being passed in is numeric (for appropriate fld type)
                if (strictFireFieldChanged && (isNumericField(fld) || isCurrencyField(fld)))
                    value = NLStringToNumber(value);
                var text = null;
                if (isPopupSelect(fld) || isPopupMultiSelect(fld))
                {
                    var selectmap = NLEntryForm_querySelectText(fldnam, type, linenum, value);
                    for (var i in selectmap)
                    {
                        if (selectmap.hasOwnProperty(i))
                            text = (text != null ? text + String.fromCharCode(5) : '') + selectmap[i];
                    }
                }
                setFormValue(fld, value, text);
                nsapiFireOnChange(fld, firefieldchanged, strictFireFieldChanged);
            }
            finally
            {
                setSlavingAsync(slavingOrig);
            }
        }
        else if (hasEncodedField(type, "options"))
        {
            if (optwin != null)
            {
                var fld = optwin.document.forms[0].elements[getFieldName(fldnam)];
                setFormValue(fld, value);
                nsapiFireOnChange(fld, firefieldchanged, strictFireFieldChanged);
            }
            else
            {
                var optionsfld = document.forms[type.toLowerCase() + '_form'].options;
                optionsfld.value = setnamevaluelistvalue(optionsfld.value, fldnam, value);
                syncnamevaluelist(optionsfld);
            }
        }
        else
        {
            if (typeof fieldtosubrecordmap != 'undefined')
            {
                var subrecordname = fieldtosubrecordmap[type + '_' + fldnam];
                if (subrecordname != null && subrecordname.length > 0)
                {
                    var subrecordfieldname = fieldtosubrecordfieldmap[type + '_' + fldnam + '_' + subrecordname];
                    if (subrecordfieldname != null && subrecordfieldname.length > 0)
                    {
                        var subrecord = nlapiLoadCurrentLineItemSubrecord(type, subrecordname, true);

                        if (subrecord)
                        {
                            subrecord.setFieldValue(subrecordfieldname, value);
                            nsFireUserOnChange(type, fldnam, linenum, null);
                        }
                    }
                }
            }
        }
    }

    function nlapiSetCurrentLineItemValue(type, fldnam, value, firefieldchanged, synchronous)
    {
        var strictFireFieldChanged = false;
        coreSetCurrentLineItemValue(type, fldnam, value, firefieldchanged, synchronous, strictFireFieldChanged);
    }

    function nlapiSetCurrentLineItemValueV2(type, fldnam, value, firefieldchanged, synchronous)
    {
        var strictFireFieldChanged = true;
        coreSetCurrentLineItemValue(type, fldnam, value, firefieldchanged, synchronous, strictFireFieldChanged);
    }

    nlapiSetCurrentLineItemValue.v2 = nlapiSetCurrentLineItemValueV2;

    return nlapiSetCurrentLineItemValue;
}());

var nlapiSetCurrentLineItemSelectValue = (function(){
    function coreSetCurrentLineItemSelectValue(type, fldnam, value, label, firefieldchanged, synchronous, strictFireFieldChanged)
    {
        nsapiAssertTrue(!isSubrecordField(type, fldnam),  'SSS_INVALID_OPERATION_USING_SUBRECORD_FIELD');
        if (hasEncodedField(type, fldnam))
        {
            var linenum = isEditMachine(type) ? "" : emptyIfNull(nlapiGetCurrentLineItemIndex(type));
            var fld = getFormElement( document.forms[type.toLowerCase()+'_form'], getFieldName(fldnam)+linenum );
            var slavingOrig = getSlavingAsync();
            try
            {
                if (synchronous)
                    setSlavingAsync(false);
                if (strictFireFieldChanged && (isNumericField(fld) || isCurrencyField(fld)))
                    value = NLStringToNumber(value);
                setFormValue(fld, value, label );
                nsapiFireOnChange(fld, firefieldchanged, strictFireFieldChanged);
            }
            finally
            {
                setSlavingAsync(slavingOrig);
            }
        }
    }

    function nlapiSetCurrentLineItemSelectValue(type, fldnam, value, label, firefieldchanged, synchronous)
    {
        var strictFireFieldChanged = false;
        coreSetCurrentLineItemSelectValue(type, fldnam, value, label, firefieldchanged, synchronous, strictFireFieldChanged);
    }

    function nlapiSetCurrentLineItemSelectValueV2(type, fldnam, value, label, firefieldchanged, synchronous)
    {
        var strictFireFieldChanged = true;
        coreSetCurrentLineItemSelectValue(type, fldnam, value, label, firefieldchanged, synchronous, strictFireFieldChanged);
    }

    nlapiSetCurrentLineItemSelectValue.v2 = nlapiSetCurrentLineItemSelectValueV2;

    return nlapiSetCurrentLineItemSelectValue;
}());

function nlapiSetCurrentLineItemMatrixValue(type,fldnam,column,value,firefieldchanged,synchronous)
{
    nsapiAssertTrue(!isSubrecordField(type, fldnam),  'SSS_INVALID_OPERATION_USING_SUBRECORD_FIELD');
    nsapiCheckArgs( [type, fldnam, column], ['type', 'fldnam', 'column'], 'nlapiSetCurrentLineItemMatrixValue' );
    if (hasEncodedMatrixField(type, fldnam, column))
        nlapiSetCurrentLineItemValue( type, getMatrixFieldName(type, fldnam, column), value, firefieldchanged, synchronous )
}

var nlapiSetCurrentLineItemText = (function(){
    function coreSetCurrentLineItemText(type, fldnam, txt, firefieldchanged, synchronous, strictFireFieldChanged)
    {
        var sel;
        if (hasEncodedField(type, fldnam))
            sel = getFormElement( document.forms[type.toLowerCase()+'_form'], getFieldName(fldnam) );
        else if (optwin != null)
            sel = optwin.document.forms[0].elements[getFieldName(fldnam)];
        else
            return;
        if ( isPopupSelect( sel ) )	/* add trailing backslash to query text to facilitate exact-match queries (EQUALS filter versus STARTSWITH) unless the % trailing wildcard is used */
        {
            var fld = sel.form.elements[getFieldName(fldnam)+"_display"];
            var startsWithSearch = !isValEmpty( txt ) && txt.charAt( txt.length - 1 ) == '%';
            try
            {   /* strip out user-specified trailing slash or wildcard whenever applicable. */
                fld.value = startsWithSearch || (!isValEmpty( txt ) && txt.charAt( txt.length - 1 ) == '\\') ? txt.substring(0, txt.length - 1) : txt;
                NLPopupSelect_setExactMatchQuery( fld, !startsWithSearch );
                var slavingOrig = getSlavingAsync();
                try
                {
                    if (synchronous)
                        setSlavingAsync(false);
                    nsapiFireOnChange(fld, firefieldchanged, strictFireFieldChanged);
                }
                finally
                {
                    setSlavingAsync(slavingOrig);
                }
            }
            finally
            {
                NLPopupSelect_setExactMatchQuery( fld, false );
            }
        }
        else
            nlapiSetCurrentLineItemValue(type,fldnam,getSelectValueForText(sel,txt),firefieldchanged, synchronous);
    }

    function nlapiSetCurrentLineItemText(type, fldnam, txt, firefieldchanged, synchronous)
    {
        var strictFireFieldChanged = false;
        coreSetCurrentLineItemText(type, fldnam, txt, firefieldchanged, synchronous, strictFireFieldChanged);
    }

    function nlapiSetCurrentLineItemTextV2(type, fldnam, txt, firefieldchanged, synchronous)
    {
        var strictFireFieldChanged = true;
        coreSetCurrentLineItemText(type, fldnam, txt, firefieldchanged, synchronous, strictFireFieldChanged);
    }

    nlapiSetCurrentLineItemText.v2 = nlapiSetCurrentLineItemTextV2;

    return nlapiSetCurrentLineItemText;
}());

function nlapiGetCurrentLineItemValue(type,fldnam)
{
    nsapiAssertTrue(!isSubrecordField(type, fldnam),  'SSS_INVALID_OPERATION_USING_SUBRECORD_FIELD');
    if (hasEncodedField(type, fldnam))
    {
        if ( isEditMachine(type) )
            return getFormValue(getFormElement( document.forms[type.toLowerCase()+'_form'], getFieldName(fldnam) ));
        else
        {
            var linenum = nlapiGetCurrentLineItemIndex(type);
            if ( getEncodedFieldType(type, fldnam) == "radio" )
                return getRadioValue( getFormElement( document.forms[type.toLowerCase()+'_form'], getFieldName(fldnam) ) ) == linenum ? 'T' : 'F';

            if (fldnam.indexOf('_display') > 0)
            {    // insert the line number into the display field name if it is a popup select or popup multiselect
                var hiddenFldName = fldnam.replace('_display','') +  linenum;
                var hiddenFld = getFormElement(document.forms[type.toLowerCase()+'_form'],hiddenFldName);
                if (isPopupSelect(hiddenFld) || isPopupMultiSelect(hiddenFld))
                    fldnam = hiddenFldName.toLowerCase() + '_display';
                else
                    fldnam = getFieldName(fldnam)+linenum;
            }
            else
                fldnam = getFieldName(fldnam)+linenum;

            return getFormValue(getFormElement( document.forms[type.toLowerCase()+'_form'], fldnam));
        }
    }
    else if (hasEncodedField(type, "options"))
    {
        if (optwin != null)
            return optwin.getFormValue(optwin.document.forms[0].elements[getFieldName(fldnam)]);
        else
            return getnamevaluelistvalue(document.forms[type.toLowerCase()+'_form'].options.value,fldnam);
    }
    else
    {
        if (typeof fieldtosubrecordmap != 'undefined')
        {
            var subrecordname = fieldtosubrecordmap[type+'_'+fldnam];
            if (subrecordname != null && subrecordname.length> 0 )
            {
                var subrecordfieldname = fieldtosubrecordfieldmap[type+'_'+fldnam+'_'+subrecordname];
                if ( subrecordfieldname != null && subrecordfieldname.length> 0)
                {
                    var subrecord =  nlapiLoadCurrentLineItemSubrecord(type, subrecordname,false);
                    if (subrecord)
                    {
                        return subrecord.getFieldValue(subrecordfieldname);
                    }
                }
            }
        }
    }
    return null;
}

function nlapiGetCurrentLineItemMatrixValue(type,fldnam, column)
{
    nsapiAssertTrue(!isSubrecordField(type, fldnam),  'SSS_INVALID_OPERATION_USING_SUBRECORD_FIELD');
    nsapiCheckArgs( [type, fldnam, column], ['type', 'fldnam', 'column'], 'nlapiGetCurrentLineItemMatrixValue' );
    if (hasEncodedMatrixField(type, fldnam, column))
        return nlapiGetCurrentLineItemValue( type, getMatrixFieldName(type, fldnam, column) )
    else
        return null;
}
function nlapiGetCurrentLineItemText(type,fldnam)
{
    if (hasEncodedField(type, fldnam))
    {
        var linenum = isEditMachine(type) ? '' : nlapiGetCurrentLineItemIndex(type);
        var fld = getFormElement( document.forms[type.toLowerCase()+'_form'], getFieldName(fldnam)+linenum );
        if(fld != null)
        {
            var fldObj = nlapiGetLineItemField(type, fldnam);
            if (fldObj !=null && fldObj.getType() == "multiselect")
                return getSelectText( fld, true ).join(String.fromCharCode(5));
            else
                return  getSelectText( fld );
        }
        else
        {
            return null;
        }
    }
    else if (hasEncodedField(type, "options"))
    {
        if (optwin != null)
            return optwin.getSelectText(optwin.document.forms[0].elements[getFieldName(fldnam)]);
        else
            return getnamevaluelistdisplayvalue(document.forms[type.toLowerCase()+'_form'].options.value,fldnam);
    }
    else
        return null;
}
function nlapiGetCurrentLineItemTexts(type, fldnam)
{
    var fldObj = nlapiGetLineItemField(type, fldnam);
    if (fldObj == null || fldObj.getType() != "multiselect")
        return null;
    if (hasEncodedField(type, fldnam))
    {
        var linenum = isEditMachine(type) ? '' : nlapiGetCurrentLineItemIndex(type);
        var fld = getFormElement( document.forms[type.toLowerCase()+'_form'], getFieldName(fldnam)+linenum );
        if(fld != null)
        {
            return getSelectText( fld, true );
        }
        else
        {
            return null;
        }
    }
}
function nlapiFindLineItemValue(type, fldnam, val)
{
    nsapiAssertTrue(!isSubrecordField(type, fldnam),  'SSS_INVALID_OPERATION_USING_SUBRECORD_FIELD');
    nsapiCheckArgs( [type, fldnam], ['type', 'fldnam'], 'nlapiFindLineItemValue' );
    if (hasEncodedField(type, fldnam))
        return findEncodedValue(type, fldnam, val)
    return -1;
}
function nlapiFindLineItemMatrixValue(type, fldnam, val, column)
{
    nsapiAssertTrue(!isSubrecordField(type, fldnam),  'SSS_INVALID_OPERATION_USING_SUBRECORD_FIELD');
    nsapiCheckArgs( [type, fldnam, column], ['type', 'fldnam', 'column'], 'nlapiFindLineItemMatrixValue' );
    if (hasEncodedMatrixField(type, fldnam, column))
        fldnam = getMatrixFieldName(type, fldnam, column);
    if (hasEncodedField(type, fldnam))
        return findEncodedValue(type, fldnam, val)
    return -1;
}
function nlapiSourceField(fldnam, fieldspec)
{
    nsapiCheckArgs( [fldnam, fieldspec], ['fldnam', 'fieldspec'], 'nlapiSourceField' );
    var fieldspecArg = fieldspec === false ? false : typeof(fieldspec) == "string" ? "'"+fieldspec+"'" : (fieldspec === true ? true : '');
    if (eval('typeof(Sync'+fldnam+')') == "function")
    {
        var slavingOrig = getSlavingAsync();
        try
        {
            setSlavingAsync(false);
            eval("Sync"+fldnam+"("+fieldspecArg+")");
        }
        finally
        {
            setSlavingAsync(slavingOrig);
        }
    }
}
function nlapiSourceLineItemField(type, fldnam, fieldspec, linenum)
{
    var slavingOrig = getSlavingAsync();
    var linenumArg = isEditMachine( type ) ? "" : ", "+linenum
    var fieldspecArg = fieldspec === false ? false : typeof(fieldspec) == "string" ? "'"+fieldspec+"'" : true;
    try
    {
        setSlavingAsync(false);
        if (eval('typeof(Sync'+fldnam+type+')') == "function")
            eval("Sync"+fldnam+type+"("+fieldspecArg+linenumArg+")");
        else if (eval('typeof(Sync'+fldnam+')') == "function")
            eval("Sync"+fldnam+"("+fieldspecArg+linenumArg+")");
    }
    finally
    {
        setSlavingAsync(slavingOrig);
    }
}
function nlapiFireOnChange(fldnam)
{
    var form = typeof(ftabs) != 'undefined' && ftabs[getFieldName(fldnam)] != null ? document.forms[ftabs[getFieldName(fldnam)]+'_form'] : document.forms['main_form'];
    var fld = getFormElement( form, getFieldName(fldnam) );
    if (fld == null)
        fld = getFormElement( form, getFieldName(fldnam)+"_send" );
    if ( fld != null )
    {
        if (nlapiGetField(fldnam).getType() == "radio")
            fld = getSelectedRadio( fld );
        nsapiFireOnChange(fld, true);
    }
}
function nlapiFireLineItemOnChange(type, fldnam, linenum)
{
    var form = document.forms[type+'_form'];
    var fld = getFormElement( form, getFieldName(fldnam) );
    if ( fld != null )
    {
        linenum = isEditMachine( type ) ? "" : linenum;
        if (nlapiGetLineItemField(type, fldnam, linenum).getType() == "radio")
            fld = getSelectedRadio( fld );
        nsapiFireOnChange(fld, true);
    }
}
function nlapiSetLineItemValue(type,fldnam,linenum,value)
{
    nsapiAssertTrue(!isSubrecordField(type, fldnam),  'SSS_INVALID_OPERATION_USING_SUBRECORD_FIELD');
    if ( linenum == null || linenum < 0 || linenum > nlapiGetLineItemCount( type ) )   // should throw SSS_INVALID_SUBLIST_OPERATION if not for backward compatibility
        return;

    if (nsapiIsInternal() || type != 'item' || /(description|(revrec).+|(custcol).+)/.test(getFieldName(fldnam)))
    {
        value = process_currency_field_value(value, getEncodedFieldType(type, fldnam));
        if (hasEncodedField(type, fldnam))
        {
            setEncodedValue(type.toLowerCase(),linenum,getFieldName(fldnam),value);
            if ( isEditMachine(type) )
                nsUpdatedMachines[type.toLowerCase()] = 1;
            else if ( nsapiGetCurrentSegment(type) == nsapiGetSegmentForLine(type, linenum) )
                setFormValues( type, linenum, document.forms[type+'_form'], fldnam );
        }
        else if (hasEncodedField(type, "options"))
        {
            setEncodedValue(type.toLowerCase(),linenum,"options",setnamevaluelistvalue(getEncodedValue(type,linenum,"options"),fldnam,value));
            nsUpdatedMachines[type.toLowerCase()] = 1;
        }
        else
        {
            if (typeof fieldtosubrecordmap != 'undefined')
            {
                var subrecordname = fieldtosubrecordmap[type+'_'+fldnam];
                if (subrecordname != null && subrecordname.length> 0 )
                {
                    var subrecordfieldname = fieldtosubrecordfieldmap[type+'_'+fldnam+'_'+subrecordname];
                    if ( subrecordfieldname != null && subrecordfieldname.length> 0)
                    {
                        var subrecord =  nlapiLoadLineItemSubrecord(type,subrecordname, linenum);

                        if (subrecord)
                        {
                            subrecord.setFieldValue(subrecordfieldname,value);
                            nsFireUserOnChange(type,fldnam,linenum,null);
                        }
                    }
                }
            }
        }
    }
}
function nlapiSetLineItemMatrixValue(type,fldnam,linenum,column,value)
{
    nsapiAssertTrue(!isSubrecordField(type, fldnam),  'SSS_INVALID_OPERATION_USING_SUBRECORD_FIELD');
    if (hasEncodedMatrixField(type, fldnam, column))
        nlapiSetLineItemValue(type, getMatrixFieldName(type, fldnam, column), linenum, value)
}
function nlapiGetLineItemValue(type,fldnam,linenum)
{
    nsapiAssertTrue(!isSubrecordField(type, fldnam),  'SSS_INVALID_OPERATION_USING_SUBRECORD_FIELD');
    if (hasEncodedField(type, fldnam))
        return getEncodedValue(type.toLowerCase(),linenum,getFieldName(fldnam));
    else if (hasEncodedField(type, "options"))
        return getnamevaluelistvalue(getEncodedValue(type.toLowerCase(),linenum,"options"),fldnam);
    else
    {
        if (typeof fieldtosubrecordmap != 'undefined')
        {
            var subrecordname = fieldtosubrecordmap[type+'_'+fldnam];
            if (subrecordname != null && subrecordname.length> 0 )
            {
                var subrecordfieldname = fieldtosubrecordfieldmap[type+'_'+fldnam+'_'+subrecordname];
                if ( subrecordfieldname != null && subrecordfieldname.length> 0)
                {
                    var subrecord =  nlapiLoadLineItemSubrecord(type, subrecordname, linenum);

                    if (subrecord)
                    {
                        return subrecord.getFieldValue(subrecordfieldname);
                    }
                }
            }
        }
    }
    return null;
}
function nlapiGetLineItemMatrixValue(type,fldnam,linenum,column)
{
    nsapiAssertTrue(!isSubrecordField(type, fldnam),  'SSS_INVALID_OPERATION_USING_SUBRECORD_FIELD');
    if (hasEncodedMatrixField(type, fldnam, column))
        return nlapiGetLineItemValue(type,getMatrixFieldName(type, fldnam, column),linenum);
    return null;
}
function nlapiGetLineItemText(type,fldnam,linenum)
{
    var sel = getFormElement( document.forms[type.toLowerCase()+'_form'], getFieldName(fldnam) );
    if ( linenum != null && !isEditMachine(type) )
        sel = getFormElement( document.forms[type.toLowerCase()+'_form'], getFieldName(fldnam)+linenum )
    if ( sel == null )
        return null;
    else if (!isNLDropDown(sel) && sel.type == 'hidden')
        return getEncodedValue(type.toLowerCase(),linenum,getFieldName(fldnam)+"_display");
    else
        return getlisttext(sel,getEncodedValue(type.toLowerCase(),linenum,getFieldName(fldnam)));
}
function nlapiGetLineItemTexts(type,fldnam,linenum)
{
    var fldObj = nlapiGetLineItemField(type, fldnam);
    if (fldObj == null || fldObj.getType() != "multiselect")
        return null;
    var value = nlapiGetLineItemText(type, fldnam, linenum);
    if(value != null)
        return value.split(String.fromCharCode(5));
    else
        return null;
}
function nlapiGetCurrentLineItemIndex(type)
{
    return getFormValue( getFormElement( document.forms[type.toLowerCase()+"_form"], 'lineindex' ) );
}
function nlapiSetLineItemTotal(type,total)
{
    var displayTotal = NLNumberToString(total);
    if ( hasLineItemGroup(type) && document.getElementById(type+'_total') != null )
        document.getElementById(type+'_total').innerHTML = displayTotal;
    else
    {
        if (undefined==window.hiddenLineItemTotal)
        {
            window.hiddenLineItemTotal = {};
        }
        window.hiddenLineItemTotal[type+'_total'] = displayTotal;
    }
}

function nlapiGetLineItemTotal(type)
{
    var displayTotal = null;
    var typeTotal = type + '_total';

    if (hasLineItemGroup(type) && document.getElementById(typeTotal) != null)
    {
        displayTotal = document.getElementById(typeTotal).innerHTML;
    }
    else if (undefined != window.hiddenLineItemTotal && undefined != window.hiddenLineItemTotal[typeTotal])
    {
        displayTotal = hiddenLineItemTotal[typeTotal];
    }

    if (displayTotal.length != null)
        return NLStringToNumber(displayTotal);

    return null;
}

function nlapiGetField(fldnam)
{
    if (typeof(ftabs) == 'undefined' && typeof(ftypes) == 'undefined')
    {
        // Issue 176123 - Support basic field metadata for the quickadd case
        var fld = document.getElementById(fldnam + "_fs");
        var bSelect = (isSelect(fld) || isPopupSelect(fld));// || isMultiSelect(fld) || isPopupMultiSelect(fld));
        return new nlobjField(getFieldName(fldnam), bSelect ? 'select' : 'text');
    }
    var fldObj = typeof(ftabs) != 'undefined' && ftabs[getFieldName(fldnam)] != null ? new nlobjField(getFieldName(fldnam), ftypes[getFieldName(fldnam)]) : null;
    if ( fldObj == null && document.forms['main_form'].elements[fldnam] != null )
        fldObj = new nlobjField(getFieldName(fldnam), ftypes[getFieldName(fldnam)] != null ? ftypes[getFieldName(fldnam)] : 'text')
    if ( fldObj != null )
    {
        var fld = getFormElement( document.forms[(ftabs[getFieldName(fldnam)] != null ? ftabs[getFieldName(fldnam)]+'_form' : 'main_form')], getFieldName(fldnam) );
        if ( fld != null )
        {
            fldObj.formId = (document.forms[(ftabs[getFieldName(fldnam)] != null ? ftabs[getFieldName(fldnam)]+'_form' : 'main_form')]).id;
            fldObj.uifield = fld
            fldObj.noslaving = fld.noslaving;
            fldObj.disabled = getFieldDisabled(fld)
            fldObj.required = getRequired(fld)
            fldObj.readonly = isDisplayOnlyField(fld)
            fldObj.hidden = fld.type == 'hidden' && !(isSelect(fld) || isPopupSelect(fld) || isMultiSelect(fld) || isPopupMultiSelect(fld) || isRichTextEditor(fld)
                    || isFormattedNumericField(fld));
            fldObj.label = getLabel( fldnam+'_fs' );
            fldObj.popup = isPopupSelect( fld ) || isPopupMultiSelect( fld );
            var parent = fparents[getFieldName(fldnam)];
            if (!isValEmpty(parent))
                fldObj.parent = parent.indexOf(".") != -1 ? nlapiGetLineItemField(parent.substring(0, parent.indexOf(".")), parent.substring(parent.indexOf(".")+1)) : nlapiGetField( parent );
        }
        else
            fldObj = null;
    }
    return fldObj;
}

/**
 * Sets Field Group as visible/hidden if it contains any visible fields or not
 * @param fld - current field with changed visibility
 */
function toggleFieldGroupVisibility(fld)
{
	if (!!NS && !!NS.jQuery && !!fld) {
		var fieldGroupContent = NS.jQuery(fld.uifield).closest(".uir-fieldgroup-content");
		var fgTitle = fieldGroupContent.siblings(".uir-field-group-row").find(".fgroup_title");
		var fgVisible = fieldGroupContent.find(".uir-field-wrapper:visible").length > 0;

		if (fgVisible && fgTitle.is(":hidden")) {
			display(fgTitle.get(0), true);
		}
		else if (!fgVisible && fgTitle.is(":visible")) {
			display(fgTitle.get(0), false);
		}
	}
}

function isFormattedNumericField(fld)
{
    return  (isNumericField(fld) || isCurrencyField(fld)) && getNLNumericOrCurrencyDisplayField(fld) != null;
}

function nlapiGetSubList(type)
{
    if ( hasLineItemGroup(type) )
    {
        var sublistObj = new nlobjSubList(type);
        return sublistObj;
    }
    return null;
}
function nlapiGetMatrixField(type, fldnam, column)
{
    if (hasEncodedMatrixField(type, fldnam, column))
    {
        var hdr = getFormValue( document.forms['main_form'].elements[type+"header"] )
        var fld = hdr != null ? getFormElement( nvl(document.forms[type+'_form'],document.forms['main_form']), hdr+column ) : null; // sublist could be hidden
        if ( fld == null )
            return;

        var headername = hdr+column;
        var fldObj = typeof(ftabs) != 'undefined' && ftabs[headername] != null ? new nlobjField(headername, ftypes[headername]) : null;
        if ( fldObj != null )
        {
            var fld = getFormElement( document.forms[type+'_form'], headername );
            if ( fld != null )
            {
                fldObj.uifield = fld
                fldObj.noslaving = fld.noslaving;
                fldObj.disabled = getFieldDisabled(fld)
                fldObj.required = getRequired(fld)
                fldObj.readonly = isDisplayOnlyField(fld)
                fldObj.hidden = fld.type == 'hidden' && !(isSelect(fld) || isPopupSelect(fld) || isMultiSelect(fld) || isPopupMultiSelect(fld) || isRichTextEditor(fld))
                fldObj.label = getLabel( headername+'_fs' );
            }
            else
                fldObj = null;
        }
        return fldObj;
    }
    return null;
}
function nlapiGetLineItemField(type, fldnam, linenum)
{
    var fldObj = hasEncodedField(type, fldnam) ? new nlobjField(getFieldName(fldnam), getEncodedFieldType(type, fldnam), type) : null;
    if ( fldObj != null )
    {
        var fld = getFormElement( document.forms[type+'_form'], getFieldName(fldnam)+(linenum != null && !isEditMachine(type) ? linenum : "") );
        if ( fld != null )
        {
            if (linenum != null)
                fldObj.linenum = linenum;
            fldObj.uifield = fld
            fldObj.noslaving = fld.noslaving;
            fldObj.disabled = getFieldDisabled(fld)
            fldObj.required = getRequired(fld)
            fldObj.readonly = false;
            fldObj.hidden = fld.type == 'hidden' && !(isSelect(fld) || isPopupSelect(fld) || isMultiSelect(fld) || isPopupMultiSelect(fld))
            fldObj.label = getEncodedFieldLabel(type, fldnam);
            fldObj.popup = isPopupSelect( fld ) || isPopupMultiSelect( fld );
            var parent = getEncodedFieldParent(type, fldnam);
            if (!isValEmpty(parent))
                fldObj.parent = parent.indexOf(".") != -1 ? nlapiGetLineItemField(type, parent.substring(parent.indexOf(".")+1), linenum) : nlapiGetField( parent );
        }
        else
            fldObj = null
    }
    return fldObj;
}
function nlapiGetLineItemMatrixField(type, fldnam, column, linenum)
{
    if (hasEncodedMatrixField(type, fldnam, column))
        return nlapiGetLineItemField(type, getMatrixFieldName(type, fldnam, column), linenum != null ? linenum : nlapiGetCurrentLineItemIndex(type))
    return null;
}
function nlapiSetFieldMandatory(fldnam, required)
{
    var form = typeof(ftabs) != 'undefined' && ftabs[getFieldName(fldnam)] != null ? document.forms[ftabs[getFieldName(fldnam)]+'_form'] : document.forms['main_form'];
    if ( nsapiIsInternal() || /cust(entity|item|body|column|record|itemnumber|page|event).+/.test(fldnam) )
        setRequired(getFormElement( form, getFieldName(fldnam) ), required);
}
function nlapiGetFieldMandatory(fldnam)
{
    var form = typeof(ftabs) != 'undefined' && ftabs[getFieldName(fldnam)] != null ? document.forms[ftabs[getFieldName(fldnam)]+'_form'] : document.forms['main_form'];
    return getRequired(getFormElement( form, getFieldName(fldnam) ));
}
function nlapiSetLineItemMandatory(type, fldnam, required, linenum)
{
    var form = document.forms[type+'_form'];
    if ( nsapiIsInternal() || /cust(entity|item|body|column|record|itemnumber|page|event).+/.test(fldnam) )
    {
        var fld = getFormElement(form,getFieldName(fldnam));
        if (fld == null)
            fld = getFormElement(form, getFieldName(fldnam)+linenum);
        if (isEditMachine(type))
            eval( String(type) + '_machine').setElementRequired(fldnam, required)
        else
            setRequired(fld, required);
    }
}
function nlapiGetLineItemMandatory(type, fldnam, linenum)
{
    var form = document.forms[type+'_form'];
    var fld = getFormElement(form,getFieldName(fldnam));
    if (fld == null)
        fld = getFormElement(form, getFieldName(fldnam)+linenum);
    return getRequired(fld);
}
function nlapiSetFieldDisabled(fldnam,val)
{
    var form = typeof(ftabs) != 'undefined' && ftabs[getFieldName(fldnam)] != null ? document.forms[ftabs[getFieldName(fldnam)]+'_form'] : document.forms['main_form'];
    disableField(getFormElement( form, getFieldName(fldnam) ),val);
    if ( typeof(ftabs) == 'undefined' || ftabs[getFieldName(fldnam)] == null || ftabs[getFieldName(fldnam)] == "main" )
        nsDisabledFields[fldnam] = val;
}
function nlapiGetFieldDisabled(fldnam)
{
    var form = typeof(ftabs) != 'undefined' && ftabs[getFieldName(fldnam)] != null ? document.forms[ftabs[getFieldName(fldnam)]+'_form'] : document.forms['main_form'];
    return getFieldDisabled( getFormElement( form, getFieldName(fldnam) ) );
}
function nlapiSetLineItemDisabled(type,fldnam,val, linenum)
{
    var fld = getFormElement( document.forms[type.toLowerCase()+'_form'], getFieldName(fldnam) );
    if( fld == null )
        fld = getFormElement( document.forms[type.toLowerCase()+'_form'], getFieldName(fldnam)+linenum )
    disableField( fld,val);
}
function nlapiGetLineItemDisabled(type,fldnam, linenum)
{
    var fld = getFormElement( document.forms[type.toLowerCase()+'_form'], getFieldName(fldnam) );
    if( fld == null )
        fld = getFormElement( document.forms[type.toLowerCase()+'_form'], getFieldName(fldnam)+linenum )
    return getFieldDisabled( fld );
}
function nlapiDisableField(fldnam,val)
{
    nlapiSetFieldDisabled(fldnam, val)
}
function nlapiDisableLineItemField(type,fldnam,val)
{
    nlapiSetLineItemDisabled(type, fldnam, val)
}
function nlapiSetFieldLabel(fldnam, label)
{
    nsapiCheckArgs( [fldnam], ['fldnam'], 'nlapiSetFieldLabel' );
    setLabel( fldnam + "_fs", label )
}
function nlapiSetFieldVisibility(fldnam, show)
{
    nsapiCheckArgs( [fldnam, show], ['fldnam', 'show'], 'nlapiSetFieldVisibility' );
    setFieldAndLabelVisibility( fldnam + "_fs", show )
}
function nlapiSetFieldDisplay(fldnam, show)
{
    nsapiCheckArgs( [fldnam, show], ['fldnam', 'show'], 'nlapiSetFieldDisplay' );
    showFieldAndLabel( fldnam + "_fs", show );
	toggleFieldGroupVisibility(nlapiGetField(fldnam)); // Issue 401499: Hide Field Group Title if it doesn't contain any visible fields or vice versa
    if (typeof(ftabs) != 'undefined')
    {
        var tabName = ftabs[getFieldName(fldnam)];
        ns_tabUtils.updateTabVisibility(tabName);
    }
}
function nlapiSetFieldReadOnly(fldnam,val)
{
    var form = typeof(ftabs) != 'undefined' && ftabs[getFieldName(fldnam)] != null ? document.forms[ftabs[getFieldName(fldnam)]+'_form'] : document.forms['main_form'];
    var fld = getFormElement( form, getFieldName(fldnam) );
    setFieldReadOnly(fld, val);
}
function nlapiGetFieldReadOnly(fldnam)
{
    var form = typeof(ftabs) != 'undefined' && ftabs[getFieldName(fldnam)] != null ? document.forms[ftabs[getFieldName(fldnam)]+'_form'] : document.forms['main_form'];
    var fld = getFormElement( form, getFieldName(fldnam) );
    return fld != null && fld.type == "textarea" ? fld.readOnly : false;
}
function nlapiSetLineItemDisplay(type, show)
{
    nsapiCheckArgs( [type, show], ['type', 'show'], 'nlapiSetLineItemDisplay' );
    hideMachine(type, !show)
}
function nlapiSetLineItemLabel(type, fldnam, label)
{
    nsapiCheckArgs( [type, fldnam], ['type', 'fldnam'], 'nlapiSetLineItemLabel' );
    if ( isEditMachine(type) )
    {
        var mch = eval( String(type) + '_machine');
        mch.setFormElementLabel( fldnam, label );
    }
}
function nlapiGetFieldLabel(fldnam)
{
    nsapiCheckArgs( [fldnam], ['fldnam'], 'nlapiGetFieldLabel' );
    return getLabel( fldnam+"_fs" )
}
function nlapiGetLineItemCount(type)
{
    return hasLineItemGroup(type) ? getFormValue( getFormElement( document.forms['main_form'], 'next'+type.toLowerCase()+'idx' ) ) - 1 : -1;
}
function nlapiGetMatrixCount(type, fldnam)
{
    return hasEncodedMatrixField(type, fldnam, 1) ? getFormValue( getFormElement( document.forms['main_form'], type.toLowerCase()+'headercount' ) ) : -1;
}
function nlapiGetRecordType()
{
    return getFormValue( getFormElement( document.forms['main_form'], 'baserecordtype' ) );
}
function nlapiGetRecordId()
{
    return getFormValue( getFormElement( document.forms['main_form'], 'id' ) );
}
/*--------------- Miscellaneous Utility Functions ------------*/
function nlapiFormatCurrency(str)
{
    return format_currency(str);
}
function nlapiStringToDate(str, formattype)
{
    if ( isValEmpty(str) )
        return null;
    var d = stringtodate( str, window.dateformat, true /* returnNullIfInvalid */, formattype);
    if ( d == null )
        d = stringtotime( null, str )
    return d;
}
function nlapiDateToString(d, formattype)
{
    if ( formattype == 'timeofday' )
        return gettimestring(d);
    else if ( formattype == 'datetime')
        return getdatetimestring(d);
    else if ( formattype == 'datetimetz')
        return getdatetimetzstring(d);
    else
        return getdatestring(d);
}
function nlapiAddDays(d, days)
{
    return adddays(new Date(d.getTime()), parseInt(days));
}
function nlapiAddMonths(d, months)
{
    return addmonths(new Date(d.getTime()), parseInt(months));
}
function nlapiEncrypt(s, type, key)
{
    nsapiCheckArgs( [s], ['cleartext'], 'nlapiEncrypt' );
    if (type == null)
        type = "sha1";
    return nsServerCall(nsJSONProxyURL, "encrypt", [s, type, key != null ? key : null]);
}
function nlapiDecrypt(s, type, key)
{
    nsapiCheckArgs( [s], ['encryptedtext'], 'nlapiDecrypt' );
    if ( type == "aes" || type == "base64" || type == "xor" )
        return nsServerCall(nsJSONProxyURL, "decrypt", [s, type, key != null ? key : null]);
    return null;
}
function nlapiExchangeRate(fromCurrency, toCurrency, effectiveDate)
{
    nsapiCheckArgs( [fromCurrency, toCurrency], ['fromCurrency', 'toCurrency'], 'nlapiExchangeRate' );
    nsapiCheckUsage( );

    var rate = nsServerCall(nsJSONProxyURL, "exchangeRate", [fromCurrency, toCurrency, effectiveDate != null ? effectiveDate : nlapiDateToString(new Date())]);
    nsapiLogUsage("nlapiExchangeRate")
    return rate;
}
function nlapiEscapeXML(text)
{
    if ( text == null )
        return null;
    text = ""+text;
    return text.replace( /&/g, '&amp;' ).replace( /</g,'&lt;' ).replace( />/g,'&gt;' ).replace( /'/g, '&apos;' ).replace( /"/g,'&quot;' );
}

function nlapiNanoTime()
{
    throw nlapiCreateError('SSS_NOT_YET_SUPPORTED');
}

/*--------------- Custom form portlet functions ------------*/
function nlapiRefreshPortlet()
{
    if (typeof window.nlportlet == 'object' && window.nlportlet.type == 'form')
        window.nlportlet.refreshfn();
    else
        nlapiCreateError('SSS_INVALID_RECORD_TYPE');
}

function nlapiResizePortlet()
{
    if (typeof window.nlportlet == 'object' && window.nlportlet.type == 'form')
        window.nlportlet.resizefn();
    else
        nlapiCreateError('SSS_INVALID_RECORD_TYPE');
}
/*--------------- Miscellaneous machine UI functions ------------*/
function nlapiRefreshLineItems(type)
{
    if (isEditMachine(type))
    {
        var isInternal = nsapiIsInternal();
        var slavingOrig = getSlavingAsync();
        try
        {
            setSlavingAsync(false);
            nsapiSetIsInternal(true);
            nsapiCallScript( "refreshLineItem", "internal", type + '_machine.buildtable()' );
        }
        finally
        {
            setSlavingAsync(slavingOrig);
            nsapiSetIsInternal(isInternal);
        }
    }
    else if (!hasLineItemGroup(type))	/* true for readonly sublists */
        nsapiCallScript( "refreshLineItem", "internal", 'refreshmachine("'+ type+'" )' );
}
function nlapiSelectLineItem(type, linenum, allowsegmentchange)
{
    var isInternal = nsapiIsInternal();
    var slavingOrig = getSlavingAsync();
    try
    {
        setSlavingAsync(false);
        nsapiSetIsInternal(true);
        if (allowsegmentchange == true)
            nsapiSelectSegmentForLine(type, linenum);
        if (hasMachine(type))
            nsapiCallScript( "selectLineItem", "internal", type+'_machine.viewline('+linenum+')' );
        else if (hasLineItemGroup(type))
            nsapiCallScript( "selectLineItem", "internal", 'setFormValue( document.forms["'+ type+'_form"].elements["lineindex"], '+linenum+' )' );
    }
    finally
    {
        setSlavingAsync(slavingOrig);
        nsapiSetIsInternal(isInternal);
    }
}
function nlapiCommitLineItem(type)
{
    var isInternal = nsapiIsInternal();
    var slavingOrig = getSlavingAsync();
    try
    {
        setSlavingAsync(false);
        nsapiSetIsInternal(true);
        if (isEditMachine(type))
            nsapiCallScript( "commitLineItem", "internal", type+'_machine.addline()' );
        else if ( hasLineItemGroup(type) )
            nsapiCallScript( "commitLineItem", "internal", 'setEncodedValues( "'+ type+'", nlapiGetCurrentLineItemIndex("'+ type+'") )' );
    }
    finally
    {
        setSlavingAsync(slavingOrig);
        nsapiSetIsInternal(isInternal);
    }
}
function nlapiInsertLineItem(type, line)
{
    if (line != undefined)
    {
        nlapiSelectLineItem(type, line);
    }
    var isInternal = nsapiIsInternal();
    var slavingOrig = getSlavingAsync();
    try
    {
        setSlavingAsync(false);
        nsapiSetIsInternal(true);
        if (isEditMachine(type))
            nsapiCallScript( "insertLineItem", "internal", type+'_machine.insertline()' );
    }
    finally
    {
        setSlavingAsync(slavingOrig);
        nsapiSetIsInternal(isInternal);
    }
}
function nlapiRemoveLineItem(type, line)
{
    if (line != undefined)
    {
        nlapiSelectLineItem(type, line);
    }
    var isInternal = nsapiIsInternal();
    var slavingOrig = getSlavingAsync();
    var origflag = NS.form.isInited();
    try
    {
        NS.form.setInited(true );
        setSlavingAsync(false);
        nsapiSetIsInternal(true);
        if (isEditMachine(type))
            nsapiCallScript( "deleteLineItem", "internal", type+'_machine.deleteline()' );
    }
    finally
    {
        NS.form.setInited(origflag);
        setSlavingAsync(slavingOrig);
        nsapiSetIsInternal(isInternal);
    }
}
function nlapiCancelLineItem(type)
{
    var isInternal = nsapiIsInternal();
    var slavingOrig = getSlavingAsync();
    try
    {
        setSlavingAsync(false);
        nsapiSetIsInternal(true);
        if (isEditMachine(type))
            nsapiCallScript( "cancelLineItem", "internal", type+'_machine.clearline()' );
    }
    finally
    {
        setSlavingAsync(slavingOrig);
        nsapiSetIsInternal(isInternal);
    }
}
function nlapiSelectNewLineItem(type)
{
    var isInternal = nsapiIsInternal();
    var slavingOrig = getSlavingAsync();
    try
    {
        setSlavingAsync(false);
        nsapiSetIsInternal(true);
        if (isEditMachine(type))
            nsapiCallScript( "selectNewLineItem", "internal", type+'_machine.clearline()' );
    }
    finally
    {
        setSlavingAsync(slavingOrig);
        nsapiSetIsInternal(isInternal);
    }
}
function nlapiIsLineItemChanged(type)
{
    return isMachineChanged(type);
}
/*--------------- Miscellaneous dropdown UI functions (only valid on UI Builder fields) ------------*/
function nlapiInsertOption(fldnam, value, text, selected) { nlapiInsertSelectOption(fldnam, value, text, selected) }
function nlapiInsertSelectOption(fldnam, value, text, selected)
{
    nsapiAssertTrue( fldnam != null && fldnam.indexOf('custpage') == 0, 'SSS_INVALID_OPERATION' );
    var form = typeof(ftabs) != 'undefined' && ftabs[getFieldName(fldnam)] != null ? document.forms[ftabs[getFieldName(fldnam)]+'_form'] : document.forms[0];
    var fld = getFormElement( form, getFieldName(fldnam) );
    if (fld != null)
        addSelectOption( document, fld, text, value, selected )
}
function nlapiInsertLineItemOption(type, fldnam, value, text, selected)
{
    nsapiAssertTrue( type != null && fldnam != null && fldnam.indexOf('custpage') == 0, 'SSS_INVALID_OPERATION' );
    var form = document.forms[type+'_form'];
    var fld = getFormElement( form, getFieldName(fldnam) );
    if (fld != null)
        addSelectOption( document, fld, text, value, selected )
}
function nlapiRemoveOption(fldnam, value, text) { nlapiRemoveSelectOption(fldnam, value, text) }
function nlapiRemoveSelectOption(fldnam, value)
{
    nsapiAssertTrue( fldnam != null && fldnam.indexOf('custpage') == 0, 'SSS_INVALID_OPERATION' );
    var form = typeof(ftabs) != 'undefined' && ftabs[getFieldName(fldnam)] != null ? document.forms[ftabs[getFieldName(fldnam)]+'_form'] : document.forms[0];
    var fld = getFormElement( form, getFieldName(fldnam) );
    if (fld != null)
        eval( value != null ? 'deleteOneSelectOption( fld, value )' : 'deleteAllSelectOptions( fld, window )' )
}
function nlapiRemoveLineItemOption(type, fldnam, value)
{
    nsapiAssertTrue( type != null && fldnam != null && fldnam.indexOf('custpage') == 0, 'SSS_INVALID_OPERATION' );
    var form = document.forms[type+'_form'];
    var fld = getFormElement( form, getFieldName(fldnam) );
    if (fld != null)
        eval( value != null ? 'deleteOneSelectOption( fld, value )' : 'deleteAllSelectOptions( fld, window )' )
}
/*--------------- Helper Functions for obtaining current user information ------------*/
function nlapiGetUser()
{
    return nlapiGetFieldValue('nluser');
}
function nlapiGetRole()
{
    return nlapiGetFieldValue('nlrole');
}
function nlapiGetDepartment()
{
    return nlapiGetFieldValue('nldept');
}
function nlapiGetLocation()
{
    return nlapiGetFieldValue('nlloc');
}
function nlapiGetSubsidiary()
{
    return nlapiGetFieldValue('nlsub');
}

/*---------------------------------------- Custom Code API Extensions -------------------------------------*/

/*--------------- instantiate an existing nlobjRecord from the server ------------*/
function nlapiLoadRecord(type, id, initializeDefaults)
{
    nsapiCheckArgs( [type, id], ['type', 'id'], 'nlapiLoadRecord' );
    nsapiCheckType( type, 'nlapiLoadRecord', true );
    nsapiCheckUsage( );
    if (initializeDefaults != null)
        for (var field in initializeDefaults)
            if(initializeDefaults.hasOwnProperty(field))
                nsapiAssertTrue(arrayContains(nsapiGetRecord( type ).initializedefaults, field), 'SSS_INVALID_INITIALIZE_DEFAULT_VALUE' );
    try
    {
        var nsPayload = nsStringToXML("<nlapiRequest type='nlapiLoadRecord'></nlapiRequest>");
        var nlapiRequest = nsPayload.documentElement;
        nlapiRequest.setAttribute('id', id);
        nlapiRequest.setAttribute('recordType', type);
        if (initializeDefaults != null)
        {
            var nsLoadParams = nsSetChildValue( nlapiRequest, "loadParams" );
            for (var defaultValue in initializeDefaults)
                if(initializeDefaults.hasOwnProperty(defaultValue))
                    nsSetChildValue(nsLoadParams, nsapiModifyLoadArg(defaultValue), initializeDefaults[defaultValue])
        }

        var payload = nsXmlToString( nsPayload );
        var request = new NLXMLHttpRequest();
        var response = request.requestURL( nsProxyURL, payload )

        var nsResponse = nsStringToXML( response.getBody() );
        var nsResponseRecord = nsSelectNode( nsResponse, "/nlapiResponse/record" );
        var nsRecord = nsapiExtractRecord( nsResponseRecord );
        nsRecord.logOperation("loadRecord", {"id" : id, "initializeDefaults" : initializeDefaults})
        nsapiAssertTrue( type.toLowerCase() == nsRecord.getRecordType().toLowerCase() ||
                         (type.toLowerCase() == 'assemblyitem' && /.*assemblyitem/.test(nsRecord.getRecordType().toLowerCase())) ||
                         (type.toLowerCase() == 'inventoryitem' && /.*inventoryitem/.test(nsRecord.getRecordType().toLowerCase())) ||
                         (type.toLowerCase() == 'customer' && /(prospect|lead|customer)/.test(nsRecord.getRecordType().toLowerCase())), 'SSS_RECORD_TYPE_MISMATCH' );
        nsapiLogUsage( 'nlapiLoadRecord', type )
        return nsRecord;
    }
    catch( e )
    {
        throw nlapiCreateError( e );
    }
}
/* ----------------- instantiate an nlobjRecord with default values filled in -----*/
function nlapiCreateRecord(type, initializeDefaults)
{
    nsapiCheckArgs( [type], ['type'], 'nlapiCreateRecord' );
    nsapiCheckType( type, 'nlapiCreateRecord', true );
    nsapiCheckUsage( );
    if (initializeDefaults != null)
        for (var field in initializeDefaults)
            if(initializeDefaults.hasOwnProperty(field))
                nsapiAssertTrue(arrayContains(nsapiGetRecord( type ).initializedefaults, field), 'SSS_INVALID_INITIALIZE_DEFAULT_VALUE' );
    try
    {
        var nsPayload = nsStringToXML("<nlapiRequest type='nlapiCreateRecord'></nlapiRequest>");
        var nlapiRequest = nsPayload.documentElement;
        nlapiRequest.setAttribute('recordType', type);
        if (initializeDefaults != null)
        {
            var nsLoadParams = nsSetChildValue( nlapiRequest, "loadParams" );
            for (var defaultValue in initializeDefaults)
                if(initializeDefaults.hasOwnProperty(defaultValue))
                    nsSetChildValue(nsLoadParams, nsapiModifyLoadArg(defaultValue), initializeDefaults[defaultValue])
        }

        var payload = nsXmlToString( nsPayload );
        var request = new NLXMLHttpRequest();
        var response = request.requestURL( nsProxyURL, payload )

        var nsResponse = nsStringToXML( response.getBody() );
        var nsResponseRecord = nsSelectNode( nsResponse, "/nlapiResponse/record" );
        var nsRecord = nsapiExtractRecord( nsResponseRecord );
        nsRecord.logOperation("createRecord", {"initializeDefaults" : initializeDefaults})
        nsapiAssertTrue( type.toLowerCase() == nsRecord.getRecordType().toLowerCase(), 'SSS_RECORD_TYPE_MISMATCH' );
        nsapiLogUsage( 'nlapiCreateRecord', type )
        return nsRecord;
    }
    catch( e )
    {
        throw nlapiCreateError( e );
    }
}
/*--------------- clone and return an existing nlobjRecord from the server. ------------*/
function nlapiCopyRecord(type, id, initializeDefaults)
{
    nsapiCheckArgs( [type, id], ['type', 'id'], 'nlapiCopyRecord' );
    nsapiCheckType( type, 'nlapiCopyRecord', true );
    nsapiCheckUsage( );
    if (initializeDefaults != null)
        for (var field in initializeDefaults)
            if(initializeDefaults.hasOwnProperty(field))
                nsapiAssertTrue(arrayContains(nsapiGetRecord(type).initializedefaults, field), 'SSS_INVALID_INITIALIZE_DEFAULT_VALUE' );
    try
    {
        var nsPayload = nsStringToXML("<nlapiRequest type='nlapiCopyRecord'></nlapiRequest>");
        var nlapiRequest = nsPayload.documentElement;
        nlapiRequest.setAttribute('id', id);
        nlapiRequest.setAttribute('recordType', type);
        if (initializeDefaults != null)
        {
            var nsLoadParams = nsSetChildValue( nlapiRequest, "loadParams" );
            for (var defaultValue in initializeDefaults)
                if(initializeDefaults.hasOwnProperty(defaultValue))
                    nsSetChildValue(nsLoadParams, nsapiModifyLoadArg(defaultValue), initializeDefaults[defaultValue])
        }

        var payload = nsXmlToString( nsPayload );
        var request = new NLXMLHttpRequest();
        var response = request.requestURL( nsProxyURL, payload )

        var nsResponse = nsStringToXML( response.getBody() );
        var nsResponseRecord = nsSelectNode( nsResponse, "/nlapiResponse/record" );
        var nsRecord = nsapiExtractRecord( nsResponseRecord );
        nsRecord.logOperation("copyRecord", {"id" : id, "initializeDefaults" : initializeDefaults})
        nsapiAssertTrue( type.toLowerCase() == nsRecord.getRecordType().toLowerCase() || (type.toLowerCase() == 'customer' && /(prospect|lead|customer)/.test(nsRecord.getRecordType().toLowerCase())), 'SSS_RECORD_TYPE_MISMATCH' );
        nsapiLogUsage( 'nlapiCopyRecord', type )
        return nsRecord;
    }
    catch( e )
    {
        throw nlapiCreateError( e );
    }
}
/* ----- transform a record into another type (i.e. salesorder -> invoice -or- opportunity -> estimate) -----*/
function nlapiTransformRecord(type, id, transformType, transformValues)
{
    nsapiCheckArgs( [type, id, transformType], ['type', 'id', 'transformType'], 'nlapiTransformRecord' );
    nsapiCheckType( type, 'nlapiTransformRecord', true );
    nsapiCheckUsage( );

    nsapiAssertTrue(arrayContains(nsapiGetRecord( type ).transformtypes, transformType), 'SSS_INVALID_TRANSFORM_TYPE' );
    if (transformValues != null)
        for (var field in transformValues)
            if(transformValues.hasOwnProperty(field))
                nsapiAssertTrue(arrayContains(nsapiGetRecord( transformType ).transformdefaults, field), 'SSS_INVALID_TRANSFORM_DEFAULT_VALUE' );
    try
    {
        var nsPayload = nsStringToXML("<nlapiRequest type='nlapiTransformRecord'></nlapiRequest>");
        var nlapiRequest = nsPayload.documentElement;
        nlapiRequest.setAttribute('id', id);
        nlapiRequest.setAttribute('recordType', type);
        nlapiRequest.setAttribute('transformType', transformType);
        if (transformValues != null)
        {
            var nsLoadParams = nsSetChildValue( nlapiRequest, "loadParams" );
            for (var defaultValue in transformValues)
                if(transformValues.hasOwnProperty(defaultValue))
                    nsSetChildValue(nsLoadParams, nsapiModifyLoadArg(defaultValue), transformValues[defaultValue])
        }

        var payload = nsXmlToString( nsPayload );
        var request = new NLXMLHttpRequest();
        var response = request.requestURL( nsProxyURL, payload )

        var nsResponse = nsStringToXML( response.getBody() );
        var nsResponseRecord = nsSelectNode( nsResponse, "/nlapiResponse/record" );
        var nsRecord = nsapiExtractRecord( nsResponseRecord );
        nsRecord.logOperation("transformRecord", {"type" : type, "id" : id, "transformType" : transformType, "transformDefaults" : transformValues})
        nsapiAssertTrue( transformType.toLowerCase() == nsRecord.getRecordType().toLowerCase(), 'SSS_RECORD_TYPE_MISMATCH' );
        nsapiLogUsage( 'nlapiTransformRecord', transformType )
        return nsRecord;
    }
    catch( e )
    {
        throw nlapiCreateError( e );
    }
}

/* void a transaction based on type and id */
function nlapiVoidTransaction (type, id)
{
    nsapiCheckArgs( [type, id], ['type', 'id'], 'nlapiVoidTransaction' );
    nsapiCheckUsage( );
    return nsServerCall(nsJSONProxyURL, 'voidTransaction', [type, id]);
}

/* ----- commit changes to an nlobjRecord into the system -----*/
function nlapiSubmitRecord(record, options, ignoreMandatoryFields)
{
    nsapiCheckArgs( [record], ['record'], 'nlapiSubmitRecord' );
    nsapiCheckUsage( );

    if (!(record instanceof nlobjRecord))
        throw nlapiCreateError( 'SSS_INVALID_RECORD_OBJ', 'The record is not a valid object.' );
    try
    {
        var nsPayload = nsStringToXML("<nlapiRequest type='nlapiSubmitRecord'></nlapiRequest>");
        var nlapiRequest = nsPayload.documentElement;
        nlapiRequest.setAttribute('enableSourcing', ""+(options === true || (options != null && options.enableSourcing === true) ? true : false));
        nlapiRequest.setAttribute('disableTriggers', ""+(options != null && options.disableTriggers === true ? true : false));
        nlapiRequest.setAttribute('ignoreMandatoryFields', ""+(ignoreMandatoryFields === true || (options != null && options.ignoreMandatoryFields === true) ? true : false) );

        var nsRecord = nsapiSerializeRecord( record );
        nlapiRequest.appendChild( nsRecord.documentElement.cloneNode( true ) );

        var payload = nsXmlToString( nsPayload );
        var request = new NLXMLHttpRequest();
        var response = request.requestURL( nsProxyURL, payload )

        var nsResponse = nsStringToXML( response.getBody() );
        var sKey = nsSelectValue( nsResponse, "/nlapiResponse/id" );
        nsapiLogUsage( 'nlapiSubmitRecord', record.getRecordType() )
        return sKey;
    }
    catch( e )
    {
        throw nlapiCreateError( e );
    }
}
/* ----- commit record field updates to the system -----*/
function nlapiSubmitField(type, id, fields, values, options)
{
    nsapiCheckArgs( [type, id, fields], ['type', 'id', 'fields'], 'nlapiSubmitField' );
    nsapiCheckType( type, 'nlapiSubmitField' );
    nsapiCheckUsage( );

    try
    {
        var nsPayload = nsStringToXML("<nlapiRequest type='nlapiSubmitField'></nlapiRequest>");
        var nlapiRequest = nsPayload.documentElement;
        nlapiRequest.setAttribute('recordType', type );
        nlapiRequest.setAttribute('id', id );
        nlapiRequest.setAttribute('enableSourcing', ""+(options === true || (options != null && options.enableSourcing === true) ? true : false));
        nlapiRequest.setAttribute('disableTriggers', ""+(options != null && options.disableTriggers === true ? true : false));
        /* add fields. */
        if (fields instanceof String || typeof(fields) == 'string')
        {
            var nsField = nsSetChildValue( nlapiRequest, "field" );
            nsSetChildValue( nsField, "name", fields );
            nsSetChildValue( nsField, "value", values );
        }
        else
        {
            for (var i = 0; fields != null && i < fields.length; i++)
            {
                var nsField = nsSetChildValue( nlapiRequest, "field" );
                nsSetChildValue( nsField, "name", fields[i] );
                nsSetChildValue( nsField, "value", values != null ? values[i] : null );
            }
        }

        var payload = nsXmlToString( nsPayload );
        var request = new NLXMLHttpRequest();
        var response = request.requestURL( nsProxyURL, payload );
        nsapiLogUsage( 'nlapiSubmitField', type )
    }
    catch( e )
    {
        throw nlapiCreateError( e );
    }
}

/* ----- delete an nlobjRecord -----*/
function nlapiDeleteRecord(type, id)
{
    nsapiCheckArgs( [type, id], ['type', 'id'], 'nlapiDeleteRecord' );
    nsapiCheckType( type, 'nlapiDeleteRecord', true );
    nsapiCheckUsage( );
    try
    {
        nsServerCall(nsJSONProxyURL, "deleteRecord", [type, id]);
        nsapiLogUsage( 'nlapiDeleteRecord', type )
    }
    catch( e )
    {
        throw nlapiCreateError( e );
    }
}
/* ----- get search columns for a particular search type -----*/
function nlapiGetSearchColumns(type, filter, op)
{
    nsapiCheckArgs( [type], ['type'], 'nlapiGetSearchColumns' );
    nsapiCheckType( type, 'nlapiGetSearchColumns' );

    try
    {
        var rawResults = nsServerCall( nsJSONProxyURL, 'getSearchColumns', [type, filter, op]);
        var results = new Array();
        for ( var i = 0; rawResults != null && i < rawResults.length; i++ )
        {
            var columnObject = nsapiUnmarshalSearchColumn(rawResults[i]);
            results.push(columnObject);
        }
        return results.length == 0 ? null : results;
    }
    catch( e )
    {
        throw nlapiCreateError( e );
    }
}
function nsapiUnmarshalSearchFilter(filterMap)
{
    var filter = new nlobjSearchFilter(filterMap.name, filterMap.join, filterMap.operator, filterMap.values);
    filter.formula = filterMap.formula;
    filter.summarytype = filterMap.summarytype;
    filter.isor = filterMap.isor;
    filter.isnot = filterMap.isnot;
    filter.leftparens = filterMap.leftparens;
    filter.rightparens = filterMap.rightparens;
    return filter;
}
function nsapiUnmarshalSearchColumn(columnMap)
{
    var col = new nlobjSearchColumn(columnMap.name, columnMap.join, columnMap.summary);
    col.label = columnMap.label;
    col.type = columnMap.type;
    col.functionid = columnMap.functionid;
    col.formula = columnMap.formula;
    col.sortdir = columnMap.sortdir;
    col.whenorderedby = columnMap.whenorderedby;
    col.whenorderedbyjoin = columnMap.whenorderedbyjoin;
    return col;
}
/* ----- perform a record search and return an Array of nlobjSearchResult objects -----*/
function nlapiSearchRecord(type, id, filtersOrExpression, columns)
{
    if (type)
    {
        nsapiCheckSearchType( type, 'nlapiSearchRecord' );
    }
    nsapiCheckUsage( );

    id = id != null && !isNaN(parseInt( id )) ? parseInt( id ) : id != null ? id : null;
    try
    {
        var rawFilters = nsapiMarshalSearchFiltersOrExpression(nsapiNormalizeFilters(filtersOrExpression));
        var rawColumns = nsapiMarshalSearchColumns(columns);
        var rawResults = nsServerCall( nsJSONProxyURL, 'searchRecord', [type, id, rawFilters, rawColumns], null, 'POST');
        var rowResults = nsapiExtractSearchResults( rawResults, columns );

        nsapiLogUsage( 'nlapiSearchRecord', isValEmpty(id) && nsapiIsLookup(filtersOrExpression) ? type : null );
        return rowResults != null && rowResults.length > 0 ? rowResults : null;
    }
    catch( e )
    {
        throw nlapiCreateError( e );
    }
}
/* ----- factory method: create a new ad-hoc search (client suite script implementation) -----*/
function nlapiCreateSearch(type, filtersOrExpression, columns)
{
    nsapiCheckArgs( [type], ['type'], 'nlapiCreateSearch' );
    nsapiCheckSearchType( type, 'nlapiCreateSearch' );
    nsapiCheckUsage( );
    filtersOrExpression = nsapiNormalizeFilters(filtersOrExpression);
    var filters = nsapiParseSearchFilterExpression(filtersOrExpression);
    return new nlobjSearch(type, -1, filters, columns);
}
/* ----- factory method: load an existing saved search (client suite script implementation) -----*/
function nlapiLoadSearch(type, id)
{
    nsapiCheckArgs( [id], ['id'], 'nlapiLoadSearch' );
    if (type)
    {
        nsapiCheckSearchType( type, 'nlapiLoadSearch' );
    }
    nsapiCheckUsage( );
    id = id != null && !isNaN(parseInt( id )) ? parseInt( id ) : id != null ? id : null;
    var search = new nlobjSearch(type, id, null, null);
    search._load();
    return search;
}
/* ----- private search code (client suite script implementation) -----*/
function nsapiParseSearchFilterExpression(filterExpression)
{
    if (nsapiIsFlatSearchFilterList(filterExpression))
        return filterExpression;
    nsapiCheckSearchFilterExpression(filterExpression, 'filters');
    var marshaled = nsapiMarshalSearchFiltersOrExpression(filterExpression);
    var payloadMap = nsServerCall(nsJSONProxyURL, 'parseSearchFilterExpression', [marshaled], null, 'POST');
    return nsapiUnmarshalArray(payloadMap, 'filter', nsapiUnmarshalSearchFilter);
}
function nsapiJSONRPCMap()
{
    return { javaClass: 'java.util.HashMap' };
}
function nsapiMarshalSearchFiltersOrExpression(filtersOrExpression)
{
    if (typeof filtersOrExpression === 'undefined' || filtersOrExpression === null)
        return null;
    nsapiAssertTrue(isArray(filtersOrExpression), 'SSS_INVALID_SRCH_FILTER_EXPR');
    var result = nsapiMap(filtersOrExpression, function(elem)
    {
        if (nsapiIsSearchFilterObject(elem))
            return nsapiMarshalSearchFilter(elem);
        var container = nsapiJSONRPCMap();
        if (isArray(elem))
            container.arrayValue = nsapiMarshalSearchFiltersOrExpression(elem);
        else
            container.stringValue = elem;
        return container;
    });
    return result;
}
function nsapiUnmarshalSearchFilterExpression(mapArrayPayload)
{
    return nsapiMap(mapArrayPayload, function(map)
    {
        if (map.hasOwnProperty('stringValue'))
            return map.stringValue;
        if (map.hasOwnProperty('arrayValue'))
            return nsapiUnmarshalSearchFilterExpression(map.arrayValue)
        return nsapiUnmarshalSearchFilter(map);
    });
}
function nsapiMarshalSearchFilter(filter)
{
    return filter._marshal();
}
function nsapiMarshalSearchFilters(filters)
{
    filters = isArray(filters) ? filters : filters != null && filters instanceof nlobjSearchFilter ? [filters] : null;

    nsapiCheckArray(filters, 'filters', nlobjSearchFilter);

    return (filters != null) ? nsapiMap(filters, nsapiMarshalSearchFilter) : [];
}
function nsapiMarshalSearchColumns(columns)
{
    columns = nsapiColumnsAsArray(columns);

    nsapiCheckArray(columns, 'columns', nlobjSearchColumn);

    /* add columns. */
    var rawColumns = [];
    for ( var i = 0; columns != null && i < columns.length; i++ )
    {
        columns[i].userindex = i+1;
        var marshaledColumn = columns[i]._marshal();
        rawColumns.push(marshaledColumn);
    }
    return rawColumns;
}
function nsapiColumnsAsArray(columns)
{
    return isArray(columns) ? columns : columns != null && columns instanceof nlobjSearchColumn ? [columns] : null;
}
/* ----- helper function for fetching the value of a field (or joined field) on a record  -----*/
function nlapiLookupField(type, id, columns, text)
{
    nsapiCheckArgs( [type, id, columns], ['type', 'id', 'columns'], 'nlapiLookupField' );
    nsapiCheckType( type, 'nlapiLookupField' );

    var searchcolumns = new Array();
    if ( isArray(columns) )
    {
        for ( var i = 0; i < columns.length; i++ )
        {
            var column = columns[i];
            if ( column.toLowerCase() != 'recordtype' )
            {
                var name = column.indexOf( '.' ) != -1 ? column.substring( column.indexOf( '.' )+1 ) : column;
                var join = column.indexOf( '.' ) != -1 ? column.substring( 0, column.indexOf( '.' ) ) : null;
                searchcolumns[searchcolumns.length] = new nlobjSearchColumn(name, join);
            }
        }
    }
    else if ( columns.toLowerCase() != 'recordtype' )
    {
        var name = columns.indexOf( '.' ) != -1 ? columns.substring( columns.indexOf( '.' )+1 ) : columns;
        var join = columns.indexOf( '.' ) != -1 ? columns.substring( 0, columns.indexOf( '.' ) ) : null;
        searchcolumns[0] = new nlobjSearchColumn(name, join);
    }

    var result = nlapiSearchRecord(	type,
                                       null,
                                       new nlobjSearchFilter('internalid',null,'anyof',id),
                                       searchcolumns );
    var results = null;
    if ( result != null && result.length > 0 )
    {
        results = new Object();
        if ( isArray(columns) )
        {
            for ( var i = 0; i < columns.length; i++ )
            {
                var name = columns[i].indexOf( '.' ) != -1 ? columns[i].substring( columns[i].indexOf( '.' )+1 ) : columns[i];
                var join = columns[i].indexOf( '.' ) != -1 ? columns[i].substring( 0, columns[i].indexOf( '.' ) ) : null;
                results[columns[i]] = name.toLowerCase() == 'recordtype' ? result[0].getRecordType() : text ? result[0].getText( name, join ) : result[0].getValue( name, join );
            }
        }
        else
        {
            var name = columns.indexOf( '.' ) != -1 ? columns.substring( columns.indexOf( '.' )+1 ) : columns;
            var join = columns.indexOf( '.' ) != -1 ? columns.substring( 0, columns.indexOf( '.' ) ) : null;
            results = name.toLowerCase() == 'recordtype' ? result[0].getRecordType() : text ? result[0].getText( name, join ) : result[0].getValue( name, join );
        }
    }
    return results;
}
/* ----- perform a record search and return an Array of nlobjSearchResult objects -----*/
function nlapiSearchGlobal(keywords)
{
    nsapiCheckArgs( [keywords], ['keywords'], 'nlapiSearchGlobal' );
    nsapiCheckUsage( );
    try
    {
        var rawSearchResults = nsServerCall( nsJSONProxyURL, 'searchGlobal', [keywords]);
        var rowResults = nsapiExtractSearchResults( rawSearchResults );

        nsapiLogUsage( 'nlapiSearchGlobal' );
        return rowResults != null && rowResults.length > 0 ? rowResults : null;
    }
    catch( e )
    {
        throw nlapiCreateError( e );
    }
}
/* ----- perform a duplicate record search and return an Array of nlobjSearchResult objects -----*/
function nlapiSearchDuplicate(type, fields, id)
{
    nsapiCheckArgs( [type, fields != null ? fields : id], ['type', fields != null ? 'fields' : 'id'], 'nlapiSearchDuplicate' );
    nsapiCheckUsage( );
    try
    {
        var obj = new Object();
        for ( var field in fields )
        {
            if(fields.hasOwnProperty(field))
            {
                nsapiAssertTrue(fields[field] != null, 'SSS_INVALID_SRCH_FILTER', field);
                obj[field] = fields[field];
            }
        }
        var rawSearchResults = nsServerCall( nsJSONProxyURL, 'searchDuplicate', [type, isNaN(parseInt(id)) ? -1 : parseInt(id), obj]);
        var rowResults = nsapiExtractSearchResults( rawSearchResults );

        nsapiLogUsage( 'nlapiSearchGlobal' );
        return rowResults != null && rowResults.length > 0 ? rowResults : null;
    }
    catch( e )
    {
        throw nlapiCreateError( e );
    }
}
/* ----- fetch URL for a NetSuite resource: (TASKLINK, RECORD, SCRIPTLET) -----*/
function nlapiResolveURL(type, identifier, id, pagemode)
{
    nsapiCheckArgs( [type, identifier], ['type', 'identifier'], 'nlapiResolveURL' );
    try
    {
        if ( pagemode != null && typeof(pagemode) == "boolean" && /(suitelet|record)/.test(type.toLowerCase()) )
            pagemode = type.toLowerCase() == 'suitelet' ? (pagemode ? 'external' : 'internal') : (pagemode ? 'edit' : 'view')
        var sUrl = nsServerCall(nsJSONProxyURL, "resolveURL", [type, identifier, id, pagemode]);
        return sUrl;
    }
    catch( e )
    {
        throw nlapiCreateError( e );
    }
}
/* ----- set the Redirect URL for a record. This overrides the default redirect (if one exists) -----*/
function nlapiSetRedirectURL(type, identifier, id, pagemode, params)
{
    nsapiCheckArgs( [type, identifier], ['type', 'identifier'], 'nlapiSetRedirectURL' );
    var url = nlapiResolveURL( type, identifier, id, pagemode );
    for ( var i in params )
        if(params.hasOwnProperty(i))
            url = addParamToURL( url, i, params[ i ] );
    nsapiSetRedirectURL(url);
}
function nsapiSetRedirectURL(url)
{
    setFormValue( document.forms['main_form'].elements.customwhence, url );
}
/* ----- send and record an e-mail -----*/
function nlapiSendEmail(author, recipient, subject, body, cc, bcc, records, _UNUSED_attachments, notifySenderOnBounce, internalOnly, replyTo)
{
    nsapiCheckArgs([author, recipient, subject, body], ['author', 'recipient', 'subject', 'body'], 'nlapiSendEmail');
    nsapiCheckUsage();
    try
    {
        var nsPayload = nsStringToXML("<nlapiRequest type='nlapiSendEmail'></nlapiRequest>");
        var nlapiRequest = nsPayload.documentElement;
        nsSetChildValue(nlapiRequest, "author", author);
        nsSetChildValue(nlapiRequest, "recipient", recipient);
        nsSetChildValue(nlapiRequest, "subject", subject);
        nsSetChildValue(nlapiRequest, "body", body);

        cc = isArray(cc) ? cc : cc != null ? [ "" + cc ] : null;
        bcc = isArray(bcc) ? bcc : bcc != null ? [ "" + bcc ] : null;
        nsSetChildValues(nlapiRequest, "cc", cc);
        nsSetChildValues(nlapiRequest, "bcc", bcc);

        if (records != null && records['transaction'] != null) nsSetChildValue(nlapiRequest, "transaction", records['transaction']);
        if (records != null && records['entity'] != null) nsSetChildValue(nlapiRequest, "entity", records['entity']);
        if (records != null && records['recordtype'] != null) nsSetChildValue(nlapiRequest, "recordtype", records['recordtype']);
        if (records != null && records['record'] != null) nsSetChildValue(nlapiRequest, "record", records['record']);
        if (records != null && records['activity'] != null) nsSetChildValue(nlapiRequest, "activity", records['activity']);

        if (typeof notifySenderOnBounce !== 'boolean')
            notifySenderOnBounce = false;
        if (typeof internalOnly !== 'boolean')
            internalOnly = false;
        if (typeof replyTo === 'string')
            nsSetChildValue(nlapiRequest, "replyTo", replyTo);

        nlapiRequest.setAttribute('notifySenderOnBounce', notifySenderOnBounce);
        nlapiRequest.setAttribute('internalOnly', internalOnly);

        new NLXMLHttpRequest().requestURL(nsProxyURL, nsXmlToString(nsPayload));

        (notifySenderOnBounce) ? nsapiLogUsage('nlapiSendEmail_trackBouncesUpcharge') : nsapiLogUsage('nlapiSendEmail');
    }
    catch (e)
    {
        throw nlapiCreateError(e);
    }
}
/* ----- send and record an fax -----*/
function nlapiSendFax(author, recipient, subject, body, records)
{
    nsapiCheckArgs( [author, recipient, subject, body], ['author', 'recipient', 'subject', 'body'], 'nlapiSendFax' );
    nsapiCheckUsage( );
    try
    {
        var nsPayload = nsStringToXML("<nlapiRequest type='nlapiSendFax'></nlapiRequest>");
        var nlapiRequest = nsPayload.documentElement;
        nsSetChildValue( nlapiRequest, "author", author );
        nsSetChildValue( nlapiRequest, "recipient", recipient );
        nsSetChildValue( nlapiRequest, "subject", subject );
        nsSetChildValue( nlapiRequest, "body", body );

        if ( records != null && records['transaction'] != null ) nsSetChildValue( nlapiRequest, "transaction", records['transaction'] );
        if ( records != null && records['entity'] != null ) nsSetChildValue( nlapiRequest, "entity", records['entity'] );
        if ( records != null && records['recordtype'] != null ) nsSetChildValue( nlapiRequest, "recordtype", records['recordtype'] );
        if ( records != null && records['record'] != null ) nsSetChildValue( nlapiRequest, "record", records['record'] );
        if ( records != null && records['activity'] != null ) nsSetChildValue( nlapiRequest, "activity", records['activity'] );

        new NLXMLHttpRequest().requestURL( nsProxyURL, nsXmlToString( nsPayload ) );
        nsapiLogUsage( 'nlapiSendFax' )
    }
    catch( e )
    {
        throw nlapiCreateError( e );
    }
}
/* ----- attach a single record to another -----*/
function nlapiAttachRecord(type, id, type2, id2, attrs)
{
    nsapiCheckArgs( [type, id, type2, id2], ['type', 'id', 'type2', 'id2'], 'nlapiAttachRecord' );
    nsapiCheckType( type, 'nlapiAttachRecord', type != 'file' );
    nsapiCheckType( type2, 'nlapiAttachRecord', true );
    nsapiCheckUsage( );
    try
    {
        nsServerCall(nsJSONProxyURL, "attachRecord", [type, id, type2, id2, nsapiExtractMap(attrs)]);
        nsapiLogUsage( 'nlapiAttachRecord' )
    }
    catch( e )
    {
        throw nlapiCreateError( e );
    }
}
/* ----- detach a single record from another -----*/
function nlapiDetachRecord(type, id, type2, id2, attrs)
{
    nsapiCheckArgs( [type, id, type2, id2], ['type', 'id', 'type2', 'id2'], 'nlapiDetachRecord' );
    nsapiCheckType( type, 'nlapiDetachRecord', type != 'file' );
    nsapiCheckType( type2, 'nlapiDetachRecord', true );
    nsapiCheckUsage( );
    try
    {
        nsServerCall(nsJSONProxyURL, "detachRecord", [type, id, type2, id2, nsapiExtractMap(attrs)]);
        nsapiLogUsage( 'nlapiDetachRecord' )
    }
    catch( e )
    {
        throw nlapiCreateError( e );
    }
}
/* ----- issue a GET or POST request for an Internal or External URL resource -----*/
function nlapiRequestURL(url, postdata, headers, callback, method)
{
    nsapiCheckArgs( [url], ['url'], 'nlapiRequestURL' );
    nsapiAssertTrue( url.indexOf( '/' ) == 0 || url.indexOf( 'http' ) == 0, 'SSS_INVALID_URL' );
    if (!isValEmpty(method))
        nsapiAssertTrue ( method == 'PUT' || method == 'POST' || method == 'GET' || method == 'DELETE' || method == 'HEAD','SSS_INVALID_HTTPMETHOD');

    nsapiCheckUsage( );
    try
    {
        var host = document.location.protocol+'//'+document.location.host;
        var needHeaders = true;
        if (url.indexOf( '/' ) != 0 && url.indexOf( host ) != 0)  /* Proxy all non-local URLs */
        {
            var nsPayload = nsStringToXML( "<nlapiRequest type='nlapiRequestURL'></nlapiRequest>" );
            var nlapiRequest = nsPayload.documentElement;
            nsSetChildValue( nlapiRequest, "url", url );
            nsSetChildValue( nlapiRequest, "method", method );
            if (nsInstanceofDocument( postdata ))
                nsSetChildValue( nlapiRequest, "body", nsXmlToString( postdata ) );
            else if (postdata instanceof String || typeof postdata == "string")
                nsSetChildValue( nlapiRequest, "body", postdata );
            else
            {
                for (var i in postdata)
                {
                    if(postdata.hasOwnProperty(i))
                    {
                        var param = nsSetChildValue(nlapiRequest, "param");
                        nsSetChildValue(param, "name", i);
                        nsSetChildValue(param, "value", postdata[i]);
                    }
                }
            }
            for ( var i in headers )
            {
                if(headers.hasOwnProperty(i))
                {
                    nsapiAssertTrue(!isValEmpty(i), 'SSS_INVALID_HEADER');
                    var header = nsSetChildValue(nlapiRequest, "header");
                    nsSetChildValue(header, "name", i);
                    nsSetChildValue(header, "value", headers[i]);
                }
            }
            url = nsProxyURL;
            postdata = nsXmlToString( nsPayload );
            needHeaders = false;
        }
        var request = new NLXMLHttpRequest();
        if (callback instanceof Function)
            request.setResponseHandler( function(response) { nsapiAjaxResponse( response, callback ) } );
        var nsResponse = request.requestURL( url, postdata, needHeaders ? headers : null, callback instanceof Function, method )
        if (nsResponse != null)
            nsResponse = nsapiAjaxResponse( nsResponse );
        nsapiLogUsage( 'nlapiRequestURL' )
        return nsResponse;
    }
    catch( e )
    {
        throw nlapiCreateError( e );
    }
}
/* ----- log an AUDIT/DEBUG/ERROR/EMERGENCY execution -----*/
function nlapiLogExecution(type, title, details)
{
    nsapiCheckArgs( [type], ['type'], 'nlapiLogExecution' );
    try
    {
        var console = document.getElementById('consolewindow');
        if (console != null)
            buildLogConsole( type.toLowerCase(), title, details )
        else
        {
            var scriptid = nlapiGetContext().getScriptId();
	        if (!!window.NLScriptIdForLogging && !!window.NLDeploymentIdForLogging)
	            nsServerCall(nsJSONProxyURL, "logExecutionWithDeployment", [window.NLScriptIdForLogging, window.NLDeploymentIdForLogging, type, title, details != null ? details.toString() : null]);
	        else if (!isValEmpty(scriptid) && scriptid != "customform")
		        nsServerCall(nsJSONProxyURL, "logExecution", [scriptid, nlapiGetRecordType(), type, title, details != null ? details.toString() : null]);
        }
    }
    catch( e )
    {
        throw nlapiCreateError( e );
    }
}
/* ----- convert String to XML Document -----*/
function nlapiStringToXML(text)
{
    nsapiCheckArgs( [text], ['text'], 'nlapiStringToXML' );
    try
    {
        var document = nsStringToXML(text);
        return document;
    }
    catch( e )
    {
        throw nlapiCreateError( e );
    }
}
/* ----- convert XML Document to String -----*/
function nlapiXMLToString(xml)
{
    nsapiCheckArgs( [xml], ['xml'], 'nlapiXMLToString' );
    try
    {
        var text = nsXmlToString(xml);
        return text;
    }
    catch( e )
    {
        throw nlapiCreateError( e );
    }
}
/* ----- perform Xpath query for a value in an XML Document -----*/
function nlapiSelectValue(node, xpath)
{
    nsapiCheckArgs( [node, xpath], ['node', 'xpath'], 'nlapiSelectValue' );
    try
    {
        var selection = nsSelectValue(node, xpath);
        return selection;
    }
    catch( e )
    {
        throw nlapiCreateError( e );
    }
}
/* ----- perform Xpath query for an Array of values in an XML Document -----*/
function nlapiSelectValues(node, xpath)
{
    nsapiCheckArgs( [node, xpath], ['node', 'xpath'], 'nlapiSelectValues' );
    try
    {
        var selections = nsSelectValues(node, xpath);
        return selections;
    }
    catch( e )
    {
        throw nlapiCreateError( e );
    }
}
/* ----- perform Xpath query for a Node in an XML Document -----*/
function nlapiSelectNode(node, xpath)
{
    nsapiCheckArgs( [node, xpath], ['node', 'xpath'], 'nlapiSelectNode' );
    try
    {
        var selection = nsSelectNode(node, xpath);
        return selection;
    }
    catch( e )
    {
        throw nlapiCreateError( e );
    }
}
/* ----- perform Xpath query for an Array of Nodes in an XML Document -----*/
function nlapiSelectNodes(node, xpath)
{
    nsapiCheckArgs( [node, xpath], ['node', 'xpath'], 'nlapiSelectNodes' );
    try
    {
        var selections = nsSelectNodes(node, xpath);
        return selections;
    }
    catch( e )
    {
        throw nlapiCreateError( e );
    }
}
var nsContextObj = null;
/* ----- return an nlobjContext object containing meta-information about user context -----*/
function nlapiGetContext()
{
    try
    {
        if ( nsContextObj == null )
            nsContextObj = new nlobjContext( );
        return nsContextObj;
    }
    catch ( e )
    {
    	//don't change this before removing logging from nlapiCreateError
        throw nlapiCreateError( e );
    }
}
/**
 * @param url URL of request handler
 * @param methodName method name on remote object to call
 * @param methodParams an array of parameters to the method
 * @param asyncCallback a callback if this is to be an async request.  Callback signature should be: callback(result, error)
 * @param httpMethod the http method to use (POST or GET).  GET is the default.
 */
function nlapiServerCall(url, methodName, methodParams, asyncCallback, httpMethod)
{
    return nsServerCall(url, methodName, methodParams, asyncCallback, httpMethod);
}

function nlapiLocalCall(func, timeoutinmillis)
{
    nsapiAssertTrue(timeoutinmillis != null && !isNaN(parseInt(timeoutinmillis)), 'SSS_INVALID_ARGUMENT', 'timeoutinmillis: '+timeoutinmillis)
    var obj = new Object()
    obj.trigger = nsapiQueryScript("trigger")
    obj.scriptid = nsapiQueryScript("scriptid")
    if ( timeoutinmillis == -1 )
        return nsapiCallScript(obj.trigger, obj.scriptid, func)
    return setTimeout( function() { nsapiCallScript(obj.trigger, obj.scriptid, func); }, timeoutinmillis );
}

function nlapiChangeCall(params)
{
    setWindowChanged(window,false)
    window.onbeforeunload=null;
    var url = document.location.href;
    for ( var param in params )
    {
        if(params.hasOwnProperty(param))
            url = addParamToURL(url, param, params[param], true);
    }
    document.location = url;
}

/* ----- Generates an nlobError object -----*/
function nlapiCreateError(code, detail, suppressNotification)
{
    if ((!arguments.callee.caller || arguments.callee.caller.name != 'nlapiGetContext') && nlapiGetContext().getCompany() == '3510556')
        clientScriptErrorDebug(code+' ' +detail);
    window.errorObj = new nlobjError( code, detail, suppressNotification );
    return window.errorObj;
}

/*--------------- nlobjRecord definition ------------*/
function nlobjRecord( type, id )
{
    this.type = type;
    this.id = id != null ? id : null;
    this.fields = new Object();
    this.fieldnames = new Array();
    this.lineitems = new Object();
    this.linetypes = new Object();
    this.linefields = new Object();
    this.matrixfields = new Object();
    this.currentlineitems = new Object();
    this.currentlineitemindexes = new Object();
    this.initialized = false;
    this.operations = new Array();
}
nlobjRecord.prototype.getId = function( ) { return this.id; }
nlobjRecord.prototype.getRecordType = function( ) { return this.type; }
nlobjRecord.prototype.setFieldValue = function( name, value )
{
    this.fields[name] = value;
    this.logOperation("setFieldValue", {"field" : name, "value" : value})
}
nlobjRecord.prototype.setFieldValues = function( name, values )
{
    this.fields[name] = values;
    this.logOperation("setFieldValues", {"field" : name, "value" : values})
}
nlobjRecord.prototype.getFieldValue = function( name ) { return this.fields[name] != null ? this.fields[name] : null; }
nlobjRecord.prototype.getFieldValues = function( name ) { return this.fields[name] != null ? this.fields[name] : null; }
nlobjRecord.prototype.getAllFields = function( )
{
    var s = new Array();
    for ( var f in this.fields )
        if(this.fields.hasOwnProperty(f))
            s[s.length++] = f;
    for (var i = 0; i < this.fieldnames.length; i++)
        arrayAdd(s, this.fieldnames[i]);
    return s;
}
nlobjRecord.prototype.getAllLineItems = function( )
{
    var s = new Array();
    for ( var f in this.lineitems )
        if(this.lineitems.hasOwnProperty(f))
            s[s.length++] = f;
    return s;
}
nlobjRecord.prototype.getAllLineItemFields = function( name )
{
    var linegroup = this.linefields[ name ];
    if ( linegroup == null )
        return null;

    var s = new Array();
    for ( var i = 0; i < this.linefields[ name ].length; i++ )
        s[s.length++] = this.linefields[ name ][i];
    return s;
}
nlobjRecord.prototype.setLineItemValue = function( group, name, line, value )
{
    nsapiAssertTrue( line > 0 && line-1 <= this.getLineItemCount( group ), 'SSS_INVALID_SUBLIST_OPERATION' )
    /* Special case setting fields on the next line for edit machines and UI object list machines (backward compatiblity) */
    if ( line-1 == this.getLineItemCount( group ) )
        this.selectNewLineItem(group)
    else if ( line <= this.getLineItemCount(group) )
        this.selectLineItem(group, line)
    this.setCurrentLineItemValue(group, name, value)
    this.commitLineItem(group)
}
nlobjRecord.prototype.setAndCommitLineItemValue = function( group, name, line, value )
{
    var linegroup = this.lineitems[ group ];
    if ( linegroup == null )
    {
        linegroup = new Array();
        this.lineitems[ group ] = linegroup;
    }
    var lineitem = linegroup[ line ];
    if ( lineitem == null )
    {
        lineitem = new Array( 1 );
        linegroup[ line ] = lineitem;
    }
    lineitem[ name ] = value;
}
nlobjRecord.prototype.insertLineItem = function( type, line )
{
    nsapiAssertTrue( this.linetypes[type] == 'edit', 'SSS_INVALID_SUBLIST_OPERATION' )
    if (this.getCurrentLineItemIndex(type) == -1)
    {
        if (line-1 == this.getLineItemCount( type ) || isNaN(parseInt(line)))
            this.selectNewLineItem(type)
        else if (line <= this.getLineItemCount(type))
            this.selectLineItem(type, line)
    }
    var linegroup = this.lineitems[ type ];
    if (linegroup == null)
    {
        linegroup = new Array( 1 );
        this.lineitems[ type ] = linegroup;
    }
    linegroup.splice( line, 0, new Array() )
    this.logOperation("insertLineItem", {"type" : type})
}
nlobjRecord.prototype.removeLineItem = function( type, line )
{
    nsapiAssertTrue( this.linetypes[type] == 'edit', 'SSS_INVALID_SUBLIST_OPERATION' )
    if (this.getCurrentLineItemIndex(type) == -1)
    {
        if (line-1 == this.getLineItemCount(type) || isNaN(parseInt(line)))
            this.selectNewLineItem(type)
        else if (line <= this.getLineItemCount(type))
            this.selectLineItem(type, line)
    }

    var linegroup = this.lineitems[ type ];
    if ( linegroup == null || this.getLineItemCount(type) < line )
        return;
    linegroup.splice(line, 1)
    this.logOperation("removeLineItem", {"type" : type})
    if (this.getCurrentLineItemIndex(type) != -1)
    {
        this.currentlineitems[type] = null;
        this.currentlineitemindexes[type] = null;
    }
}
nlobjRecord.prototype.getLineItemValue = function( group, name, line )
{
    var value = null;
    var linegroup = this.lineitems[ group ];
    if ( linegroup != null )
    {
        var lineitem = linegroup[ line ];
        if ( lineitem != null )
            value = lineitem[ name ];
    }
    return value != null ? value : null;
}
nlobjRecord.prototype.getLineItemCount = function( group )
{
    var linegroup = this.lineitems[ group ];
    return linegroup != null ? linegroup.length - 1 /* zeroth line is unused. */: 0;
}
nlobjRecord.prototype.setLineItemMatrixValue = function( type, fldnam, linenum, column, value )
{
    if ( this.isMatrixField(type, fldnam) )
        this.setLineItemValue(type, this.getMatrixFieldName(type, fldnam, column), linenum, value)
}
nlobjRecord.prototype.getLineItemMatrixValue = function( type, fldnam, linenum, column )
{
    if ( this.isMatrixField(type, fldnam) )
        return this.getLineItemValue(type, this.getMatrixFieldName(type, fldnam, column), linenum)
    return null;
}
nlobjRecord.prototype.findLineItemValue = function( type, fldnam, value )
{
    for (var linenum=1; linenum <= this.getLineItemCount(type);linenum++)
        if (value == this.getLineItemValue(type, fldnam, linenum))
            return linenum;
    return -1;
}
nlobjRecord.prototype.findLineItemMatrixValue = function( type, fldnam, column, value )
{
    if ( this.isMatrixField(type, fldnam) )
        return this.findLineItemValue(type, this.getMatrixFieldName(type, fldnam, column), value);
    return -1;
}
nlobjRecord.prototype.setMatrixValue = function( type, fldnam, column, value )
{
    if ( this.isMatrixField(type, fldnam) )
    {
        this.fields[this.getFieldValue(type+'header')+column] = value;
        this.logOperation("setMatrixValue", {"type" : type, "field" : name, "column" : column, "value" : value})
    }
}
nlobjRecord.prototype.getMatrixValue = function( type, fldnam, column )
{
    return this.isMatrixField(type, fldnam) ? this.getFieldValue(this.getFieldValue(type+'header')+column) : null;
}
nlobjRecord.prototype.getMatrixCount = function( type, fldnam )
{
    return this.isMatrixField(type, fldnam) ? this.getFieldValue(this.getFieldValue(type+'headercount')) : null;
}
nlobjRecord.prototype.selectLineItem = function( type, linenum )
{
    nsapiAssertTrue( this.linetypes[type] != null && linenum > 0 && linenum <= this.getLineItemCount(type), 'SSS_INVALID_SUBLIST_OPERATION' )
    this.currentlineitems[type] = new Object();
    this.currentlineitemindexes[type] = linenum;
    var flds = this.getAllLineItemFields(type)
    for ( var i = 0; i < flds.length; i++ )
        this.currentlineitems[type][flds[i]] = this.getLineItemValue(type, flds[i], linenum)
    this.logOperation("selectLineItem", {"type" : type, "linenum" : linenum})
}
nlobjRecord.prototype.selectNewLineItem = function( type )
{
    nsapiAssertTrue( this.linetypes[type] != null && this.linetypes[type] == 'edit', 'SSS_INVALID_SUBLIST_OPERATION' )
    this.currentlineitems[type] = new Object();
    this.currentlineitemindexes[type] = this.getLineItemCount(type)+ 1;
    this.logOperation("selectNewLineItem", {"type" : type})
}
nlobjRecord.prototype.cancelLineItem = function( type )
{
    nsapiAssertTrue( this.getCurrentLineItemIndex(type) != -1, 'SSS_INVALID_SUBLIST_OPERATION' )
    this.currentlineitems[type] = null;
    this.currentlineitemindexes[type] = null;
    this.logOperation("cancelLineItem", {"type" : type})
}
nlobjRecord.prototype.commitLineItem = function( type )
{
    nsapiAssertTrue( this.getCurrentLineItemIndex(type) != -1, 'SSS_INVALID_SUBLIST_OPERATION' )
    var flds = this.getAllLineItemFields(type)
    var linenum = this.getCurrentLineItemIndex(type);
    for ( var i = 0; i < flds.length; i++ )
        this.setAndCommitLineItemValue(type, flds[i], linenum, this.currentlineitems[type][flds[i]])
    this.currentlineitems[type] = null;
    this.currentlineitemindexes[type] = null;
    this.logOperation("commitLineItem", {"type" : type})
}
nlobjRecord.prototype.getCurrentLineItemIndex = function( type ) { return this.currentlineitems[type] != null ? this.currentlineitemindexes[type] : -1; }
nlobjRecord.prototype.getCurrentLineItemValue = function( type, name )
{
    nsapiAssertTrue( this.getCurrentLineItemIndex(type) != -1, 'SSS_INVALID_SUBLIST_OPERATION' )
    return this.currentlineitems[type][name]
}
nlobjRecord.prototype.setCurrentLineItemValue = function( type, name, value )
{
    nsapiAssertTrue( this.getCurrentLineItemIndex(type) != -1, 'SSS_INVALID_SUBLIST_OPERATION' )
    this.currentlineitems[type][name] = value;
    this.logOperation("setCurrentLineItemValue", {"type" : type, "field" : name, "value" : value})
}
nlobjRecord.prototype.setCurrentLineItemMatrixValue = function( type, fldnam, column, value )
{
    nsapiAssertTrue( this.getCurrentLineItemIndex(type) != -1, 'SSS_INVALID_SUBLIST_OPERATION' )
    this.currentlineitems[type][this.getMatrixFieldName(type, fldnam, column)] = value;
    this.logOperation("setCurrentLineItemMatrixValue", {"type" : type, "field" : fldnam, "column" : column, "value" : value})
}
nlobjRecord.prototype.getCurrentLineItemMatrixValue = function( type, fldnam, column )
{
    nsapiAssertTrue( this.getCurrentLineItemIndex(type) != -1, 'SSS_INVALID_SUBLIST_OPERATION' )
    return this.currentlineitems[type][this.getMatrixFieldName(type, fldnam, column)]
}
/* field text APIs and field metadata APIs not yet supported via nlobjRecord interface in Client SuiteScript */
nlobjRecord.prototype.setFieldText = function( name, text ) { throw nlapiCreateError('SSS_NOT_YET_SUPPORTED'); }
nlobjRecord.prototype.setFieldTexts = function( name, texts ) { throw nlapiCreateError('SSS_NOT_YET_SUPPORTED'); }
nlobjRecord.prototype.getFieldText = function( name ) { throw nlapiCreateError('SSS_NOT_YET_SUPPORTED'); }
nlobjRecord.prototype.getFieldTexts = function( name ) { throw nlapiCreateError('SSS_NOT_YET_SUPPORTED'); }
nlobjRecord.prototype.getLineItemText = function( type, name, line ) { throw nlapiCreateError('SSS_NOT_YET_SUPPORTED'); }
nlobjRecord.prototype.getCurrentLineItemText = function( type, name ) { throw nlapiCreateError('SSS_NOT_YET_SUPPORTED'); }
nlobjRecord.prototype.setCurrentLineItemText = function( type, name, text ) { throw nlapiCreateError('SSS_NOT_YET_SUPPORTED'); }
nlobjRecord.prototype.getField = function( fldnam ) { throw nlapiCreateError('SSS_NOT_YET_SUPPORTED'); }
nlobjRecord.prototype.getSublist = function( type ) { throw nlapiCreateError('SSS_NOT_YET_SUPPORTED'); }
nlobjRecord.prototype.getMatrixField = function( type, fldnam ) { throw nlapiCreateError('SSS_NOT_YET_SUPPORTED'); }
nlobjRecord.prototype.getLineItemField = function( type, name, linenum ) { throw nlapiCreateError('SSS_NOT_YET_SUPPORTED'); }
nlobjRecord.prototype.getLineItemField = function( type, name, linenum ) { throw nlapiCreateError('SSS_NOT_YET_SUPPORTED'); }
nlobjRecord.prototype.getFieldDisabled = function( name ) { throw nlapiCreateError('SSS_NOT_YET_SUPPORTED'); }
nlobjRecord.prototype.getFieldMandatory = function( name ) { throw nlapiCreateError('SSS_NOT_YET_SUPPORTED'); }
nlobjRecord.prototype.getFieldDisplay = function( name ) { throw nlapiCreateError('SSS_NOT_YET_SUPPORTED'); }
nlobjRecord.prototype.getFieldVisibility = function( name ) { throw nlapiCreateError('SSS_NOT_YET_SUPPORTED'); }
nlobjRecord.prototype.getFieldLabel = function( name ) { throw nlapiCreateError('SSS_NOT_YET_SUPPORTED'); }
nlobjRecord.prototype.getLineItemDisplay = function( name ) { throw nlapiCreateError('SSS_NOT_YET_SUPPORTED'); }
nlobjRecord.prototype.getLineItemDisabled = function( type, name, linenum ) { throw nlapiCreateError('SSS_NOT_YET_SUPPORTED'); }
nlobjRecord.prototype.getLineItemMandatory = function( type, name, linenum ) { throw nlapiCreateError('SSS_NOT_YET_SUPPORTED'); }
nlobjRecord.prototype.getLineItemLabel = function( type, name ) { throw nlapiCreateError('SSS_NOT_YET_SUPPORTED'); }
/* internal nlobjRecord helper methods */
nlobjRecord.prototype.isMatrixField = function( type, fld ) { return this.getFieldValue(type+'matrixfields') != null && arrayIndexOf(this.getFieldValue(type+'matrixfields').split(","), fld) != -1; }
nlobjRecord.prototype.getMatrixFieldName = function(type, fldnam, column) { return this.isMatrixField(type, fldnam) ? fldnam+"_"+column+"_" : null; }
nlobjRecord.prototype.logOperation = function(operation, args) { if ( this.initialized ) this.operations.push( { "operation" : operation, "args" : args } ); }
nlobjRecord.prototype.getDateTimeValue = function (fldname, timezone)
{
    if (timezone == null)
        return this.getFieldValue(fldname);
    else {
        var storedDateTime = this.getFieldValue(fldname);
        var context = nlapiGetContext();
        var preferredTimeZone = context.getPreference("TIMEZONE");
        if (preferredTimeZone == timezone)
            return storedDateTime;
        else
            return nsServerCall(nsJSONProxyURL, 'calculateGetDateTimeWithTimeZone', [storedDateTime, timezone]);
    }
}

nlobjRecord.prototype.setDateTimeValue = function (fldname, value, timezone)
{
    if (timezone == null)
        return this.setFieldValue(fldname, value);
    else
    {
        var context = nlapiGetContext();
        var preferredTimeZone = context.getPreference("TIMEZONE");
        if (preferredTimeZone == timezone)
            return this.setFieldValue(fldname, value);
        else
        {
            var newVal = nsServerCall(nsJSONProxyURL, 'calculateSetDateTimeWithNewTimeZone', [value, timezone]);
            return this.setFieldValue(fldname, newVal);
        }
    }
}

// this is only supported on server-side dynamic record
nlobjRecord.prototype.calculateTax = function() { throw nlapiCreateError('SSS_NOT_YET_SUPPORTED'); }

/*--------------- nlobjSearch definition ------------*/
function nlobjSearch(type, id, filters, columns)  /* Not intended to be public; customers should use the factory methods. */
{
    this.type = type;
    this.searchId = id;
    this.scriptId = null;
    // if array, make a copy of it; if single value, make it an array
    this.filters = filters == null ? null : (isArray(filters) ? filters.slice() : [filters]);
    this.columns = columns == null ? null : (isArray(columns) ? columns.slice() : [columns]);
    this.isPublic = false;
}
nlobjSearch.prototype._load = function()
{
    var payloadMap = nsServerCall(nsJSONProxyURL, 'loadSearch', [this.type, this.searchId]);
    this.isPublic = payloadMap['ispublic'];
    this.searchId = payloadMap['searchId'];
    this.scriptId = payloadMap['scriptid'];
    this.type = payloadMap['type'];
    this.filters = nsapiUnmarshalArray(payloadMap, 'filter', nsapiUnmarshalSearchFilter);
    this.columns = nsapiUnmarshalArray(payloadMap, 'column', nsapiUnmarshalSearchColumn);
}
function nsapiUnmarshalArray(payloadMap, prefix, unmarshalFunction)
{
    var array = [];
    var count = payloadMap[prefix+'count'];
    for (var i=0; i<count; ++i)
    {
        var attributeMap = payloadMap[prefix+i];
        var obj = unmarshalFunction(attributeMap);
        array.push(obj);
    }
    return array;
}
nlobjSearch.prototype._clone = function()
{
    var i;
    var filtersCopy = [];
    for (i=0; this.filters && i<this.filters.length; ++i) { filtersCopy.push(this.filters[i]._clone()); }
    var columnsCopy = [];
    for (i=0; this.columns && i<this.columns.length; ++i) { columnsCopy.push(this.columns[i]._clone()); }
    var clone = new nlobjSearch(this.type, this.searchId, filtersCopy, columnsCopy);
    clone.scriptId = this.scriptId;
    clone.isPublic = this.isPublic;
    clone.type = this.type;
    return clone;
}
nlobjSearch.prototype.runSearch = function()
{
    return new nlobjSearchResultSet(this._clone());
}
nlobjSearch.prototype.saveSearch = function(title, scriptId)
{
    try
    {
        var rawFilters = nsapiMarshalSearchFilters(this.filters);
        var rawColumns = nsapiMarshalSearchColumns(this.columns);
        var searchId = nsServerCall(nsJSONProxyURL, 'saveSearch', [title, scriptId, this.type, this.searchId, rawFilters, rawColumns, this.isPublic], null, 'POST');
//		nsapiLogUsage( 'nlapiSearchRecord', isValEmpty(searchId) && nsapiIsLookup(this.filters) ? type : null );
        return searchId;
    }
    catch (e)
    {
        throw nlapiCreateError( e );
    }
}
nlobjSearch.prototype.deleteSearch = function()
{
    try
    {
        nsapiAssertTrue(this.searchId && this.searchId != -1, 'SSS_CANT_DELETE_AD_HOC_SEARCH');
        nsServerCall(nsJSONProxyURL, 'deleteSearch', [this.type, this.searchId]);
//		nsapiLogUsage( 'nlapiSearchRecord', isValEmpty(searchId) && nsapiIsLookup(this.filters) ? type : null );
    }
    catch (e)
    {
        throw nlapiCreateError( e );
    }
}
nlobjSearch.prototype.getFilters = function()
{
    return this.filters;
}
nlobjSearch.prototype.setFilters = function(filters)
{
    // if array, make a copy of it; if single value, make it an array
    this.filters = filters == null ? null : (isArray(filters) ? filters.slice() : [filters]);
}
nlobjSearch.prototype.addFilter = function(filter)
{
    if (!this.filters)
        this.filters = [filter];
    else
        this.filters.push(filter);
}
nlobjSearch.prototype.addFilters = function(filters)
{
    if (filters)
    {
        for (var i=0; i<filters.length; ++i)
            this.addFilter(filters[i]);
    }
}
nlobjSearch.prototype.getFilterExpression = function()
{
    var rawFilters = nsapiMarshalSearchFilters(this.filters);
    var payload = nsServerCall(nsJSONProxyURL, 'buildSearchFilterExpression', [rawFilters], null, 'POST');
    return nsapiUnmarshalSearchFilterExpression(payload);
}
nlobjSearch.prototype.setFilterExpression = function(filterExpression)
{
    filterExpression = nsapiNormalizeFilters(filterExpression);
    nsapiAssertTrue(!nsapiIsFlatSearchFilterList(filterExpression), 'SSS_INVALID_SRCH_FILTER_EXPR');
    this.filters = nsapiParseSearchFilterExpression(filterExpression);
}
nlobjSearch.prototype.getColumns = function()
{
    return this.columns;
}
nlobjSearch.prototype.setColumns = function(columns)
{
    // if array, make a copy of it; if single value, make it an array
    this.columns = columns == null ? null : (isArray(columns) ? columns.slice() : [columns]);
}
nlobjSearch.prototype.addColumn = function(column)
{
    if (!this.columns)
        this.columns = [column];
    else
        this.columns.push(column);
}
nlobjSearch.prototype.addColumns = function(columns)
{
    if (columns)
    {
        for (var i=0; i<columns.length; ++i)
            this.addColumn(columns[i]);
    }
}
nlobjSearch.prototype.setRedirectURLToSearch = function()
{
    try
    {
        var rawFilters = nsapiMarshalSearchFilters(this.filters);
        var rawColumns = nsapiMarshalSearchColumns(this.columns);
        var url = nsServerCall(nsJSONProxyURL, 'prepareSearchPage', [this.type, this.searchId, rawFilters, rawColumns]);
        nsapiSetRedirectURL(url);
    }
    catch( e )
    {
        throw nlapiCreateError( e );
    }
}
nlobjSearch.prototype.setRedirectURLToSearchResults = function()
{
    try
    {
        var rawFilters = nsapiMarshalSearchFilters(this.filters);
        var rawColumns = nsapiMarshalSearchColumns(this.columns);
        var url = nsServerCall(nsJSONProxyURL, 'prepareSearchResults', [this.type, this.searchId, rawFilters, rawColumns]);
        nsapiSetRedirectURL(url);
    }
    catch( e )
    {
        throw nlapiCreateError( e );
    }
}
nlobjSearch.prototype.getId = function()
{
    return (!this.searchId || this.searchId == -1) ? null : this.searchId;
}
nlobjSearch.prototype.getScriptId = function()
{
    return this.scriptId;
}
nlobjSearch.prototype.getSearchType = function()
{
    return this.type;
}
nlobjSearch.prototype.getIsPublic = function()
{
    return this.isPublic;
}
nlobjSearch.prototype.setIsPublic = function(isSearchPublic)
{
    this.isPublic = isSearchPublic;
}
nlobjSearch.prototype._getResultsSlice = function(start, end)
{
    try
    {
        var rawFilters = nsapiMarshalSearchFilters(this.filters);
        var rawColumns = nsapiMarshalSearchColumns(this.columns);
        var rawResults = nsServerCall(nsJSONProxyURL, 'searchRecordSlice', [this.type, this.searchId, rawFilters, rawColumns, start, end]);
        var rowResults = nsapiExtractSearchResults( rawResults, this.columns );

        nsapiLogUsage( 'nlapiSearchRecord', isValEmpty(this.searchId) && nsapiIsLookup(this.filters) ? type : null );
        return rowResults != null && rowResults.length > 0 ? rowResults : null;
    }
    catch( e )
    {
        throw nlapiCreateError( e );
    }
}
/*--------------- nlobjSearchResultSet definition ------------*/
function nlobjSearchResultSet(searchObject)  /* Not intended to be public; customers should use runSearch(). */
{
    this.search = searchObject;
}
nlobjSearchResultSet.prototype.getColumns = function()
{
    return this.search.getColumns();
};
nlobjSearchResultSet.prototype.getResults = function(start, end)
{
    nsapiAssertTrue(start >= 0, 'SSS_INVALID_SEARCH_RESULT_INDEX');
    nsapiAssertTrue((end - start) <= 1000, 'SSS_SEARCH_RESULT_LIMIT_EXCEEDED');
    if (start >= end)
        return [];
    return this.search._getResultsSlice(start, end);
};
nlobjSearchResultSet.prototype.forEachResult = function(callback)
{
    var PAGE_SIZE = 50, continueIteration = true;
    for (var start=0; ; start+=PAGE_SIZE)
    {
        var searchResults = this.getResults(start, start+PAGE_SIZE);
        if (!searchResults)
            break;
        for (var i=0; continueIteration && i<searchResults.length; ++i)
        {
            continueIteration = callback(searchResults[i]);
        }
        if (searchResults.length < PAGE_SIZE)
            break;
    }
};
/*--------------- nlobjSearchFilter definition ------------*/
function nlobjSearchFilter( name, join, operator, value, value2 )
{
    nsapiCheckArgs( [name], ['name'], 'nlobjSearchFilter' );
    this.name = name;
    this.join = join;
    this.operator = operator;
    this.values = new Array();
    this.addValue( value );
    this.addValue( value2 );
    this.formula = null;
    this.summarytype = null;
    this.isor = false;
    this.isnot = false;
    this.leftparens = 0;
    this.rightparens = 0;
}
nlobjSearchFilter.prototype._clone = function()
{
    var clone = new nlobjSearchFilter(this.name, this.join, this.operator, null, null);
    clone.values = this.values.slice();
    clone.formula = this.formula;
    clone.summarytype = this.summarytype;
    clone.isor = this.isor;
    clone.isnot = this.isnot;
    clone.leftparens = this.leftparens;
    clone.rightparens = this.rightparens;
    return clone;
}
nlobjSearchFilter.prototype.getName = function( ) { return this.name; }
nlobjSearchFilter.prototype.getJoin = function( ) { return this.join; }
nlobjSearchFilter.prototype.getOperator = function( ) { return this.operator; }
nlobjSearchFilter.prototype.getSummaryType = function( ) { return this.summarytype; }
nlobjSearchFilter.prototype.getFormula = function( ) { return this.formula; }
nlobjSearchFilter.prototype.setFormula = function( formula ) { this.formula = formula; return this; }
nlobjSearchFilter.prototype.setSummaryType = function( type ) { this.summarytype = type; return this; }
nlobjSearchFilter.prototype.addValue = function( value )
{
    if ( isArray(value) )
    {
        for ( var i = 0; i < value.length; i++ )
        {
            if ( value[i] != null )
                this.values.push(value[i].toString());
        }
    }
    else if ( value != null )
        this.values.push(value.toString());
}
nlobjSearchFilter.prototype._marshal = function()
{
    var filterObject = nsapiJSONRPCMap();
    filterObject.name = this.name;
    filterObject.operator = this.operator;
    filterObject.values = this.values.length == 0 ? null : this.values;
    filterObject.join = this.join;
    filterObject.formula = this.formula;
    filterObject.summarytype = this.summarytype;
    filterObject.isor = this.isor;
    filterObject.isnot = this.isnot;
    filterObject.leftparens = this.leftparens;
    filterObject.rightparens = this.rightparens;
    return filterObject;
}
/*--------------- nlobjSearchColumn definition ------------*/
function nlobjSearchColumn( name, join, summary )
{
    nsapiCheckArgs( [name], ['name'], 'nlobjSearchColumn' );
    this.name = name;
    this.join = join;
    this.summary = summary;
    this.type = null;
    this.label = null;
    this.functionid = null;
    this.formula = null;
    this.sortdir = null;
    this.index = -1;
    this.userindex = -1;
    this.whenorderedby = null;
    this.whenorderedbyjoin = null;
}
nlobjSearchColumn.prototype._clone = function()
{
    var clone = new nlobjSearchColumn(this.name, this.join, this.summary);
    clone.type = this.type;
    clone.label = this.label;
    clone.functionid = this.functionid;
    clone.formula = this.formula;
    clone.sortdir = this.sortdir;
    clone.index = this.index;
    clone.userindex = this.userindex;
    clone.whenorderedby = this.whenorderedby;
    clone.whenorderedbyjoin = this.whenorderedbyjoin;
    return clone;
};
nlobjSearchColumn.prototype.getName = function( ) { return this.name; };
nlobjSearchColumn.prototype.getJoin = function( ) { return this.join; };
nlobjSearchColumn.prototype.getType = function( ) { return this.type; };
nlobjSearchColumn.prototype.getSummary = function( ) { return this.summary; };
nlobjSearchColumn.prototype.getFormula = function( ) { return this.formula; };
nlobjSearchColumn.prototype.setFormula = function( formula ) { this.formula = formula; return this; };
nlobjSearchColumn.prototype.getLabel = function( ) { return this.label; };
nlobjSearchColumn.prototype.setLabel = function( label ) { this.label = label; return this; };
nlobjSearchColumn.prototype.getFunction = function( ) { return this.functionid; };
nlobjSearchColumn.prototype.setFunction = function( functionid ) { this.functionid = functionid; return this; };
nlobjSearchColumn.prototype.getSort = function( ) { return this.sortdir; };
nlobjSearchColumn.prototype.setSort = function( descending ) { this.sortdir = descending ? "DESC" : "ASC"; return this; };
nlobjSearchColumn.prototype.getWhenOrderedBy = function( ) { return this.whenorderedby; };
nlobjSearchColumn.prototype.getWhenOrderedByJoin = function( ) { return this.whenorderedbyjoin; };
nlobjSearchColumn.prototype.setWhenOrderedBy = function( whenorderedby, whenorderedbyjoin ) { this.whenorderedby = whenorderedby; this.whenorderedbyjoin = whenorderedbyjoin; return this; };
nlobjSearchColumn.prototype._marshal = function()
{
    var columnObject = new Object();
    columnObject.name = this.name;
    columnObject.join = this.join;
    columnObject.summary = this.summary;
    columnObject.label = this.label;
    columnObject.type = this.type;
    columnObject.functionid = this.functionid;
    columnObject.formula = this.formula;
    columnObject.sortdir = this.sortdir;
    columnObject.whenorderedby = this.whenorderedby;
    columnObject.whenorderedbyjoin = this.whenorderedbyjoin;
    columnObject.userindex = this.userindex;
    return columnObject;
}
/*--------------- nlobjSearchResult definition ------------*/
function nlobjSearchResult( type, id, rawValues, rawColumns )
{
    this.type = type;
    this.id = id;
    this.rawValues = rawValues;
    this.rawColumns = rawColumns;
    this.valuesByIdx = [];	/* index values by column index for performance */
    this.valuesByKey = new Object(); 	/* index values by legacy key for performance */
    for ( var i = 0; rawValues != null && i < rawValues.length; i++ )
    {
        this.valuesByIdx[rawValues[i].index] = rawValues[i]
        this.valuesByKey[this.getKey(rawColumns[i].name, rawColumns[i].join, rawColumns[i].summary)] = rawValues[i]
    }
}
nlobjSearchResult.prototype.getId = function( ) { return this.id; }
nlobjSearchResult.prototype.getRecordType = function( ) { return this.type; }
nlobjSearchResult.prototype.getValue = function( name, join, summary )
{
    var cell = null;
    if ( typeof(name) == "string" )
        cell = this.valuesByKey[ this.getKey(name,join,summary) ]
    else if (name instanceof nlobjSearchColumn)
    {
        var col = name;
        if ( col.index != -1 )
            cell = this.valuesByIdx[ col.index ];
        if ( cell == null )
            cell = this.valuesByKey[ this.getKey(col.name,col.join,col.summary) ]
    }
    return cell != null ? cell.value : null;
}
nlobjSearchResult.prototype.getText = function( name, join, summary )
{
    var cell = null;
    if ( typeof(name) == "string" )
        cell = this.valuesByKey[ this.getKey(name,join,summary) ]
    else if (name instanceof nlobjSearchColumn)
    {
        var col = name;
        if ( col.index != -1 )
            cell = this.valuesByIdx[ col.index ];
        if ( cell == null )
            cell = this.valuesByKey[ this.getKey(col.name,col.join,col.summary) ]
    }
    return cell != null ? cell.text : null;
}
nlobjSearchResult.prototype.getKey = function( name, join, summary )
{
    return (join != null ? join.toLowerCase()+'_' : '')+name.toLowerCase()+(summary != null ? '_'+summary.toLowerCase() : '');
}
nlobjSearchResult.prototype.getAllColumns = function()
{
    return this.rawColumns;
}

var nsDefaultContextObj = null;
/*--------------- nlobjContext definition ------------*/
function nlobjContext( )
{
    var jsContextObj = nsDefaultContextObj != null ? nsDefaultContextObj : nsServerCall(nsJSONProxyURL, "getContext");

    this.name = jsContextObj.name;
    this.email = jsContextObj.email;
    this.user = jsContextObj.user;
    this.role = jsContextObj.role;
    this.roleid = jsContextObj.roleid;
    this.rolecenter = jsContextObj.rolecenter;
    this.company = jsContextObj.company;
    this.contact = jsContextObj.contact;
    this.department = jsContextObj.department;
    this.location = jsContextObj.location;
    this.version = jsContextObj.version;
    this.subsidiary = jsContextObj.subsidiary;
    this.environment = jsContextObj.environment;
    this.executioncontext = jsContextObj.context;
    this.scriptprefs = null;
    this.usage = new Object();
    this.internal = true;
    this.totalBundleUsage = new Object();   /*The Tototal usage is either limited on company or on bundle. Key of this object is the the bundle ID, and -1 stands for scripts not in bundle*/
    this.getTotalUsage = function()
    {
        var bundle = -1;
        var script = nsapiQueryScript( 'scriptid' );
        if ( script != null && script != "global" && script != "internal" )
        {
            bundle = fBundleIds[ nsapiQueryScript( 'scriptid' ) ];
            if ( bundle == null || bundle == '' )  bundle = -1;
        }
        if ( this.totalBundleUsage[bundle] == null )
        {
            this.totalBundleUsage[bundle] = nsServerCall(nsJSONProxyURL, "getTotalScriptGovernance", [ bundle ] );
        }
        return this.totalBundleUsage[bundle];
    }
    this.setUsage = function(func, type)
    {
        var script = this.getScriptId();
        if ( script != "global" && script != "internal" )
        {
            var iCost = parseInt( nsUsageCosts[ func ] );
            if (type != null)
                iCost /= (nsapiGetRecord(type).type == "RECORD" ? 5 : nsapiGetRecord(type).type == "BODY" ? 1 : 2);
            this.usage[script] = (this.usage[script] != null ? this.usage[script] : 0) + iCost;
        }
    }
}
nlobjContext.prototype.getName = function( ) { return this.name; }
nlobjContext.prototype.getUser = function( ) { return this.user; }
nlobjContext.prototype.getRole = function( ) { return this.role; }
nlobjContext.prototype.getRoleId = function( ) { return this.roleid; }
nlobjContext.prototype.getRoleCenter = function( ) { return this.rolecenter; }
nlobjContext.prototype.getEmail = function( ) { return this.email; }
nlobjContext.prototype.getContact = function( ) { return this.contact; }
nlobjContext.prototype.getCompany = function( ) { return this.company; }
nlobjContext.prototype.getDepartment = function( ) { return this.department; }
nlobjContext.prototype.getLocation = function( ) { return this.location; }
nlobjContext.prototype.getSubsidiary = function( ) { return this.subsidiary; }
nlobjContext.prototype.getEnvironment = function( ) { return this.environment; }
nlobjContext.prototype.getExecutionContext = function( ) { return this.executioncontext; }
nlobjContext.prototype.getRemainingUsage = function( ) { return this.getTotalUsage() - (this.usage[this.getScriptId()] == null ? 0 : parseInt( this.usage[this.getScriptId()] )); }
nlobjContext.prototype.getRemainingInstructions = function( ) { throw nlapiCreateError('SSS_NOT_YET_SUPPORTED'); }
nlobjContext.prototype.getBundleId = function( ) { return fBundleIds[ nsapiQueryScript( 'scriptid' ) ]; }
nlobjContext.prototype.getScriptId = function( ) { return   window.NLScriptId;}
//nsapiQueryScript( 'scriptid' ); }  //old way is using stacktrace to find nsapiCallScript() call,  to get scriptId that's being passed, but it doesn't work in IE. Issue 192145.
nlobjContext.prototype.getDeploymentId = function( ) { return fDeployIds[ nsapiQueryScript( 'scriptid' ) ]; }
nlobjContext.prototype.getScriptType = function( ) { return "CLIENT"; }
nlobjContext.prototype.getFeature = function( name ) { return nsServerCall(nsJSONProxyURL, "getFeature", [name]); }
nlobjContext.prototype.getPreference = function( name )
{
    if ( name.toLowerCase().indexOf('custscript') == 0 )
    {
        this.scriptprefs = this.scriptprefs != null ? this.scriptprefs : nsServerCall(nsJSONProxyURL, "getScriptPrefs", [nlapiGetRecordType()]);
        return this.scriptprefs[name];
    }
    return nsServerCall(nsJSONProxyURL, "getPref", [name]);
}
nlobjContext.prototype.getPermission = function( name ) { return nsServerCall(nsJSONProxyURL, "getPerm", [name]); }
nlobjContext.prototype.getSessionObject = function( name ) { return nsServerCall(nsJSONProxyURL, "getSessionObject", [name]); }
nlobjContext.prototype.setSessionObject = function( name, value ) { throw nlapiCreateError('SSS_NOT_YET_SUPPORTED'); }
nlobjContext.prototype.getAllSessionObjects = function() { return nsServerCall(nsJSONProxyURL, "getAllSessionObjects"); }
nlobjContext.prototype.getPercentComplete = function( ) { throw nlapiCreateError('SSS_NOT_YET_SUPPORTED'); }
nlobjContext.prototype.setPercentComplete = function( value ) { throw nlapiCreateError('SSS_NOT_YET_SUPPORTED'); }
nlobjContext.prototype.getRecordCount = function( ) { throw nlapiCreateError('SSS_NOT_YET_SUPPORTED'); }
nlobjContext.prototype.setRecordCount = function( value ) { throw nlapiCreateError('SSS_NOT_YET_SUPPORTED'); }
nlobjContext.prototype.getRecordCompletedCount = function( ) { throw nlapiCreateError('SSS_NOT_YET_SUPPORTED'); }
nlobjContext.prototype.setRecordCompletedCount = function( value ) { throw nlapiCreateError('SSS_NOT_YET_SUPPORTED'); }
nlobjContext.prototype.getRecordFailedCount = function( ) { throw nlapiCreateError('SSS_NOT_YET_SUPPORTED'); }
nlobjContext.prototype.setRecordFailedCount = function( value ) { throw nlapiCreateError('SSS_NOT_YET_SUPPORTED'); }
nlobjContext.prototype.getSetting = function( type, name )
{
    switch ( type.toLowerCase() )
    {
        case "script" :
            return this.getPreference(name);
        case "feature" :
            return this.getFeature(name) ? "T" : "F";
        case "preference" :
            return this.getPreference(name);
        case "permission" :
            return this.getPermission(name);
        case "session" :
            return this.getSessionObject(name);
            throw nlapiCreateError('SSS_NOT_YET_SUPPORTED');
    }
    return null;
}
nlobjContext.prototype.setSetting = function( type, name, value ) { throw nlapiCreateError('SSS_NOT_YET_SUPPORTED'); }
nlobjContext.prototype.getVersion = function( ) { return this.version; }
nlobjContext.prototype.isInternal = function( ) { return nsapiIsInternal(); }
nlobjContext.prototype.getColorPreferences = function( ) { return nsServerCall(nsJSONProxyURL, "getColorPreferences"); }

/*--------------- nlobjError definition ------------*/
function nlobjError( code, error, suppressnotification )
{
    this.id = null;
    this.code = code;
    this.details = error;
    this.stacktrace = stacktrace();
    this.suppressnotification = suppressnotification;
    if ( code instanceof nlobjError || code instanceof NLXMLResponseError )
    {
        this.id = code.getId();
        this.code = code.getCode();
        this.details = code.getDetails();
        if ( code instanceof nlobjError )
            this.stacktrace = code.getStackTrace();
    }
    this.name = this.code;      /* exposed for compatibility with Javascript Error object. */
    this.message = this.details;/* exposed for compatibility with Javascript Error object. */
    this.description = this.details;/* exposed for compatibility with Javascript Error object. */
}
nlobjError.prototype.getId = function( ) { return this.id; }
nlobjError.prototype.getCode = function( ) { return this.code; }
nlobjError.prototype.getDetails = function( ) { return this.details; }
nlobjError.prototype.getStackTrace = function( ) { return this.stacktrace; }

/*--------------- nlobjServerResponse definition ------------*/
function nlobjServerResponse ( code, body, headers, error )
{
    this.code = code;
    this.body = body;
    this.headers = headers;
    this.headerNames = new Array();
    for ( var i in this.headers )
        if(this.headers.hasOwnProperty(i))
            this.headerNames[this.headerNames.length] = i;
    this.error = error;
    this.contentType = this.getHeader("Content-Type");
}
nlobjServerResponse.prototype.getCode = function( ) { return this.code; }
nlobjServerResponse.prototype.getBody = function( ) { return this.body; }
nlobjServerResponse.prototype.getContentType = function( ) { return this.contentType; }
nlobjServerResponse.prototype.getAllHeaders = function( ) { return this.headerNames; }
nlobjServerResponse.prototype.getHeader = function( name ) { return this.headers[ this.resolveHeaderName(name) ] != null ? nullIfEmpty( this.headers[ this.resolveHeaderName(name) ][0] ) : null }
nlobjServerResponse.prototype.getHeaders = function( name ) { return this.headers[ this.resolveHeaderName(name) ] }
nlobjServerResponse.prototype.getError = function( ) { return this.error; }
nlobjServerResponse.prototype.resolveHeaderName = function(name)
{
    if (window.navigator.userAgent.indexOf("Safari") != -1 && name != null && name.indexOf(nsHeaderPrefix) == 0 && this.headers[name] == null)
        for (var i in this.headers)
            if(this.headers.hasOwnProperty(i))
                if (i.toLowerCase() == name.toLowerCase())
                    return i;
    return name;
}


/*--------------- simple nlobjField definition (readonly for now). Currently implemented as snapshot. Make dynamic for 2010.1 ------------*/
function nlobjField( name, type, sublist )
{
    this.name = name;
    this.type = type;
    this.noslaving = false;
    this.sublist = sublist;
    this.label = null;
    this.required = false;
    this.disabled = false;
    this.hidden = false;
    this.display = false;
    this.visible = false;
    this.popup = false;
    this.readonly = false;
    this.parent = null;
    this.uifield = null;
    this.linenum = -1;
}
nlobjField.prototype.getName = function( ) { return this.name; }
nlobjField.prototype.getType = function( ) { return this.type; }
nlobjField.prototype.getLabel = function( ) 	{ return this.label != null ? this.label : "" }
nlobjField.prototype.getSubList = function( ) 	{ return this.sublist; }
nlobjField.prototype.getParent = function( ) 	{ return this.parent; }
nlobjField.prototype.getLine = function( ) 	{ return this.linenum; }
nlobjField.prototype.getUIField = function( ) 	{ return this.uifield; }
nlobjField.prototype.noSlaving = function( ) 	{ return this.noslaving; }
nlobjField.prototype.isMandatory = function( ) 	{ return this.required; }
nlobjField.prototype.isDisabled = function( ) 	{ return this.disabled; }
nlobjField.prototype.isHidden = function( ) 	{ return this.hidden; }
nlobjField.prototype.isPopup = function( ) 		{ return this.popup; }
nlobjField.prototype.isDisplay = function( ) 	{ return this.display; }
nlobjField.prototype.isVisible = function( )    { return this.visible; }
nlobjField.prototype.isReadOnly = function( ) 	{ return this.readonly; }

nlobjField.DISPLAY_TYPE =
{
    INLINE: 'inline', //not yet supported, throws SSS_NOT_YET_SUPPORTED
    HIDDEN: 'hidden',
    READ_ONLY: 'readonly', //only works for text area or rich text (different from server, where only text area works)
    ENTRY: 'entry',   //does not override Display Type : "Disabled" or "Hidden" UI setting
    DISABLED: 'disabled',
    NORMAL: 'normal'  //does override Display Type : "Disabled" or "Hidden" UI setting
};

nlobjField.prototype.setDisplayType = function (displayType)
{
    nsapiCheckArgs([displayType], ['displayType'], 'nlobjField.setDisplayType');
    console.log('setDisplayType: '+displayType);

    switch (displayType.toLowerCase())
    {
        case nlobjField.DISPLAY_TYPE.INLINE:
            throw nlapiCreateError('SS_NOT_YET_SUPPORTED');
            break;

        case nlobjField.DISPLAY_TYPE.HIDDEN:
            if (this.readonly)
                showInlineField.apply(this, [false]);
            else
                nlapiSetFieldDisplay(this.name, false);

            this.hidden = true;
            this.visible = false;
            this.display = false;
            break;

        case nlobjField.DISPLAY_TYPE.READ_ONLY:
            if (!this.type || this.type !== "textarea")
                return;
            nlapiDisableField(this.name, true);
            this.disabled = true;
            break;

        case nlobjField.DISPLAY_TYPE.ENTRY:
            if (this.hidden || this.disabled)
                return;

            nlapiDisableField(this.name, false);
            nlapiSetFieldDisplay(this.name, true);

            this.hidden = false;
            this.visible = true;
            this.display = true;
            this.disabled = false;
            break;

        case nlobjField.DISPLAY_TYPE.DISABLED:
            nlapiDisableField(this.name, true);
            this.disabled = true;
            break;

        case nlobjField.DISPLAY_TYPE.NORMAL:
            nlapiDisableField(this.name, false);
            nlapiSetFieldDisplay(this.name, true);

            this.hidden = false;
            this.visible = true;
            this.display = true;
            this.disabled = false;
            break;

        default:
            break;
    }

}

nlobjField.prototype.setLabel = function( required ) { throw nlapiCreateError('SSS_NOT_YET_SUPPORTED'); }
nlobjField.prototype.setAlias = function( required ) { throw nlapiCreateError('SSS_NOT_YET_SUPPORTED'); }
nlobjField.prototype.setDefaultValue = function( required ) { throw nlapiCreateError('SSS_NOT_YET_SUPPORTED'); }
nlobjField.prototype.setDisabled = function( disabled ) { throw nlapiCreateError('SSS_NOT_YET_SUPPORTED'); }
nlobjField.prototype.setMandatory = function( disabled ) { throw nlapiCreateError('SSS_NOT_YET_SUPPORTED'); }
nlobjField.prototype.setMaxLength = function( disabled ) { throw nlapiCreateError('SSS_NOT_YET_SUPPORTED'); }
nlobjField.prototype.setLayoutType = function( disabled ) { throw nlapiCreateError('SSS_NOT_YET_SUPPORTED'); }
nlobjField.prototype.setLinkText = function( disabled ) { throw nlapiCreateError('SSS_NOT_YET_SUPPORTED'); }
nlobjField.prototype.setHelpText = function( text ) { throw nlapiCreateError('SSS_NOT_YET_SUPPORTED'); }
nlobjField.prototype.setDisplaySize = function( disabled ) { throw nlapiCreateError('SSS_NOT_YET_SUPPORTED'); }
nlobjField.prototype.setPadding = function( disabled ) { throw nlapiCreateError('SSS_NOT_YET_SUPPORTED'); }
nlobjField.prototype.addSelectOption = function( disabled ) { throw nlapiCreateError('SSS_NOT_YET_SUPPORTED'); }
nlobjField.prototype.getSelectOptions = function( token ) { throw nlapiCreateError('SSS_NOT_YET_SUPPORTED'); }

/*--------------- nlobjSubList definition (readonly for now). Currently implemented as snapshot. Make dynamic for 2010.1 ------------*/
function nlobjSubList( name )
{
    this.name = name;
    var thisType;
    if (isEditMachine(name))
    {
        thisType = eval( String(name) + '_machine').isinline ? "inlineeditor" : "editor";
    }
    else
    {
        thisType = getFormElement(document.forms['main_form'], name+"matrixfields" ) != null ? "matrix" : "list"
    }
    this.type = thisType;
    this.label = null;
    this.hidden = false;
    this.display = true;
}
nlobjSubList.prototype.getName = function( ) { return this.name; }
nlobjSubList.prototype.getType = function( ) { return this.type; }
nlobjSubList.prototype.getLabel = function( ) 	{ return this.label; }
nlobjSubList.prototype.isHidden = function( ) 	{ return this.hidden; }
nlobjSubList.prototype.isDisplay = function( ) 	{ return this.display; }
nlobjSubList.prototype.isChanged = function( ) 	{ return wasMachineChanged(this.name); }
nlobjSubList.prototype.setLabel = function( label ) { throw nlapiCreateError('SSS_NOT_YET_SUPPORTED'); }
nlobjSubList.prototype.setHelpText = function( help ) { throw nlapiCreateError('SSS_NOT_YET_SUPPORTED'); }
nlobjSubList.prototype.setDisplayType = function( type ) { throw nlapiCreateError('SSS_NOT_YET_SUPPORTED'); }
nlobjSubList.prototype.setLineItemValue = function( field, line, value ) { throw nlapiCreateError('SSS_NOT_YET_SUPPORTED'); }
nlobjSubList.prototype.setLineItemMatrixValue = function( field, line, column, value ) { throw nlapiCreateError('SSS_NOT_YET_SUPPORTED'); }
nlobjSubList.prototype.setLineItemValues = function( values ) { throw nlapiCreateError('SSS_NOT_YET_SUPPORTED'); }
nlobjSubList.prototype.getField = function( name ) { throw nlapiCreateError('SSS_NOT_YET_SUPPORTED'); }
nlobjSubList.prototype.getAllFields = function( ) { throw nlapiCreateError('SSS_NOT_YET_SUPPORTED'); }
nlobjSubList.prototype.getAllHeaderFields = function( ) { throw nlapiCreateError('SSS_NOT_YET_SUPPORTED'); }
nlobjSubList.prototype.addField = function( name,type,label,source,group ) { throw nlapiCreateError('SSS_NOT_YET_SUPPORTED'); }
nlobjSubList.prototype.addHeaderField = function( name,type,label,source ) { throw nlapiCreateError('SSS_NOT_YET_SUPPORTED'); }
nlobjSubList.prototype.setAmountField = function( fldnam ) { throw nlapiCreateError('SSS_NOT_YET_SUPPORTED'); }
nlobjSubList.prototype.setUniqueField = function( fldnam ) { throw nlapiCreateError('SSS_NOT_YET_SUPPORTED'); }
nlobjSubList.prototype.getMatrixCount = function( field ) { throw nlapiCreateError('SSS_NOT_YET_SUPPORTED'); }
nlobjSubList.prototype.addButton = function( name, label, script ) { throw nlapiCreateError('SSS_NOT_YET_SUPPORTED'); }
nlobjSubList.prototype.getButton = function( name ) { throw nlapiCreateError('SSS_NOT_YET_SUPPORTED'); }
nlobjSubList.prototype.addRefreshButton = function( ) { throw nlapiCreateError('SSS_NOT_YET_SUPPORTED'); }
nlobjSubList.prototype.addMarkAllButtons = function( ) { throw nlapiCreateError('SSS_NOT_YET_SUPPORTED'); }

/*--------------------------------------------------------------------------------------- */
/*--------------------------------------------------------------------------------------- */
/* ------------- Internal Helper functions for Client SuiteScript API.  ----------------- */
/*--------------------------------------------------------------------------------------- */
/*--------------------------------------------------------------------------------------- */
function nsapiButtonCall(trigger, scriptid, func, args)
{
    return nsapiCallUserScript(trigger, scriptid, func, args)
}
function nsapiCallUserScript(trigger, scriptid, func, args)
{
    var isInternal = nsapiIsInternal();
    try
    {
        nsapiSetIsInternal(false);
        if(nlapiGetContext().usage)
            nlapiGetContext().usage[scriptid] = 0;   //reset it back to 0 when a client script is invoke again.
        return nsapiCallScript(trigger, scriptid, func, args)
    }
    finally
    {
        nsapiUpdateMachines();
        nsapiSetIsInternal(isInternal);
    }
}
function nsapiCallScript(trigger, scriptid, func, args)
{
	var origScriptId = window.NLScriptId;
    window.NLScriptId = scriptid;
	if (typeof(nlapi) !== 'undefined' && nlapi && nlapi.async) nlapi.async.prepareForAsync({id: scriptid, trigger: trigger, args: args});
	try {
		if (isValEmpty(func))
			return true;

		var argstr = "";
		if (typeof(func) != "function" && (typeof(func) != "string" || func.indexOf("(") == -1)) {
			for (var i = 0; args != null && i < args.length; i++)
				argstr += (i > 0 ? ", " : "") + (args[i] == null || typeof(args[i]) == "undefined" ? "null" : typeof(args[i]) != "string" ? args[i] : "'" + args[i] + "'");
		}
		if (nlapiGetContext().isInternal()) {
			if (typeof(func) == "function")
				return func();
			else if (typeof(func) == "string" && func.indexOf("(") > 0)
				return eval(func);
			else
				return eval(func + "(" + argstr + ")");
		}
		else {
			try {
				if (typeof(func) == "function")
					return func();
				else if (typeof(func) == "string" && func.indexOf("(") > 0)
					return eval(func);
				else
					return eval(func + "(" + argstr + ")");
			}
			catch (e) {
				var fn = typeof(func) == "function" ? getFuncName(func) : func.indexOf("(") > 0 ? func.substring(0, func.indexOf("(")) : func;
				var id = e.getCode != null && typeof(e.getCode) == "function" ? e.getId() : null;
				var code = e.getCode != null && typeof(e.getCode) == "function" ? e.getCode() : typeof(e) == "string" ? new String(e) : typeof(e) == "object" && e.name && e.message ? "JS_EXCEPTION" : "UNEXPECTED_ERROR";
				if (code == "UNEXPECTED_ERROR" && id != null)
					code += " (id=" + id + ")";
				var msg = e.getDetails != null && typeof(e.getDetails) == "function" ? emptyIfNull(e.getDetails()) : typeof(e) == "string" ? "" : typeof(e) == "object" && e.name && e.message ? e.name + ' ' + e.message : e.toString()
				var suppressnotification = e.getCode != null && typeof(e.getCode) == "function" && e.suppressnotification === true;
				var supportsLogging = scriptid != "customform";
				alert(window.nsScriptErrorMsg + '\n\n' + fn + ' (' + trigger + ')\n' + scriptid + '' + (isValEmpty(nlapiGetContext()
						.getBundleId()) ? '' : ' (' + nlapiGetContext().getBundleId() + ')') + '\n\n' + "" + code + '\n' + msg)
				if (supportsLogging)
					nsServerCall(nsJSONProxyURL, "logError", [code, msg, id, fn, scriptid, suppressnotification, nlapiGetRecordType(), nlapiGetRecordId()]);
				throw e;
			}
		}
	}
	finally
	{
		if (typeof(nlapi) !== 'undefined' && nlapi && nlapi.async) nlapi.async.unloadAsync();
		window.NLScriptId = origScriptId;
	}
}
function nsapiIsInternal( )
{
    return nlapiGetContext().internal;
}
function nsapiSetIsInternal( x )
{
    nlapiGetContext().internal = x;
}

/**
 * @deprecated
 *
 * Function retained for backwards compatibility with SS 1.0.
 This code uses deprecated browser features (Function.prototype.caller and Function.prototype.callee) which do not function properly.
 If a common function is called from two separate caller functions in the same call stack, then the for loop below will enter an
 infinite loop and lock up the browser!
 *
 */
function nsapiQueryScript(arg) {
	var c = 0;
	var scriptId = !!window ? window.NLScriptId : null;
	var functionName;
	for (var a = arguments.callee.caller; a != null && a.caller != a; a = a.caller) {
		//Circuit breaker to avoid infinite loop
		if (c === 50) {
			nsServerCall(nsJSONProxyURL, 'logErrorDbAudit', ['Client SuiteScript - Infinite loop detected in nsapiQueryScript: ' +
			' [arg0] - ' + arg, '[Client Side Stack Trace] - ' + (Error().stack)], null, 'GET');
			return null;
		}

		functionName = getFuncName(a);
		// 1.0 script runner path
		if (functionName.indexOf("nsapiCallScript") >= 0 && a.arguments.length >= 3) {
			return a.arguments[arg == "trigger" ? 0 : 1];
		}
		// 2.0 script runner path or called from N/invoker
		if (["runClientScript", "makeAsyncCall", "invokeOn"].indexOf(functionName) >= 0) {
			return scriptId;
		}

		c++;
	}

	var stackLines = (Error().stack || '').split('\n');
	if (stackLines[stackLines.length - 1].indexOf("runScript") >= 0) {
		return scriptId;
	}

	return arg == "scriptid" ? "global" : null;
}

function nsapiFireOnChange(fld, firefieldchanged, strictFirefieldchanged)
{
    var fire = !!strictFirefieldchanged && firefieldchanged ||
            !strictFirefieldchanged && !(nsapiIsInternal() && firefieldchanged == false);
    if (fire)	/* bail if author requested fieldchange to not fire */
    {
        var fcFunc = '';
        var checkValid = fld.checkvalid;
        var isInternal = nsapiIsInternal();
        if (firefieldchanged == false && document.forms['main_form'].elements.nlapiFC != null)/* suppress user fieldchange if requested */
        {
            fcFunc = document.forms['main_form'].elements.nlapiFC.value;
            document.forms['main_form'].elements.nlapiFC.value = '';
        }
        try
        {
            fld.checkvalid = true;
            nsapiSetIsInternal(true);
            fireProperOnChange(fld);
        }
        finally
        {
            if (fcFunc.length > 0)
                document.forms['main_form'].elements.nlapiFC.value = fcFunc;
            fld.checkvalid = checkValid;
            nsapiSetIsInternal(isInternal)
        }
    }

    NS.event.dispatch(NS.event.type.FIELD_CHANGED, { field: fld });
}

var nsUpdatedMachines = new Object();	/* track updated line items */
function nsapiUpdateMachines()
{
    for( var s in nsUpdatedMachines )
    {
        if(nsUpdatedMachines.hasOwnProperty(s))
        {
            var mch = eval(String(s) + '_machine');
            if (mch != null)
                mch.buildtable();
        }
    }
    nsUpdatedMachines = new Object();
}
var nsDisabledFields = new Object();	/* track disabled main form fields */
/* ------------- Helper functions for managing access to tasklinks and recordtype metadata ------------ */
var nsTasklinks;
var nsRecordTypes;
var nsStandaloneSearchTypes;
function nsapiGetTaskLink( id )
{
    if ( nsTasklinks == null )
    {
        nsTasklinks = nsServerCall(nsJSONProxyURL, "getTaskLinks");
    }
    return nsTasklinks[ id ];
}
function nsapiInitRecords()
{
    if ( nsRecordTypes == null )
    {
        nsRecordTypes = nsServerCall(nsJSONProxyURL, "getRecordTypes");
    }
}
function nsapiGetRecord(type)
{
    nsapiCheckArgs( [type], ['type'], 'nsapiGetRecord' );
    nsapiInitRecords();
    return nsRecordTypes[ type.toLowerCase() ];
}
function isStandaloneSearchType(type)
{
    if (!nsStandaloneSearchTypes)
	    nsStandaloneSearchTypes = nsServerCall(nsJSONProxyURL, "getStandaloneSearchTypes");

    return nsStandaloneSearchTypes && nsStandaloneSearchTypes.indexOf(type.toLowerCase()) >= 0;
}
function nsapiGetRecordURL(type, id)
{
    nsapiInitRecords();
    var recordType = nsapiGetRecord(type);
    if (recordType != null)
    {
        var url = recordType.url;
        var params = recordType.urlparams;
        if (params != null && params.indexOf(',') != -1)
            params = params.replace(',', '&')
        if (!isValEmpty( id ))
            url = addParamToURL( url, 'id', id )
        if ((isValEmpty(id) || recordType.type == 'OTHER') && params != null && url.indexOf(params) == -1)
            url = addNextParamPrefixToURL( url ) + params;
        return url;
    }
    else
        return null;
}
function nsapiModifyLoadArg(param)
{
    if (param == "customform")
        param = "cf"
    return param;
}

var nsUsageCosts = null;
function nsapiCheckUsage( )
{
    if ( nsUsageCosts == null )
    {
        nsUsageCosts = nsServerCall(nsJSONProxyURL, 'getUsageUnits');
    }
    if ( nlapiGetContext().getRemainingUsage() < 0 )
        throw new nlapiCreateError( 'SCRIPT_EXECUTION_USAGE_LIMIT_EXCEEDED', 'Script Execution Usage Limit Exceeded' );
}
function nsapiLogUsage( func, type )
{
    nlapiGetContext().setUsage(func, type);
}
function nsapiCheckType( type, funcName, bStrictValidation )
{
    var typeObj = nsapiGetRecord(type);
    if ( typeObj == null || (bStrictValidation && typeObj.scriptable == false) )
        throw nlapiCreateError( 'SSS_INVALID_RECORD_TYPE', (funcName != null ? funcName+': ' : '')  +'type argument '+type+' is not a valid record or is not available in your account. Please see the documentation for a list of supported record types.' );
    return true;
}
function nsapiCheckSearchType( type, funcName )
{
    if ( !nsapiGetRecord(type) && !isStandaloneSearchType(type) )
        throw nlapiCreateError( 'SSS_INVALID_RECORD_TYPE', (funcName != null ? funcName+': ' : '')  +'type argument '+type+' is not a valid record or standalone search type or is not available in your account. Please see the documentation for a list of supported record types.' );
    return true;
}
function nsapiCheckArray(arrayObj, name, objType)
{
    if (!isArray(arrayObj))
        return;
    for (var i = 0; i < arrayObj.length; i++)
    {
        //element is not empty
        nsapiAssertTrue((arrayObj[i] || arrayObj[i] === 0));
        nsapiAssertTrue(
                //objType is an Object and element was created by objType; assumes objType is some constructor function
                (objType === Object(objType) && arrayObj[i] instanceof objType)
                    //or the primitive type is the same ('string', 'number' etc); assumes objType is the name of some primitive type as a string
                        || typeof arrayObj[i] === objType
                    //or the element's constructor name is not empty and matches objType; assumes objType is the name of some constructor function or native Java type as a string
                        || (arrayObj[i].constructor && arrayObj[i].constructor.name && arrayObj[i].constructor.name === objType)
                    //or the element.toString() matches objType; Rhino-specific case
                        || arrayObj[i].toString() === objType,
                'SSS_INVALID_ARRAY_ARGUMENT', name + '[' + i + ']');
    }
}
function nsapiResolveField(type, fldnam, linenum, column)
{
    var fld = null;
    if ( column == null )
    {
        if ( type == null )
        {
            var form = typeof(ftabs) != 'undefined' && ftabs[getFieldName(fldnam)] != null ? document.forms[ftabs[getFieldName(fldnam)]+'_form'] : document.forms['main_form'];
            fld = form.elements[ fldnam ];
            if ( fld == null )
                fld = getFormElement( form, getFieldName(fldnam)+"_send" );
        }
        else
        {
            var form = document.forms[type+'_form'];
            fld = form.elements[ isEditMachine(type) ? fldnam : fldnam+linenum ];
        }
    }
    else
        fld = linenum != null ? getMatrixField(type, fldnam, linenum, column) : getMatrixHeaderField(type, fldnam, column);
    return fld;
}
function nsapiIsLookup(filters)
{
    return filters != null && filters.length == 1 && nsapiIsSearchFilterObject(filters[0]) && filters[0].getName().toLowerCase() == "internalid"
                   && filters[0].getOperator().toLowerCase() == "anyof"
                   && filters[0].getSummaryType() == null
            && filters[0].getFormula() == null;
}
/* ------------ Helper function used for unmarshalling search results from server. ----------------*/
function nsapiExtractSearchResults(rawResults, columns)
{
    var rowResults = [];
    var columnArray = nsapiColumnsAsArray(columns);
    if ( rawResults != null )
    {
        for ( var i = 0; rawResults.columns != null && i < rawResults.columns.length; i++ )
        {
            var obj = null;
            var col = rawResults.columns[i];
            if ( col.userindex == -1 )
            {
                obj = nsapiUnmarshalSearchColumn(col);
            }
            else if (columnArray != null)
            {
                obj = columnArray[col.userindex-1];
            }
            obj.index = col.index;
            obj.type = col.type;
            rawResults.columns[i] = obj;
        }

        for ( var i = 0; i < rawResults.rows.length; i++ )
        {
            rowResults[rowResults.length] = new nlobjSearchResult( rawResults.rows[i].recordType, rawResults.rows[i].id, rawResults.rows[i].cells, rawResults.columns )
        }
    }
    return rowResults.length == 0 ? null : rowResults;
}

/* ------------- Helper function(s) for Serializing <record></record> Element to an nlobjRecord ----------------*/
function nsapiExtractRecord( nsrecord )
{
    var sKey = nsSelectValue( nsrecord, "@id" );
    var sType = nsSelectValue( nsrecord, "@recordType" );

    var record = new nlobjRecord( sType, sKey );
    record.fieldnames = nsSelectValue( nsrecord, "@fields" ).split(",")
    var nsfields = nsSelectNodes( nsrecord, "*" );
    nsapiExtractFields( record, nsfields);

    var nsmachines = nsSelectNodes( nsrecord, "machine" );
    for ( var m = 0; nsmachines != null && m < nsmachines.length; m++ )
    {
        var nsmachine = nsmachines[ m ];
        var machineName = nsmachine.getAttribute('name');
        var nslines = nsSelectNodes( nsmachine, "line" );
        record.linetypes[machineName] = nsmachine.getAttribute('type');
        record.linefields[machineName] = nsmachine.getAttribute('fields').split(',');
        if ( nsmachine.getAttribute('matrixfields') != null )
            record.matrixfields[machineName] = nsmachine.getAttribute('matrixfields').split(',');
        for ( var line = 0; nslines != null && line < nslines.length; line++ )
        {
            var nsline = nslines[ line ];
            var nslinefields = nsSelectNodes( nsline, "*" );
            nsapiExtractFields( record, nslinefields, machineName, line+1);
        }
    }
    record.initialized = true;
    return record;
}
function nsapiExtractFields( record, fields, machine, linenum )
{
    var buffer = new Array();
    for (var i = 0; fields != null && i < fields.length; i++)
    {
        var field = fields[ i ];
        var fieldName = field.nodeName;
        if ( fieldName == "machine" && field.getAttribute('type') != null )	/* skip over machine nodes. */
            continue
        var fieldValue = nsGetXMLValue( field );
        var fieldValues = buffer[ fieldName ] != null ? buffer[ fieldName ] : new Array();

        fieldValues[ fieldValues.length ] = fieldValue;
        buffer[ fieldName ] = fieldValues;
        eval( machine != null ? 'record.setAndCommitLineItemValue( machine, fieldName, linenum, fieldValues.length == 1 ? fieldValues[0] : fieldValues )' : 'record.setFieldValue( fieldName, fieldValues.length == 1 ? fieldValues[0] : fieldValues )');
    }
}
/* ------------- Helper function(s) for Serializing nlobjRecord into an <record><record> Document ----------------*/
function nsapiSerializeRecord( record )
{
    var nsrecord = nsStringToXML("<record></record>");
    nsrecord.documentElement.setAttribute('recordType', record.getRecordType() );
    if ( record.getId() != null )
        nsrecord.documentElement.setAttribute('id', record.getId() );
    var operations = nsSetChildValue( nsrecord.documentElement, "operations" );
    nsapiSerializeOperation( record.operations[0], operations, "load" );
    for ( var i = 1; i < record.operations.length; i++ )
    {
        nsapiSerializeOperation( record.operations[i], operations, "data" );
    }
    return nsrecord;
}
function nsapiSerializeOperation( jsOperation, operationsNode, type )
{
    var operation = nsSetChildValue( operationsNode, "operation" );
    operation.setAttribute("type", type)
    operation.setAttribute("name", jsOperation.operation)

    for (var arg in jsOperation.args)
    {
        if(!jsOperation.args.hasOwnProperty(arg))
            continue;
        if ( isArray( jsOperation.args[arg] ) )
        {
            for ( var i = 0; i < jsOperation.args[arg].length; i++ )
            {
                nsSetChildValue( operation, arg, jsOperation.args[arg][i] );
            }
        }
        else if ( typeof jsOperation.args[arg] == "object" )
        {
            var argNode = nsSetChildValue( operation, arg );
            for (var entry in jsOperation.args[arg])
            {
                if(jsOperation.args[arg].hasOwnProperty(entry))
                    nsSetChildValue( argNode, entry, jsOperation.args[arg][entry] );
            }
        }
        else
        {
            nsSetChildValue( operation, arg, jsOperation.args[arg] );
        }
    }
}
var nsProxyURL = '/app/common/scripting/nlapihandler.nl';
var nsJSONProxyURL = '/app/common/scripting/nlapijsonhandler.nl';
/* ----- internal function for handling AJAX server call for issuing nlapiRequestURL calls (nsapiPrefix is defined in NLAPI.jsp) -----*/
function nsapiAjaxResponse( response, callbackFunc )
{
    var error = response.getError();
    if ( error != null )
    {
        error = nlapiCreateError(error);
        if ( callbackFunc == null )
            throw error;
    }

    var code = response.getCode();
    var body = response.getBody();
    var headers = response.getHeaders();
    var nlheaders = [];
    if ( headers[nsHeaderPrefix+'-Code'] != null )  /* handle proxyed requests */
    {
        code = headers[nsHeaderPrefix+'-Code'];
        for ( var header in headers )
            if(headers.hasOwnProperty(header))
                if ( header.indexOf( nsHeaderPrefix ) == 0 )
                    nlheaders[header.substring( nsHeaderPrefix.length+1 )] = headers[header];
    }
    else
        nlheaders = headers;

    var response = new nlobjServerResponse( code, body, nlheaders, error );
    if ( typeof(callbackFunc) == "function" )
        callbackFunc( response );
    return response;
}
function nsapiCheckArgs( funcArgs, funcArgNames, funcName )
{
    for ( var i = 0; i < funcArgs.length; i++ )
    {
        if ( funcArgs[ i ] == null || (typeof funcArgs[ i ] == "string" && isValEmpty(funcArgs[ i ])) )
        {
            throw nlapiCreateError( 'SSS_MISSING_REQD_ARGUMENT', (funcName != null ? funcName+': ' : '')  +'Missing a required argument: '+funcArgNames[ i ] );
        }
    }
}
function nsapiAssertTrue( expression, errorCode, errorMessage )
{
    if ( !expression )
    {
        throw nlapiCreateError( errorCode, errorMessage );
    }
}
function nsapiExtractMap(obj)
{
    if ( obj == null ) return null;
    var map = new Object();
    for ( var attr in obj )
        if(obj.hasOwnProperty(attr))
            map[attr] = obj[attr]
    return map;
}
/* ----- internal function for handling machine segmenting -----*/
function nsapiGetCurrentSegment(type)
{
    var sel = null;
    if (document.forms[type+'_main_form'] != null)
        sel = document.forms[type+'_main_form'].elements[type+'range'];
    return sel != null ? parseInt(getSelectValue(sel)) : 1;
}

function nsapiGetSegmentForLine(type, linenum)
{
    var segmentSize = null;
    if (document.forms[type+'_main_form'] != null)
        segmentSize = document.forms[type+'_main_form'].elements[type+'segmentsize'];
    return segmentSize != null ? Math.floor((linenum-1)/parseInt(segmentSize.value)) : 1;
}

function nsapiSelectSegmentForLine(type, linenum)
{
    var sel = null;
    if (document.forms[type+'_main_form'] != null)
        sel = document.forms[type+'_main_form'].elements[type+'range'];
    if (sel != null)
    {
        var currentSegment = nsapiGetCurrentSegment(type);
        var targetSegment = nsapiGetSegmentForLine(type, linenum);
        if (currentSegment != targetSegment)
        {
            setSelectValue(sel, targetSegment);
            eval("Sync" + type + "range(true);");
        }
    }
}

function process_slaving_result(response)
{
    var isInternal = nsapiIsInternal();
    try
    {
        nsapiSetIsInternal(true)
        process_slaving_result_original(response);
    }
    finally
    {
        nsapiSetIsInternal(isInternal)
    }
}

function nlapiShowSaveConfirmation(sUrl)
{
    if (NS.form.isChanged() && window.bautosave)
    {
        if (window.bautosave == 'F') // Will move the title to translation once UE comes up with the language.
            nlShowSaveConf('You have made changes to this page. Would you like to save before continuing?', 'Information', null,sUrl);
        else {
            if ((!document.forms['main_form'].onsubmit || document.forms['main_form'].onsubmit()))    {
                var theForm = document.forms["main_form"];
                var newOption = document.createElement("input");
                newOption.id = "setclientredirecturl";
                newOption.name = "setclientredirecturl";
                newOption.type = "hidden";
                newOption.value = sUrl;
                theForm.appendChild(newOption);
                document.forms['main_form'].submit();
            }
        }
        return true;
    }
    else
        return false;
}

function nlapiGetLineItemLabel(type, fldnam)
{
    nsapiCheckArgs( [type, fldnam], ['type', 'fldnam'], 'nlapiGetLineItemLabel' );
    if ( hasMachine(type) )
    {
        var mch = eval( String(type) + '_machine');
        return mch.getFormElementLabel(mch.getArrayPosition(fldnam));
    }
    else
    {
        // implement me for list machines using splitIntoCells( document.forms['main_form'].elements[type+"labels"].value )
    }
    return null;
}


function nlapiViewCurrentLineItemSubrecord(machinename, fldname)
{
    nsapiAssertTrue(isSubrecordField(machinename, fldname),  'SSS_INVALID_FIELD_ON_SUBRECORD_OPERATION');
    var linenum = nlapiGetCurrentLineItemIndex(machinename);
    return nlapiViewLineItemSubrecord(machinename, fldname, linenum);
}

function nlapiViewLineItemSubrecord(machinename, fldname, linenum)
{
    nsapiAssertTrue(isSubrecordField(machinename, fldname),  'SSS_INVALID_FIELD_ON_SUBRECORD_OPERATION');
    var subrecord = NLGetSubRecord(machinename, fldname, linenum);
    return subrecord;
}

function nlapiRemoveCurrentLineItemSubrecord(machinename, fldname)
{
    nsapiAssertTrue(isSubrecordField(machinename, fldname),  'SSS_INVALID_FIELD_ON_SUBRECORD_OPERATION');
    var linenum = nlapiGetCurrentLineItemIndex(machinename);
    var subrecord = NLGetSubRecord(machinename, fldname, linenum);
    if (subrecord)
        subrecord.remove();
}

function nlapiViewSubrecord(fldname)
{
    nsapiAssertTrue(isSubrecordField(null, fldname),  'SSS_INVALID_FIELD_ON_SUBRECORD_OPERATION');
    var subrecord = NLGetSubRecord(null, fldname, 1);  //for body field, there is only one subrecord row, so will be in the first row.
    return subrecord;
}

function nlapiRemoveSubrecord(fldname)
{
    nsapiAssertTrue(isSubrecordField(null, fldname),  'SSS_INVALID_FIELD_ON_SUBRECORD_OPERATION');
    var subrecord = NLGetSubRecord(null, fldname, 1); //for body field, there is only one subrecord, so will be in the first row.
    if (subrecord)
        subrecord.remove();
}

function isSubrecordField(machinename, fldname)
{
    if (typeof(NLGetUIForm) != 'function' || typeof(NLGetBusinessObject) != 'function')
    {
        return false;
    }

    try
    {
        if(isValEmpty(machinename))
        {
            var recordManager= NLGetUIForm() == null ? null : NLGetUIForm().recordManager;
            if(recordManager!=null && recordManager.getField(fldname)!=null)
                return recordManager.getField(fldname)['type'] == "summary";
        }
        else
        {
            var recordManager=NLGetBusinessObject() == null ? null : NLGetBusinessObject().getRecordManager(machinename);
            if(recordManager !=null && recordManager.getField(fldname)!=null)
                return recordManager.getField(fldname)['type'] == 'summary';
        }
    }catch(e)
    {
        return false;
    }
    return false;
}

function getFieldName(fldname)
{
    if ( fldname == 'type' )  return fldname;
    var type = nlapiGetFieldValue('type');
    if (type == 'userpreferences' || type == 'setupcompany' || type == 'acctsetup' || type == 'duplicatedetectsetup')
        return  fldname;
    else
        return  fldname.toLowerCase();
}

function clientScriptErrorDebug(msg)
{
    var stacktraceInfo = stacktrace();
    var url = '/core/pages/logJavascriptError.nl?';
    var request = new NLXMLHttpRequest();
    var payload =  'winHref=' + encodeURIComponent(window.location.href);
    payload = payload + '&mesg=' + encodeURIComponent('NLAPI Error ' +msg);
    payload = payload + "&stcktrc="+encodeURIComponent(stacktraceInfo);
    var response = request.requestURL( url+payload, payload )
}

function nlapiCalculateTax()
{
    if (typeof TaxCalculationEngine === 'undefined')
        throw nlapiCreateError('SSS_UNSUPPORTED_METHOD', 'Unsupported method');

    try
    {
        var taxEngine = TaxCalculationEngine.getInstance();
        taxEngine.calculateTax();
    }
    catch (e)
    {
        if (e.code === 'TAX_REGISTRATION_DETERMINATION_WAS_NOT_SUCCESSFUL_PLEASE_MAKE_SURE_YOUR_NEXUSES_AND_TAX_REGISTRATIONS_ARE_SET_UP_CORRECTLY')
            throw nlapiCreateError('SSS_TAX_REGISTRATION_REQUIRED', 'Tax registration required. Please ensure all nexuses and tax registrations are set up correctly.');
        throw nlapiCreateError(e);
    }
}
/*--------------- Client Internal SuiteScript Implementation ------------*/

/*--------------- Subrecord API implementations ------------*/

function nlapiCreateCurrentLineItemSubrecord(machinename, fldname)
{
    nsapiAssertTrue(isSubrecordField(machinename, fldname),  'SSS_INVALID_FIELD_ON_SUBRECORD_OPERATION');
    var linenum = nlapiGetCurrentLineItemIndex(machinename);
    var subrecord = NLCreateSubRecord(machinename, fldname, linenum);
    return subrecord;
}

function nlapiEditCurrentLineItemSubrecord(machinename, fldname)
{
    nsapiAssertTrue(isSubrecordField(machinename, fldname),  'SSS_INVALID_FIELD_ON_SUBRECORD_OPERATION');
    var linenum = nlapiGetCurrentLineItemIndex(machinename);
    var subrecord = NLEditSubRecord(machinename, fldname, linenum);
    return subrecord;
}

function nlapiLoadCurrentLineItemSubrecord(machinename, fldname, forceCreate)
{
    var subrecord = nlapiEditCurrentLineItemSubrecord( machinename, fldname );
    if (!subrecord && forceCreate)
    {
        subrecord = nlapiCreateCurrentLineItemSubrecord( machinename, fldname );
    }
    return subrecord;
}

function nlapiEditSubrecord(fldname)
{
    nsapiAssertTrue(isSubrecordField(null, fldname),  'SSS_INVALID_FIELD_ON_SUBRECORD_OPERATION');
    var subrecord = NLEditSubRecord(null, fldname, 1);  //for body field, there is only one subrecord row, so will be in the first row.
    return subrecord;
}

function nlapiCreateSubrecord(fldname)
{
    nsapiAssertTrue(isSubrecordField(null, fldname),  'SSS_INVALID_FIELD_ON_SUBRECORD_OPERATION');
    var subrecord = NLCreateSubRecord(null, fldname, 1);  //for body field, there is only one subrecord row, so will be in the first row.
    return subrecord;
}

function nlapiLoadSubrecord(fldname)
{
    var subrecord = nlapiEditSubrecord( fldname );
    if (!subrecord)
    {
        subrecord = nlapiCreateSubrecord( fldname );
    }
    return subrecord;
}

// TODO: this API will be removed
function nlapiEditLineItemSubrecord(machinename, fldname, linenum)
{
    nsapiAssertTrue(false,  'SSS_INVALID_FIELD_ON_SUBRECORD_OPERATION');
    nsapiAssertTrue(isSubrecordField(machinename, fldname),  'SSS_INVALID_FIELD_ON_SUBRECORD_OPERATION');
    var subrecord = NLEditSubRecord(machinename, fldname, linenum);
    return subrecord;
}

// TODO: this API will be removed
function nlapiCreateLineItemSubrecord(machinename, fldname, linenum)
{
    nsapiAssertTrue(false,  'SSS_INVALID_FIELD_ON_SUBRECORD_OPERATION');
    nsapiAssertTrue(isSubrecordField(machinename, fldname),  'SSS_INVALID_FIELD_ON_SUBRECORD_OPERATION');
    var subrecord = NLCreateSubRecord(machinename, fldname, linenum);
    return subrecord;
}

// TODO: this API will be removed
function nlapiLoadLineItemSubrecord(machinename, fldname, linenum)
{
    nsapiAssertTrue(false,  'SSS_INVALID_FIELD_ON_SUBRECORD_OPERATION');
    var subrecord = nlapiEditLineItemSubrecord( machinename, fldname, linenum );
    if (!subrecord)
    {
        subrecord = nlapiCreateLineItemSubrecord( machinename, fldname, linenum );
    }
    return subrecord;
}slavingUtil =
function ()
{
	//noinspection JSUnresolvedVariable
	var MULTISELECT = "multiselect";

	var SlavingMetadataKey = {
		QUERY_URL: "queryurl",
		EDIT:"edit",
		DISPLAY_ONLY:"displayonly",
		AUX_FIELDS:"auxfields",
		MULTILINE:"ln",
		MASTER:"master",
		FIELD_OBJECT: {
			NAME:"name",
			MACHINE:"machine",
			HTML_REF:"htmlReference",
			REQUIRED:"required",
			REQUIRED_SCRIPT:"requiredScript",
			IS_REQUIRED:"isRequired"
		}
	};

	var QueryRequst = {
		URL: "url",
		PAYLOAD: "payload"
	};

	var SlaveResultKey ={
		NAME : 'name',
		MACHINE_NAME : 'machine',
		FIRE_FIELDCHANGE : 'firechange',
		IS_CLIENT_SLAVING: 'isClientSlaving',
		OPTIONS : 'options',
		VALUE : 'value',
		TEXT : 'text',
		NO_OVERRIDE : 'nooverride',
		CONDITION : 'condition'
	};

	function RemoteRecordDelegate(recordDelegate)
	{
		var record = recordDelegate.currentRecord;
		var recordUtil = recordDelegate.util;
		/* Helper Function for finding option index */
		function getFieldOptionIndexById(options, id)
		{
			for(var i = 0; i < options.length; i++)
			{
				if(options[i].id == id)
					return i;
			}
			return -1;
		}

		function getFieldOptions() { return recordUtil.getFieldOptions(); }
		function setFieldNoSlaving(fieldInfo, noslaving)
		{
			recordUtil.setFieldNoSlaving(fieldInfo.machineName, fieldInfo.fieldName, fieldInfo.lineNum, noslaving);
		}
		function getValue(params)
		{
			var value = "";
			if(params.isMachineField === true)
			{
				if(params.ln && params.ln !== -1)
				{
					value = record.getLineItemValue(params.machineName, params.fieldName, params.ln);
					value = value === null || value === undefined ? "" : value;
				}
				else
				{
					value = record.getCurrentLineItemValue(params.machineName, params.fieldName);
				}
			}
			else if(params.isMultiSelectField)
				value = record.getFieldValues(params.fieldName);
			else
				value = record.getFieldValue(params.fieldName);

			return value;
		}
		function setValue(params, value, fireFieldChange, isClientSlaving)
		{
			var noslaving = isClientSlaving ? false : true;
			if(params.isMachineField === true)
				record.setCurrentLineItemValue(params.machineName, params.fieldName, value, fireFieldChange, noslaving);
			else if(params.isMultiSelectField)
				record.setFieldValues(params.fieldName, value, fireFieldChange, noslaving);
			else
				record.setFieldValue(params.fieldName, value, fireFieldChange, noslaving);
		}
		function setSelectValue(params, value, text, fireFieldChange)
		{
			if(!value && value !== '')
			{
				if(params.isMachineField === true)
					record.setCurrentLineItemText(params.machineName, params.fieldName, text, fireFieldChange, true);
				else
					record.setText({fieldId: params.fieldName, value: value, fireFieldChange: fireFieldChange, noslaving: true});
			}
			else
				setValue(params, value, fireFieldChange);
		}
		function getFieldOptionFromCache(params)
		{
			if(getFieldOptions() !== null && getFieldOptions().get(params.machineName, params.fieldName, params.lineNum) === null)
				putFieldOptionInCache(params, []);

			return getFieldOptions().get(params.machineName, params.fieldName, params.lineNum);
		}
		function putFieldOptionInCache(params, obj)
		{
			getFieldOptions().put(params.machineName, params.fieldName, params.lineNum, obj);
		}
		function removeOption(params, value)
		{

			var options = getFieldOptionFromCache(params);
			if(options.length > 0)
			{
				if(value || value === 0)
				{
					var idx = getFieldOptionIndexById(options, value);
					options.splice(idx,1);
				}
				else
				{
					options.splice(0, options.length);
				}
			}
		}
		function insertOption(params, value, text)
		{
			var options = getFieldOptionFromCache(params);
			if(options && options instanceof Array)
				options.push({ text:text, id:value });
		}

		this.setFieldNoSlaving = setFieldNoSlaving;
		this.getValue = getValue;
		this.setValue = setValue;
		this.setSelectValue = setSelectValue;
		this.removeOption = removeOption;
		this.insertOption = insertOption;
		this.isEditableSublist = recordUtil.isEditableSublist;
		this.isFieldMultiSelect = recordUtil.isFieldMultiSelect;
		this.returnEmptyIfNull = returnEmptyIfNull;
		this.isValEmpty = isValEmpty;

		this.getCurrentLineItemIndex = function(sublist){ return record.getCurrentSublistIndex({sublistId: sublist});};
		this.triggerPostSourcing = recordUtil.postSourcing;
	}

	function BrowserRecordDelegate()
	{
		function setFieldNoSlaving(fieldInfo, noslaving)
		{
			var field = getFieldObject(fieldInfo);
			if(field)
				field.noslaving = noslaving;
		}
		function getFieldObject(params)
		{
			if(params.isMachineField === true)
				return nlapiGetLineItemField(params.machineName, params.fieldName, params.lineNum);
			else
				return nlapiGetField(params.fieldName);
		}
		function getValue(params)
		{
			var value = "";
			if(params.isMachineField === true)
			{
				if(params.ln)
					value = returnEmptyIfNull(nlapiGetLineItemValue(params.machineName, params.fieldName, params.ln));
				else
					value = nlapiGetCurrentLineItemValue(params.machineName, params.fieldName);
			}
			else if(params.isMultiSelectField)
				value = nlapiGetFieldValues(params.fieldName);
			else
				value = nlapiGetFieldValue(params.fieldName);

			return value;
		}
		function setValue(params, value, fireFieldChange)
		{
			if(params.isMachineField === true)
				nlapiSetCurrentLineItemValue(params.machineName, params.fieldName, value, fireFieldChange, true);
			else if(params.isMultiSelectField)
				nlapiSetFieldValues(params.fieldName, value, fireFieldChange, true);
			else
				nlapiSetFieldValue(params.fieldName, value, fireFieldChange, true);
		}
		function setSelectValue(params, value, text, fireFieldChange)
		{
			if(params.isMachineField === true)
				nlapiSetCurrentLineItemSelectValue(params.machineName, params.fieldName, value, text, fireFieldChange, getSlavingAsync());
			else
				nlapiSetSelectValue(params.fieldName, text, fireFieldChange, getSlavingAsync());
		}
		function insertSelectOption(fieldName, value, text)
		{
			var form = typeof(ftabs) != 'undefined' && ftabs[getFieldName(fieldName)] != null ? document.forms[ftabs[getFieldName(fieldName)]+'_form'] : document.forms[0];
			doInsertSelectOption(form, fieldName, text, value);
		}
		function insertLineItemOption(machineName, fieldName, value, text)
		{
			var form = document.forms[machineName+'_form'];
			doInsertSelectOption(form, fieldName, text, value);
		}
		function doInsertSelectOption(form, fieldName, text, value)
		{
			var fld = getFormElement( form, getFieldName(fieldName) );
			if (fld != null)
				addSelectOption( document, fld, text, value );
		}
		function removeSelectOption(fieldName, value)
		{
			var form = typeof(ftabs) != 'undefined' && ftabs[getFieldName(fieldName)] != null ? document.forms[ftabs[getFieldName(fieldName)]+'_form'] : document.forms[0];
			doRemoveSelectOption(form, fieldName, value);
		}

		function removeLineItemOption(machineName, fieldName, value)
		{
			var form = document.forms[machineName+'_form'];
			doRemoveSelectOption(form, fieldName, value);
		}
		function doRemoveSelectOption(form, fieldName, value)
		{
			var fld = getFormElement( form, getFieldName(fieldName) );
			if (fld != null)
			{
				if(value != null)
					deleteOneSelectOption( fld, value );
				else
					deleteAllSelectOptions( fld, window );
			}
		}
		function removeOption(params, value)
		{
			if(params.isMachineField === true)
				removeLineItemOption(params.machineName, params.fieldName, value);
			else
				removeSelectOption(params.fieldName, value)
		}
		function insertOption(params, value, text)
		{
			if(params.isMachineField === true)
				insertLineItemOption(params.machineName, params.fieldName, value, text);
			else
				insertSelectOption(params.fieldName, value, text)
		}
		function isFieldMultiSelect(sublistId, fieldId, line)
		{
			var field = getFieldObject({isMachineField: !!sublistId, machineName: sublistId, fieldName: fieldId, lineNum: line});
			return field ? field.getType() === MULTISELECT : false;
		}

		this.setFieldNoSlaving = setFieldNoSlaving;
		this.getValue = getValue;
		this.setValue = setValue;
		this.setSelectValue = setSelectValue;
		this.removeOption = removeOption;
		this.insertOption = insertOption;
		this.isEditableSublist = isEditMachine;
		this.isFieldMultiSelect = isFieldMultiSelect;
		this.serverCall = nsServerCall;
		this.returnEmptyIfNull = emptyIfNull;
		this.isValEmpty = isValEmpty;

		this.getCurrentLineItemIndex = nlapiGetCurrentLineItemIndex;
	}

	/**
	 * getQueryRequest - static util function which transform metadata and dynamic recordDelegate context to query request object
	 *
	 * @param metadata - slaving metadata for current field
	 * @param masterInfo - a js object with 'queryFieldName', 'queryFieldValue', 'lineNum', 'fieldspec'
	 * @param recordDelegate - recordDelegate scope for client object. It should be null for Browser
	 * @returns {*}
	 */
	function getQueryRequest(metadata, masterInfo, recordDelegate)
	{
		var IS_EDIT = 'e';
		var RECORD_ID = 'id';
		var QUERY_PARAMETER_NAME = 'q';
		var QUERY_PARAMETER_VALUE = 'si';
		var MACHINE_NAME = 'machine';
		var QUERYREQUEST_SLAVING_FIELD = 'f';
		var LIST_MACHINE_LINE_NUMBER = 'ln';

		var RecordDelegate = (recordDelegate) ? new RemoteRecordDelegate(recordDelegate) : new BrowserRecordDelegate();
		var isBrowserRequest = (recordDelegate) ? false : true;
		var lineNum = masterInfo.hasOwnProperty('lineNum') && masterInfo.lineNum != null ? masterInfo.lineNum : null;
		var sublistName = masterInfo.sublistName;
		var result = cleanupQueryURL(metadata[SlavingMetadataKey.QUERY_URL]);
		var url = result[QueryRequst.URL];
		var payload = result[QueryRequst.PAYLOAD];

		// adding id and edit flag
		if (metadata[SlavingMetadataKey.EDIT] === 'T')
		{
			var id = (recordDelegate ? recordDelegate.currentRecord.id : RecordDelegate.getValue({fieldName: 'id'}));
			if(id || id === 0)
				payload[RECORD_ID] = String(id);
			if (metadata[SlavingMetadataKey.DISPLAY_ONLY] !== 'T')
				payload[IS_EDIT] = 'T';
		}
		// adding q and si
		payload[QUERY_PARAMETER_NAME] = masterInfo['queryFieldName'];
		payload[QUERY_PARAMETER_VALUE] = masterInfo['queryFieldValue'];
		if(sublistName)
			payload[MACHINE_NAME] = sublistName;
		if(masterInfo['fieldspec'].length != 0)
			payload[QUERYREQUEST_SLAVING_FIELD] = masterInfo['fieldspec'];
		// adding ln -- list machine field only
		if (metadata[SlavingMetadataKey.MULTILINE] === 'T' && lineNum > 0 )
			payload[LIST_MACHINE_LINE_NUMBER] = String(lineNum);

		// adding aux fields params
		var valid = addAuxFieldValueToPayloadAndReturnFalseWhenInvalid(isBrowserRequest, metadata, lineNum, payload, RecordDelegate);
		if(!valid)
			return null;
		// adding master of query field
		addMasterValueToPayload(metadata, lineNum, payload, RecordDelegate);

		return { url : url, payload : payload /* all value should be String */};
	}
	/*
	 * Description: helper function to add aux field value to payload for field query request
	 */
	function addAuxFieldValueToPayloadAndReturnFalseWhenInvalid(isBrowserRequest, metadata, lineNum, payload, RecordDelegate)
	{
		var auxfields = metadata[SlavingMetadataKey.AUX_FIELDS];
		for (var idx = 0; auxfields && idx < auxfields.length; idx++)
		{
			var auxfld = auxfields[idx];
			var fieldName = auxfld.hasOwnProperty(SlavingMetadataKey.FIELD_OBJECT.NAME) ? auxfld[SlavingMetadataKey.FIELD_OBJECT.NAME] : "";
			var machineName = auxfld.hasOwnProperty(SlavingMetadataKey.FIELD_OBJECT.MACHINE) ? auxfld[SlavingMetadataKey.FIELD_OBJECT.MACHINE] : null;
			var htmlReference = auxfld.hasOwnProperty(SlavingMetadataKey.FIELD_OBJECT.HTML_REF) ? auxfld[SlavingMetadataKey.FIELD_OBJECT.HTML_REF] : null;
			var fieldValue = RecordDelegate.getValue({isMachineField: machineName !== null, machineName: machineName, fieldName: fieldName, ln: lineNum});

			if(isBrowserRequest && !fieldValue && fieldValue !== 0 && fieldValue !== "")
				fieldValue = eval(htmlReference);

			if(isInvalidRequiredAuxField(auxfld, fieldValue, (auxfld[SlavingMetadataKey.FIELD_OBJECT.REQUIRED] === 'T')))
				return false;

			payload['si_'+fieldName] = fieldValue;
		}

		return true;
	}
	/*
	 * Description: helper function to add master value of the query field to payload for field query request
	 */
	function addMasterValueToPayload(metadata, lineNum, payload, RecordDelegate)
	{
		if (metadata[SlavingMetadataKey.MASTER] && metadata[SlavingMetadataKey.MASTER] !== '')
		{
			var fld = metadata[SlavingMetadataKey.MASTER];
			var masterFieldName = fld[SlavingMetadataKey.FIELD_OBJECT.NAME];
			var machineName = fld.hasOwnProperty(SlavingMetadataKey.FIELD_OBJECT.MACHINE) ? fld[SlavingMetadataKey.FIELD_OBJECT.MACHINE] : null;
			// adding master value
			payload['si_' + masterFieldName] = RecordDelegate.getValue({isMachineField: machineName !== null, machineName: machineName, fieldName: masterFieldName, ln: lineNum});
		}
	}

	/*
	 * Description: helper function to separate the base url into url and payload
	 */
	function cleanupQueryURL(url)
	{
		var payload = {};
		if(url.indexOf("?") !== -1)
		{
			var list = url.split("?");
			url = list[0];
			if(list[1].length >0)
			{
				var params = list[1].split("&");

				for(var i=0; i < params.length; i++)
				{
					//noinspection JSUnfilteredForInLoop
					if(params[i].length >0)
					{
						//noinspection JSUnfilteredForInLoop
						var pair = params[i].split("=");
						payload[pair[0]] = String(pair[1]);
					}
				}
			}
		}
		return { url : url, payload : payload };
	}

	function isInvalidRequiredAuxField(field, value, required)
	{
		var requiredScriptCondition = true;
		if (field.hasOwnProperty(SlavingMetadataKey.FIELD_OBJECT.REQUIRED_SCRIPT))
			requiredScriptCondition = ( eval(field[SlavingMetadataKey.FIELD_OBJECT.REQUIRED_SCRIPT]) ) ? true : false;

		if(field.hasOwnProperty(SlavingMetadataKey.FIELD_OBJECT.IS_REQUIRED) && field.isRequired)
			requiredScriptCondition = true;

		var isValidValue = (value && value.length != 0) ? true : false;

		return required && requiredScriptCondition && !isValidValue;
	}

	function getURL(metadata, masterInfo)
	{
		var requestObj = getQueryRequest(metadata, masterInfo, undefined /* no remote record context required */);
		var fullUrl = requestObj['url'];
		var payload = requestObj['payload'];
		if(fullUrl.indexOf('?') == -1)
		{
			fullUrl+='?';
		}
		var first = true;
		for(var key in payload)
		{
			if(!first)
				fullUrl+='&';
			else
				first = false;

			if(key.indexOf('si_')===0 || key==='q' || key==='si' || key==='id')
				fullUrl = fullUrl+key+'='+encodeURIComponent(emptyIfNull(payload[key])) ;
			else
				fullUrl = fullUrl+key+'='+emptyIfNull(payload[key]) ;
		}

		return fullUrl;
	}

	function addEscaping(value)
	{
		value= value.replace(/\\/g, "\\\\");
		value= value.replace(/'/g, "\\\'");
		value= value.replace(/"/g, "\\\"");
		return value;
	}

	/**
	 * static function that verifies that slaving data sent from server using new format are the same that were set by legacy code.
	 *  fields parameter is needed so we call verify before slaving script execution as fields can be modified by slave script.
	 * @param fields  fields that need to be checked on the current level
	 * @param slavingValues array of all slaving values
	 */
	function verifySlavingValues(fields,slavingValues)
	{
		try{
			for(var j = 0; fields && j < fields.length; j++)
			{
				for (var idx = 0; slavingValues && idx < slavingValues.length; idx++)
				{
					var slaveInfo = slavingValues[idx];
					if(isFunction(slaveInfo))
					{
						continue;
					}
					if(slaveInfo['name'] != fields[j][0] || (slaveInfo['machine']!= null && slaveInfo['machine']!= fields[j][1] || slaveInfo['machine'] == null && fields[j][1] != ""))
						continue;
					var options = slaveInfo["options"];
					var fld = nlapiGetLineItemField(slaveInfo["machine"],slaveInfo["name"]);
					if(slaveInfo["machine"] != null)
					{
						if(options != null)
						{
							var legacyValues = getLineItemOptionValues(slaveInfo["machine"],slaveInfo["name"],fld.type);
							var legacyTexts = getLineItemOptionTexts(slaveInfo["machine"],slaveInfo["name"],fld.type);
							if(legacyValues.length != options.length)
								nsServerCall('/app/common/scripting/nlapijsonhandler.nl', 'logSlavingError',['Json option Length mismatch',
									'Options length do not match. Field name:' + slaveInfo['name'] +' ,path = '+  window.location.pathname]);
							else
							{
								for( var i= 0; options && i <options.length; i++)
								{
									var option = options[i];
									// need to take care of escape character difference
									var legacyValue= addEscaping(legacyValues[i]);
									var legacyText= addEscaping(legacyTexts[i]);
									// some options have extra CR in legacy ignoring it
									legacyText = legacyText.replace('\n','');


									if(option[0] != legacyValue)
									{
										nsServerCall('/app/common/scripting/nlapijsonhandler.nl', 'logSlavingError',['Json option Value mismatch',
											'Options slaving value do not match. Field name:' + slaveInfo['name'] +' jsonValue =' +option[0] +' legacyValue = ' + legacyValues[i]  +' ,path = '+  window.location.pathname]);
										break;
									}
									if(option[1] != legacyText)
									{
										nsServerCall('/app/common/scripting/nlapijsonhandler.nl', 'logSlavingError',['Json option Value mismatch',
											'Options slaving text do not match. Field name:' + slaveInfo['name'] +' jsonValue =' +option[1] +' legacyValue = ' + legacyTexts[i]  +' ,path = '+  window.location.pathname]);
										break;
									}
								}
							}

						}

						// don't know the old value (before slaving)
						// so can not check values for this case.
						if(slaveInfo["nooverride"] != null)
						{
							continue;
						}
						if(slaveInfo["condition"] != null)
							if(!eval(slaveInfo["condition"]))
								continue;
						// need to take care of escape character difference
						var oldvalue = nlapiGetCurrentLineItemValue(slaveInfo["machine"],slaveInfo["name"]);
						oldvalue= addEscaping(oldvalue);

						if(slaveInfo["value"] != null && slaveInfo["value"] != oldvalue  )
						{
							nsServerCall('/app/common/scripting/nlapijsonhandler.nl', 'logSlavingError',['Json Value mismatch',
								'Value slaving result do not match. Field name:' + slaveInfo['name'] + ', jsonText = '+ slaveInfo["value"]+', actualValue  = ' + oldvalue +' ,path = '+  window.location.pathname]);

						}
						if(slaveInfo["text"] != null)
						{
							// need to take care of escape character difference
							var oldtext = nlapiGetCurrentLineItemText(slaveInfo["machine"],slaveInfo["name"]);
							oldtext= addEscaping(oldtext);

							if(slaveInfo["text"] != oldtext)
							{
								nsServerCall('/app/common/scripting/nlapijsonhandler.nl',
								             'logSlavingError',['Json Value mismatch',
											'Value slaving result do not match. Field name:' + slaveInfo['name'] + ', jsonText = '+ slaveInfo['text'] +', actualValue  = ' + oldtext +' ,path = '+ window.location.pathname]);

							}
						}
					}
					else
					{
						// need to take care of escape character difference

						var oldvalue = nlapiGetFieldValue(slaveInfo["name"]);
						oldvalue=  addEscaping(oldvalue);

						var options = slaveInfo["options"];
						var fld = nlapiGetField(slaveInfo["name"]);
						if(options != null)
						{
							var legacyValues = getOptionValues(slaveInfo["name"], fld.type);
							var legacyTexts = getOptionTexts(slaveInfo["name"],fld.type);

							if(legacyValues.length != options.length)
								nsServerCall('/app/common/scripting/nlapijsonhandler.nl', 'logSlavingError',['Json option Length mismatch',
									'Options length do not match. Field name:' + slaveInfo['name']  +' ,path = '+  window.location.pathname]);
							else
							{
								for( var i= 0; options && i <options.length; i++)

								{
									var option = options[i];
									var legacyValue=  addEscaping(legacyValues[i]);
									var legacyText= addEscaping(legacyTexts[i]);
									// some options have extra CR in legacy ignoring it
									legacyText = legacyText.replace('\n','');

									if(option[0] != legacyValue)
									{
										nsServerCall('/app/common/scripting/nlapijsonhandler.nl', 'logSlavingError',['Json option Value mismatch',
											'Options slaving value do not match. Field name:' + slaveInfo['name'] +' jsonValue =' +option[0] +' legacyValue = ' + legacyValues[i]  +' ,path = '+  window.location.pathname]);
										break;
									}
									if(option[1] != legacyText)
									{
										nsServerCall('/app/common/scripting/nlapijsonhandler.nl', 'logSlavingError',['Json option Value mismatch',
											'Options slaving text do not match. Field name:' + slaveInfo['name'] +' jsonValue =' +option[1] +' legacyValue = ' + legacyText[i]  +' ,path = '+  window.location.pathname]);
										break;
									}
								}
							}
						}
						// don't know the old value (before slaving)
						// so can not check values for this case.
						if(slaveInfo["nooverride"] != null)
						{
							continue;
						}
						if(slaveInfo["condition"] != null)
							if(!eval(slaveInfo["condition"]))
								continue;

						if(slaveInfo["value"] != null && slaveInfo["value"] != oldvalue  )
						{
							nsServerCall('/app/common/scripting/nlapijsonhandler.nl', 'logSlavingError',['Json Value mismatch',
								'Value slaving result do not match. Field name:' + slaveInfo['name'] + ', jsonText = '+ slaveInfo['value'] +', actualValue  = ' + oldvalue +' ,path = '+
								window.location.pathname]);

						}
						if(slaveInfo["text"] != null)
						{
							// need to take care of escape character difference
							var oldtext = nlapiGetFieldText(slaveInfo["name"]);
							oldtext= addEscaping(oldtext);;

							if(slaveInfo["text"] != oldtext)
							{
								nsServerCall('/app/common/scripting/nlapijsonhandler.nl', 'logSlavingError',['Json Value mismatch',
									'Value slaving result do not match. Field name:' + slaveInfo['name'] + ', jsonText = '+ slaveInfo['text'] +', actualValue  = ' + oldtext +' ,path = '+
									window.location.pathname]);
							}
						}
					}
				}
			}
		}
		catch(err)
		{
			nsServerCall('/app/common/scripting/nlapijsonhandler.nl', 'logSlavingError',['Excepion in verifying values', err.msg +' ,path = '+	  window.location.pathname]);
		}
	}

	function isFunction(obj)
	{
		return Object.prototype.toString.call(obj) === '[object Function]';
	}

	/**
	 * static utility function that process the slavingResponse data in the json format and sets the data in the DOM using Nlapi when possible.
	 * @param slavingValues
	 * @param record
	 */
	function processSlavingValues(slavingValues, record, evalFunc)
	{
		var RecordDelegate = (record) ? new RemoteRecordDelegate(record) : new BrowserRecordDelegate();
		for (var idx = 0; slavingValues && idx < slavingValues.length; idx++)
		{
			var slaveResult = slavingValues[idx];
			var fieldName = slaveResult[SlaveResultKey.NAME];
			var isMachineField = slaveResult.hasOwnProperty(SlaveResultKey.MACHINE_NAME);
			var machineName = (isMachineField) ? slaveResult[SlaveResultKey.MACHINE_NAME] : null;
			var lineNum = (isMachineField) ? RecordDelegate.getCurrentLineItemIndex(machineName) : -1;
			var fieldInfo = {isMachineField: isMachineField, machineName: machineName, fieldName: fieldName, lineNum: lineNum};
			fieldInfo.isMultiSelectField = RecordDelegate.isFieldMultiSelect(machineName, fieldName, lineNum);

			if(isFunction(slaveResult))
			{
				if(!!evalFunc /*client side only*/){
					evalFunc(slaveResult.toString() + ';' + slaveResult.name + '();');
				} else {
					slaveResult(RecordDelegate);
				}
				continue;
			}

			try
			{
				applySlaveValueToRecord(RecordDelegate, slaveResult, fieldInfo);
			}
			catch(err)
			{
				if(RecordDelegate instanceof BrowserRecordDelegate)
					RecordDelegate.serverCall('/app/common/scripting/nlapijsonhandler.nl', 'logSlavingError',['Excepion in processing values', err.msg +',path =  '+  ((record)? "" : window.location.pathname)]);
				else
					throw err;
				// this will allow the code to proceed further even if there is an error in slaving
				// we probably need to do something here rather than fail silently
			}
			finally
			{
				if(record == null)
					RecordDelegate.setFieldNoSlaving(fieldInfo, false);
			}
		}
	}

	function applySlaveValueToRecord(RecordDelegate, slaveResult, fieldInfo)
	{
		var fireFieldChangeEvent = slaveResult.hasOwnProperty(SlaveResultKey.FIRE_FIELDCHANGE);
		var isClientSlaving = slaveResult.hasOwnProperty(SlaveResultKey.IS_CLIENT_SLAVING);

		RecordDelegate.setFieldNoSlaving(fieldInfo, !fireFieldChangeEvent);

		var options = slaveResult[SlaveResultKey.OPTIONS];
		if(options)
		{
			var oldValue = RecordDelegate.getValue(fieldInfo);

			var isOldValueInOptions = false;
			RecordDelegate.removeOption(fieldInfo); // clear all options
			for(var j = 0; j < options.length; j++)
			{
				var option = options[j];
				RecordDelegate.insertOption(fieldInfo, option[0], option[1]);
				if(oldValue === option[0])
					isOldValueInOptions = true;
			}

			var preserveOriginalValueWhenOptionSlavingOnly = (RecordDelegate.isValEmpty(slaveResult[SlaveResultKey.VALUE]) && !RecordDelegate.isValEmpty(oldValue) && isOldValueInOptions);
			if(preserveOriginalValueWhenOptionSlavingOnly)
				RecordDelegate.setValue(fieldInfo, oldValue, false);
		}

		/* skip slaving when there is old value */
		if(slaveResult[SlaveResultKey.NO_OVERRIDE] != null && !RecordDelegate.isValEmpty(RecordDelegate.getValue(fieldInfo)))
			return;

		/* skip slaving when condition is not met */
		var slavingCondition = typeof slaveResult[SlaveResultKey.CONDITION] === 'boolean' ? slaveResult[SlaveResultKey.CONDITION] : eval(slaveResult[SlaveResultKey.CONDITION]);
		if(slaveResult.hasOwnProperty(SlaveResultKey.CONDITION) && !slavingCondition)
			return;

		if(slaveResult.hasOwnProperty(SlaveResultKey.TEXT))
			RecordDelegate.setSelectValue(fieldInfo, slaveResult[SlaveResultKey.VALUE], slaveResult[SlaveResultKey.TEXT], fireFieldChangeEvent, isClientSlaving);
		else if(slaveResult.hasOwnProperty(SlaveResultKey.VALUE))
			RecordDelegate.setValue(fieldInfo, slaveResult[SlaveResultKey.VALUE],  fireFieldChangeEvent, isClientSlaving);
	}


	/**
	 * redraws edit machines in case new slaving response is used.
	 * @param machinedata
	 */
	function redrawEditMachines(machinedata)
	{
		for (var machineName in machinedata)
		{

			var slaveMachineData =  machinedata[machineName];

			if( slaveMachineData['edit'] != null && (slaveMachineData["nooverride"] == null || document.forms[0].elements['next' + machineName  + 'idx'].value == 1))
			{
				var data = slaveMachineData['data'];
				var strValue='';
				for (var i = 0; data && i < data.length; i++)
				{
					var row = data[i];
					for (var j = 0; row && j < row.length; j++)
					{
						if(strValue != '')
							strValue += String.fromCharCode(1);
						strValue +=row[j];
					}
					if(i != data.length -1)
						strValue += String.fromCharCode(2);
				}
				document.forms[0].elements[machineName+'data'].value=strValue;
				clearLineArray(name);

				document.forms[0].elements['next'+ machineName  + 'idx'].value=data==null?1:data.length+1;
				document.forms[0].elements[machineName+'valid'].value='T';
				setMachineContentUpdated(machineName, true);
				clearLineArray(name);
				if (parent.document.forms.main_form.elements[machineName+'loaded'] != null) parent.document.forms.main_form.elements[machineName+'loaded'].value = 'T';
				if (parent.document.forms.main_form.elements[machineName+'dotted'] != null) parent.document.forms.main_form.elements[machineName+'dotted'].value = 'T';
				if(window[machineName+'_machine'] != null)
				{
					window[machineName+'_machine'].refresheditmachine(true);

					window[machineName+'_machine'].recalc();
				}
				var tabTD = parent.document.getElementById(machineName+'lnkdot');
				if (tabTD != null) { tabTD.style.display='';}
			}
			if(isFunction(slaveMachineData['metadata']))
			{
				slaveMachineData['metadata'].call();
				continue;
			}
		}
	}

	function getOptionValues(fldnam,type)
	{
		var form = typeof(ftabs) != 'undefined' && ftabs[getFieldName(fldnam)] != null ? document.forms[ftabs[getFieldName(fldnam)]+'_form'] : document.forms[0];
		var fld = getFormElement( form, getFieldName(fldnam) );
		if (fld != null)
			if(type === MULTISELECT)
				return getMultiDropdown(fld,window).getValues();
			else
				return getDropdown(fld,window).getValues();
		else
			return null;
	}
	function getOptionTexts(fldnam,type)
	{
		var form = typeof(ftabs) != 'undefined' && ftabs[getFieldName(fldnam)] != null ? document.forms[ftabs[getFieldName(fldnam)]+'_form'] : document.forms[0];
		var fld = getFormElement( form, getFieldName(fldnam) );
		if (fld != null)
			if(type === MULTISELECT)
				return getMultiDropdown(fld,window).textArray;
			else
				return getDropdown(fld,window).getTexts();
		else
			return null;
	}
	function getLineItemOptionValues(machine,fldnam, type)
	{
		var form = document.forms[machine+'_form'];
		var fld = getFormElement( form, getFieldName(fldnam) );
		if (fld != null)
			if(type === MULTISELECT)
				return getMultiDropdown(fld,window).getValues();
			else
				return getDropdown(fld,window).getValues();
		else
			return null;
	}
	function getLineItemOptionTexts(machine,fldnam, type)
	{
		var form = document.forms[machine+'_form'];
		var fld = getFormElement( form, getFieldName(fldnam) );
		if (fld != null)
			if(type === MULTISELECT)
				return getMultiDropdown(fld,window).textArray;
			else
				return getDropdown(fld,window).getTexts();
		else
			return null;
	}

	function isValEmpty(val)
	{
		if (val === null || val === undefined)
			return true;

		val = String(val);
		return (val.length === 0) || !/\S/.test(val);
	}

	function returnEmptyIfNull(str)
	{
		return str != null ? str : "";
	}

	return {
		cleanupQueryURL: cleanupQueryURL,
		getQueryRequest: getQueryRequest,
		getURL: getURL,
		processSlavingValues:processSlavingValues,
		verifySlavingValues:verifySlavingValues,
		redrawEditMachines:redrawEditMachines
	};
}();

if (typeof Object.freeze == 'function')
	slavingUtil = Object.freeze(slavingUtil);
function resolveDeprecatedFieldText(fieldName, fieldText)
{
    var key=nlapiGetRecordType() + '/' + fieldName + '/' + fieldText;
    if (key=='address/country/United Kingdom (GB)') return 'United Kingdom'
    return fieldText;
}


function getMachineByName(machineName)
{
    return getMachine(machineName);
}

function getMachine(machineName)
{
    if (window.machines)
        return window.machines[machineName];
    return null;
}


function getFieldSetDisplayText( mach, fldset, linenum, nohtml, sHideLabels )
{
	var sOutput = "";
	if ( nohtml == null )
		nohtml = false;

	var nCount = 0;
	for ( var i = 0; i < mach.countFormElements(); i++)
	{
		if ( mach.getFormElementFieldSet(i) != fldset )
			continue;
		nCount++;

		var curName = mach.getFormElementName(i);
		var curElement = mach.getFormElement(i);
		var curLabel = mach.getFormElementLabel(i);

		var dataCell = linenum == null ? getFormValue(curElement) : getEncodedValue(mach.name, linenum, curName);
		
		if (linenum == null && curElement != null)
		{
			var spanName = mach.name + "_" + (curName.indexOf( '_display' ) == -1 ? curName : mach.getFormElementName( i+1 )) + '_fs';
			var spanObj = document.getElementById( spanName );
			if (spanObj != null && spanObj.style.display == 'none')
			{
				dataCell = "";
			}
		}

		if ( dataCell != null && dataCell.length > 0 )
		{
			var curType = mach.getFormElementType(i);
			var bCheckBox = curType == 'checkbox';
			var bWriteLabel = curLabel.length > 0 && (!bCheckBox || dataCell == 'T');
			var bWriteLineBreak = false;
			if ( bWriteLabel && (sHideLabels == null || sHideLabels.indexOf(curLabel) == -1))
			{
				sOutput += curLabel;
				if ( !bCheckBox )
					sOutput += ": ";
				bWriteLineBreak = true;
			}
			if ( !bCheckBox )
			{
				if ( mach.isElementPopupDisplayField(i) )
				{
					var pos = curName.indexOf("_display");
					var actualDataCell = linenum == null ? getFormValue(mach.getFormElement(i+1)) : getEncodedValue(mach.name, linenum, mach.getFormElementName(i+1));
					if ( pos != -1 && !isValEmpty(actualDataCell) )
					{
						sOutput += dataCell.replace(/\u0005/g, ', ').replace(/\r/g,'').replace(/\n/g, ', ');
						bWriteLineBreak = true;
					}
				}
				else
				{
					bWriteLineBreak = true;
					if ( curType == "select" )
					{
						if ( isMultiSelect( curElement ) )
							sOutput += getmultiselectlisttext( curElement, dataCell );
						else
							sOutput += getlisttext( curElement, dataCell )  ;
					}
					else if (curType == "currency")
						sOutput += format_currency( parseFloat( dataCell ) );
					else if (curType == "radio")
						sOutput += getradiotext( curElement, dataCell );
					else if (curType == "namevaluelist")
						sOutput += getnamevaluelisttext( dataCell , ", " );
                    else if (curType == "timeselector")
                        sOutput += curElement.parentNode.controller.getTextForValue(dataCell);
					// handle all other field types (text, etc) - but never print out the popup multi-select label data
					else if (curType != "slaveselect" && curName.indexOf("_labels") == -1)
						sOutput += dataCell.replace(/\r/g,'').replace(/\r/g,'').replace(/\n/g, ", ");
					else
						bWriteLineBreak = false;
				}
			}

			if ( bWriteLineBreak )
				sOutput +=  nohtml ? " " : "<br>";
		}
	}
	return sOutput;
}



window.fieldnamesArray = {};



window.haslineitemgroupArray = {};

function hasLineItemGroup(machine_name)
{

 if( window.haslineitemgroupArray[machine_name] == null )
  window.haslineitemgroupArray[machine_name] = document.forms['main_form'].elements[machine_name+'data'] != null;
 return window.haslineitemgroupArray[machine_name];

}


function allowAddLines(machine_name)
{
	return hasMachine(machine_name);
}

function hasMachine(machine_name)
{
    return hasLineItemGroup(machine_name) && eval('typeof('+machine_name+'_machine)') != "undefined";
}

function isEditMachine(machine_name)
{
	return getMachine(machine_name) && (getMachine(machine_name).type == EDIT_MACHINE);
}


window.lineitemFieldTypeArray = {};

function getEncodedFieldType(machine_name, fieldname, useOrigType)
{
	if ( hasEncodedField(machine_name, fieldname) )
	{
		if ( window.lineitemFieldTypeArray[machine_name] == null || window.lineitemFieldTypeArray[machine_name][fieldname] == null )
		{
			window.lineitemFieldTypeArray[machine_name] = {};
			var aFields = splitIntoCells( document.forms['main_form'].elements[machine_name+'fields'].value );
			var aTypes = splitIntoCells( document.forms['main_form'].elements[machine_name+'types'].value );
			var origTypeElem = document.forms['main_form'].elements[machine_name + 'origtypes'];
			var origTypes = origTypeElem ? splitIntoCells(origTypeElem.value) : null;
			for ( var i = 0; i < aFields.length; i++ )
			{
				var type = aTypes[i];
				if (i > 0 && ( type == "slaveselect" || type == "integer" ) && aFields[i-1] == aFields[i]+"_display")
					type = (aTypes[i-1] == "textarea") ? "multiselect" : "select";
				window.lineitemFieldTypeArray[machine_name][aFields[i]] = type;
				if (origTypes && origTypes[i])
					window.lineitemFieldTypeArray[machine_name][aFields[i] + '_origtype'] = origTypes[i];
			}
		}
		if (useOrigType && window.lineitemFieldTypeArray[machine_name][fieldname + '_origtype'])
			fieldname += '_origtype';
		return window.lineitemFieldTypeArray[machine_name][fieldname]
	}
	return null;
}


window.lineitemFieldlabelArray = {};

function getEncodedFieldLabel(machine_name, fieldname)
{
	if ( hasEncodedField(machine_name, fieldname) )
	{
		if ( window.lineitemFieldlabelArray[machine_name] == null || window.lineitemFieldlabelArray[machine_name][fieldname] == null )
		{
			window.lineitemFieldlabelArray[machine_name] = {};
			var aFields = splitIntoCells( document.forms['main_form'].elements[machine_name+'fields'].value );
			var aLabels = splitIntoCells( document.forms['main_form'].elements[machine_name+'labels'].value );
			for ( var i = 0; i < aFields.length; i++ )
			{
				var label = aLabels[i];
				if (i > 0 && aFields[i-1] == aFields[i]+"_display")
					label = aLabels[i-1];
				window.lineitemFieldlabelArray[machine_name][aFields[i]] = label;
			}
		}
		return window.lineitemFieldlabelArray[machine_name][fieldname]
	}
	return null;
}


window.lineitemFieldParentArray = {};

function getEncodedFieldParent(machine_name, fieldname)
{
	if ( hasEncodedField(machine_name, fieldname) )
	{
		if ( window.lineitemFieldParentArray[machine_name] == null || window.lineitemFieldParentArray[machine_name][fieldname] == null )
		{
			window.lineitemFieldParentArray[machine_name] = {};
			var aFields = splitIntoCells( document.forms['main_form'].elements[machine_name+'fields'].value );
			var aParents = splitIntoCells( document.forms['main_form'].elements[machine_name+'parents'].value );
			for ( var i = 0; i < aFields.length; i++ )
			{
				window.lineitemFieldParentArray[machine_name][aFields[i]] = aParents[i];
			}
		}
		return window.lineitemFieldParentArray[machine_name][fieldname]
	}
	return null;
}



function getFieldLineNum(machine_name, fld)
{
	var fieldnames = getFieldNamesArray(machine_name);
    var fieldname = fld.name;
    var linenum = -1;

	for ( var i = 0; i < fieldnames.length; i++ )
    {
        var re = new RegExp("^"+fieldnames[i]+"([0-9]+)$");
   	    if ( re.test(fieldname) )
        {
            linenum = parseInt(RegExp.$1, 10);
            break;
        }
    }
	return linenum;
}
function getLineItemField(machine_name, fldname, linenum)
{
	var fld = null;
	var formname = machine_name + '_form';
	if ( getEncodedFieldType( machine_name, fldname ) == "radio" )
	{
		var radio = getFormElementViaFormName( formname, fldname );
		fld = radio[linenum-1]
	}
	else
		fld = getFormElementViaFormName( formname, fldname + ( linenum != null ? linenum : '' ) );
	return fld;
}



function getLineCount(machine_name)
{
    var machine = getMachine(machine_name);
    if (machine)
        return machine.getNumRows();

    
    return doGetLineCount(machine_name);
}

function getLineArray(machine_name)
{
    var machine = getMachine(machine_name);
    if (machine)
        return machine.getLineArray();

    
    return doGetLineArray(machine_name);
}

function getLineArrayLine(machine_name, linenum)
{
    var machine = getMachine(machine_name);
    if (machine)
        return machine.getLineArrayLine(linenum);

    
    return doGetLineArrayLine(machine_name, linenum);
}

function setLineArray(machine_name, linearray)
{
    var machine = getMachine(machine_name);
    if (machine)
        machine.setLineArray(linearray);
    else
        
        doSetLineArray(machine_name, linearray);
}

function setLineArrayLine(machine_name, linenum, linearray)
{
    var machine = getMachine(machine_name);
    if (machine)
        machine.setLineArrayLine(linenum, linearray);
    else
        
        doSetLineArrayLine(machine_name, linenum, linearray);
}

function hasLineArray(machine_name)
{
    var machine = getMachine(machine_name);
    if (machine)
        return machine.hasLineArray();

    
    return doHasLineArray(machine_name);
}

function setMachineContentUpdated(machine_name, bUpdated)
{
    var machine = getMachine(machine_name);
    if (machine)
        machine.setContentUpdated(bUpdated);
}

function clearLineArray(machine_name)
{
    var machine = getMachine(machine_name);
    if (machine)
        machine.clearLineArray();
    else
        
        doClearLineArray(machine_name);
}


function Machine_deleteLineItems(name, start, end)
{
    var machine = getMachine(name);
    if (machine)
        return machine.deletelines(start, end);
    else
        return doDeleteLineItems(name, start, end);
}



 function Machine_clearLineItems(name, bNoFocus)
{
    var machine = getMachine(name);
    if (machine)
        return machine.removeAllLines(bNoFocus);
}

function writeLineArray(machine_name)
{
    var machine = getMachine(machine_name);
    if (machine)
        machine.writeLineArray();
    else
        
        doWriteLineArray(machine_name);
}

function getEncodedValue(machine_name, linenum, fieldname)
{
    var machine = getMachine(machine_name);
    if (machine)
        return machine.getFieldValue(fieldname, linenum, true);

    
    return doGetEncodedValue(machine_name, linenum, fieldname);
}

function findEncodedValue(machine_name, fieldname, value)
{
    var machine = getMachine(machine_name);
    if (machine)
        return machine.findEncodedValue(fieldname, value, true);

    
    return doFindEncodedValue(machine_name, fieldname, value);
}

function setEncodedValue(machine_name, linenum, fieldname, value)
{
    var machine = getMachine(machine_name);
    if (machine)
        machine.setFieldValue(linenum, fieldname, value);
    else
        
        doSetEncodedValue(machine_name, linenum, fieldname, value);
}

function setEncodedValues(machine_name, linenum, form)
{
    var machine = getMachine(machine_name);
    if (machine)
        machine.setEncodedValues(linenum, form);
    else
        
        doSetEncodedValues(machine_name, linenum, form);
}

function setFormValues(machine_name, linenum, form, fld_name, firefieldchanged)
{
    var machine = getMachine(machine_name);
    if (machine)
        machine.setFormValues(linenum, form, fld_name, firefieldchanged);
    else
        
        doSetFormValues(machine_name, linenum, form, fld_name, firefieldchanged);
}


function getEncodedFieldPosition(machine_name, fieldname)
{
    var machine = getMachine(machine_name);
    if (machine)
        return machine.getFieldPosition(fieldname);

    return doGetEncodedFieldPosition(machine_name, fieldname);
}

function hasEncodedField(machine_name, fieldname)
{
    var machine = getMachine(machine_name);
    if (machine)
        return machine.hasEncodedField(fieldname);

	return doHasEncodedField(machine_name, fieldname);
}

function getFieldNamesArray(machine_name)
{
    return doGetFieldNamesArray(machine_name);
}

function syncMachineSegment(mach, frm, fromline, toline)
{
    var machine = getMachine(mach);
    if (machine)
        machine.updateFormElements(fromline, toline);

	if (fromline == -1) fromline = 1;
	if (toline == -1 || toline > document.forms[0].elements['next'+mach+'idx'].value-1) toline = document.forms[0].elements['next'+mach+'idx'].value-1;
	for (var i=fromline;i<=toline;i++)
		setFormValues(mach,i,frm);
}





function doGetLineCount(machine_name)
{
    return doGetLineArray(machine_name) != null ? doGetLineArray(machine_name).length : 0;
}


var MACHINE_NAME_PREPEND = "mch_";

window.linearrayArray = {};


function doGetLineArray(machine_name)
{

	var lineArrayIndex = MACHINE_NAME_PREPEND + machine_name;
	if( window.linearrayArray[lineArrayIndex] == null)
	{
		if ( hasLineItemGroup(machine_name) )
			window.linearrayArray[lineArrayIndex] = splitIntoRows( document.forms['main_form'].elements[machine_name+'data'].value );
	}
	return window.linearrayArray[lineArrayIndex];

}

function doGetLineArrayLine(machine_name, linenum)
{

	var linearray = doGetLineArray(machine_name);
	if (linearray[linenum] != null && typeof linearray[linenum] == 'string')
		linearray[linenum] = splitIntoCells(linearray[linenum]);
	return linearray[linenum];

}

function doSetLineArray(machine_name, linearray)
{

	var lineArrayIndex = MACHINE_NAME_PREPEND + machine_name;
	window.linearrayArray[lineArrayIndex] = linearray;

}

function doSetLineArrayLine(machine_name, linenum, line)
{
	var linearray = doGetLineArray(machine_name);

	linearray[linenum] = line;

}

function doHasLineArray(machine_name, linearray)
{
	return window.linearrayArray != null && window.linearrayArray[MACHINE_NAME_PREPEND + machine_name] != null;
}

function doClearLineArray(machine_name)
{
	if( window.linearrayArray != null )
	    window.linearrayArray[MACHINE_NAME_PREPEND + machine_name] = null;
}

function doWriteLineArray(machine_name)
{

	if( doHasLineArray(machine_name) )
	{
		var linearray = doGetLineArray(machine_name);
		doWriteLineArrayData(machine_name, linearray);
	}

}

function doWriteLineArrayData(machine_name, linearray)
{
    if( linearray && linearray.length > 0)
    {
        for (var i=0; i<linearray.length; i++)
            if (linearray[i] != null && typeof(linearray[i]) != 'string')
                linearray[i] = linearray[i].join(String.fromCharCode(1));
        document.forms['main_form'].elements[machine_name+'data'].value = doGetLineArray(machine_name).join(String.fromCharCode(2));
	}
    else
        document.forms['main_form'].elements[machine_name+'data'].value = "";
}

function doGetEncodedValue(machine_name, linenum, fieldname)
{
    var linedata = doGetLineArrayLine(machine_name, linenum-1);
    if( linedata == null )
         return null;
    var i = doGetEncodedFieldPosition(machine_name, fieldname);
     if (i != -1)
       return linedata[i];
    return '';
}

function doFindEncodedValue(machine_name, fieldname, value)
{
    var i = doGetEncodedFieldPosition(machine_name, fieldname);
    if (i == -1)
        return -1;
    for (var linenum=0;linenum < doGetLineCount(machine_name);linenum++)
    {
        var linedata = doGetLineArrayLine(machine_name,linenum);
        if (value == linedata[i])
            return linenum+1;
    }
    return -1;
}

function doSetEncodedValue(machine_name, linenum, fieldname, value)
{
    if ( !hasLineItemGroup(machine_name) )
		return;
    var linedata = doGetLineArrayLine(machine_name,linenum-1 );
    if ( linedata == null ) linedata = [];
    var i = doGetEncodedFieldPosition(machine_name, fieldname);
	if (i == -1)
		return;
	linedata[i] = value != null ? String(value) : "";
	doSetLineArrayLine(machine_name,linenum-1,linedata);
}


function doSetEncodedValues(machine_name, linenum, form)
{
    
	if ( !hasLineItemGroup(machine_name) )
		return;
	if ( form == null )
		form = document.forms[machine_name+'_form'];

    var fieldnames = doGetFieldNamesArray(machine_name);
    var fieldflags = splitIntoCells( document.forms['main_form'].elements[machine_name+'flags'].value );
    var linedata = new Array(fieldnames.length);
    var olddata = getLineArrayLine(machine_name,linenum-1);

    for (var i=0; i < fieldnames.length; i++)
    {
        if ( isValEmpty( fieldnames[i] ) )
            continue;
        if ((fieldflags[i] & 4) == 0)
            linedata[i] = olddata[i];
        else
        {
            var fld;
			if (form.elements[fieldnames[i]] != null && form.elements[fieldnames[i]][0] != null && form.elements[fieldnames[i]][0].type == "radio")
			{
				for ( var j = 0; j < form.elements[fieldnames[i]].length; j++ )
					if ( form.elements[fieldnames[i]][j].value == linenum )
						fld = form.elements[fieldnames[i]][j]
			}
			else if ((fieldflags[i] & 8) != 0)
                fld = form.elements[fieldnames[i+1]+linenum.toString()+"_display"];
            else
                fld = form.elements[fieldnames[i]+linenum.toString()];
            if (fld != null)
			{
				if (fld.type == "checkbox" || fld.type == "radio")
					linedata[i] = fld.checked ? 'T' : 'F';
				else if (fld.type == "select-one")
					linedata[i] = fld.options[fld.selectedIndex].value;
				else if (fld.type == "textarea")
					linedata[i] = fld.value.replace(/\r/g,'').replace(/\n/g,String.fromCharCode(5));
				else
					linedata[i] = fld.value;
			}
            else
                linedata[i] = olddata[i];
 		}
    }
	setLineArrayLine(machine_name,linenum-1,linedata);
}


function doSetFormValues(machine_name, linenum, form, fld_name, firefieldchanged)
{
    
	if ( !hasLineItemGroup(machine_name) || isEditMachine(machine_name) )
		return;

    var fieldnames = doGetFieldNamesArray(machine_name);
    var fieldflags = splitIntoCells( document.forms['main_form'].elements[machine_name+'flags'].value );
    var linedata = getLineArrayLine(machine_name, linenum-1);

    for (var i=0; i < fieldnames.length; i++)
    {
        if ( isValEmpty( fieldnames[i] ) || ( fld_name != null && fieldnames[i] != fld_name ) )
            continue;
        if ((fieldflags[i] & 4) != 0)
        {
            var fld;
            if (form.elements[fieldnames[i]] != null && form.elements[fieldnames[i]][0] != null && form.elements[fieldnames[i]][0].type == "radio")
                fld = form.elements[fieldnames[i]][linenum-1];
            else if ((fieldflags[i] & 8) != 0)
                fld = form.elements[fieldnames[i+1]+linenum.toString()+"_display"];
            else
                fld = form.elements[fieldnames[i]+linenum.toString()];
            if (fld != null)
            {
                if (fld.type == "radio")
                    fld.checked = linedata[i] == 'T';
                else if (fld.type == "checkbox")
                    setFormValue(fld, linedata[i] == 'T');
                else if (fld.type == "textarea")
                    fld.value = linedata[i].replace(/\u0005/g, '\n');
                else
                    setFormValue(fld, linedata[i], null, firefieldchanged);
            }
        }
    }
}


function doDeleteLineItems(name, start, end)
{
    var machine = eval(name+'_machine');
    var linearray = getLineArray(machine.name);
    setLineArray(machine.name,linearray.slice(0,start).concat(linearray.slice(end)));
    machine.setIndex( machine.getNextIndex() - (end - start) );
    return true;
}

function doGetEncodedFieldPosition(machine_name, fieldname)
{
    var fieldnames = doGetFieldNamesArray(machine_name);
	if ( fieldnames != null )
	{

 return fieldnames[fieldname] != null ? fieldnames[fieldname] : -1;

}
	return -1;
}

function doHasEncodedField(machine_name, fieldname)
{
    if (doGetEncodedFieldPosition(machine_name, fieldname) < 0)
		return false;
	return true;
}

function doGetFieldNamesArray(machine_name)
{

    if( window.fieldnamesArray[machine_name] == null )
    {
        if ( document.forms['main_form'].elements[machine_name+'fields'] != null )
        {
            window.fieldnamesArray[machine_name] = splitIntoCells( document.forms['main_form'].elements[machine_name+'fields'].value );
            for (var i=0; i < window.fieldnamesArray[machine_name].length; i++)
                window.fieldnamesArray[machine_name][window.fieldnamesArray[machine_name][i]] = i
        }
    }
 return window.fieldnamesArray[machine_name];

}

function doGetWrongFieldVisibilities(url)
{
    var origFieldVisibilities = nlapiServerCall(url, 'getItemFieldVisibilities', []);
    var fieldNames = doGetFieldNamesArray('item');
    var fieldNamesLength = fieldNames.length;
    var wrongFieldVisibilities = {};
    for (var i = 0; i < fieldNamesLength; i++)
    {
        var field = nlapiGetLineItemField("item", fieldNames[i]);
        if (!!field && origFieldVisibilities.hasOwnProperty(fieldNames[i]))
        {
            if (origFieldVisibilities[fieldNames[i]] && !field.isHidden())
                wrongFieldVisibilities[fieldNames[i]] = false;
            else if (!origFieldVisibilities[fieldNames[i]] && field.isHidden())
                wrongFieldVisibilities[fieldNames[i]] = true;
        }
    }
    return wrongFieldVisibilities;
}

var nsHeaderPrefix = 'Custom-Header';
var nsScriptErrorMsg = 'An unexpected error occurred in a script running on this page.';
var nsYesString = 'Yes';
var nsNoString = 'No';


var validationFlowSwitch = {};
if (Object.defineProperty)
{
    Object.defineProperty(validationFlowSwitch, "usesNewPath", {
        value: false,
        writeable: false
    });
}
else
{
    validationFlowSwitch["usesNewPath"] = false;
}

