
















// We don't want NLUIWidgets to have to directly call event handlers in this file because
// there are cases where we don't need to include this file.  Instead we just add the appropriate items
// to the existing event handlers, or create them if they don't exist.
var extremeOnClick = listEditFieldOnClick;
var existingOnClick = document.onclick;

    /**
     * If the document doesn't have an onclick or onkeydown handler, just assign one.
     * By defining a parameter named "event", we pass on the "event" parameter that
     * W3C-compliant browsers make available to event handlers. This parameter will
     * likely be "undefined" in IE, but it doesn't matter because we eventually call
     * getEvent() which picks up the event from window.event.
     */
if (existingOnClick == null)
    document.onclick = extremeOnClick;
else
    document.onclick = function (event) { extremeOnClick(event); existingOnClick(event); };

var extremeOnKeyDown = listEditFieldOnKeyDown;
var existingOnKeyDown = document.onkeydown;

if (existingOnKeyDown == null)
    document.onkeydown = extremeOnKeyDown;
else
    document.onkeydown = function (event) { extremeOnKeyDown(event); existingOnKeyDown(event); };

if (typeof NS !== 'undefined' && NS && NS.jQuery) {
	NS.jQuery(document).on('pagechange', function (evnt) {
		var nlef = getCurrentListEditField();
		if (nlef) {
			nlef.closeAndUpdate(evnt);
		}
	});
}

// prevent text selecting/highlighting when doing batch mutli-selects
// (meaning the highlighting that occurs when you shift-click on the page)
document.onselectstart = function(evnt)
{
	var target = getEventTarget(evnt);
    
    if(findClassUp(target, 'listEditDiv') != null)
        return;
    
	var cell = getParentExtremeCell(target);
	if(cell != null || findClassUp(target, 'quickaddDragDropIcon') != null)
		return false;
};

/**
 *  Given a cell (<td>) node, find the extreme editable span within it.
 *  Or, return null if there is no Extreme Editable span
 */
function locateChild(parent, clss)
{
	for (var i=0; parent != null && i < parent.childNodes.length; i++)
	{
        var childNode = parent.childNodes[i];

        if(childNode.className != null && childNode.className.indexOf(clss) != -1)
			return parent.childNodes[i];
		if(childNode.nodeName == "P")
			return locateChild(parent.childNodes[i],clss);
	}
	return null;
}

// Get the first parent that starts with 'xx' or 'batch'. (the <TD>s that X-List spans live in)
function getParentExtremeCell(node)
{
	while ( node != null && (node.className == null || node.className.baseVal != undefined ||
				( node.className.substring(0,2)!= 'xx'
						&& node.className.substring(0,5)!= 'batch' ) ) )
		node = node.parentNode;
	return node;
}

/*
 *  Contains all of the NLListEditField objects.  Index should match column
 *  number in the ID of the span it's contained in.  Both are zero based.
 */
var listEditFields = [];

/*
  * Keep track of whether or not we are in the middle of a batch update.
  * (Multiple cells in the same column)
  */
 var bInBatchUpdate = false;
var spansInBatch = [];

// During certain actions on the page, we don't allow users to click on other editable cells.
// We keep track and open once the action completes
var nextFieldToOpenSpanId = null;

var bUseNativeDropdowns = false;

function listEditFieldOnClick(evnt)
{
    var target = getEventTarget(evnt);

    
	if(!target.parentNode || target.parentNode.nodeName == "A" || isInCalendarInlineDIV(target))
	    return true;

    var popupSelectDiv = findClassUp(target,'popupouter');
    var div = findClassUp(target, 'listEditDiv');

    // if I clicked outside of a list editing div - check to see if there is one currently on the screen
    if(div==null && popupSelectDiv==null)
    {
        var cell = getParentExtremeCell(target);
        var spn = locateChild(cell,'listEditSpan');

        
        if(spn != null && pageHasEditableFields() && NLPopupSelect_isLoadingOrSearching())
        {
            nextFieldToOpenSpanId = spn.id;
            return false;
        }

        
        var nlef = getCurrentListEditField();
        if(nlef != null)
        {
            
            if(spn != null && nlef.getAllowBatchUpdate() && nlef.getColumnIndex() == getColumnFromId(spn.id) && (getEventCtrlKey(evnt) || getEventShiftKey(evnt)))
            {
				handleBatchingAfterClick(evnt, nlef, spn);
            }
            else
            {
                nlef.closeAndUpdate(evnt);
            }
        }
        
        if(spn!=null && !bInBatchUpdate)
        {
            nlef = getListEditFieldFromId(spn.id);
            if(nlef != null && !nlef.isopen)
            {
                
                if (typeof listEditFieldBeforeShowField == "function")
                {
                    if (!listEditFieldBeforeShowField(nlef, spn))
                        return;
                }
                nlef.setSpanAndDisplay(spn);
            }
        }
    }
}

        function isInCalendarInlineDIV(elem) {

            if ((elem != null) && (typeof elem != 'undefined')) {
                var calendarDiv = document.getElementById('CalendarInlineDIV');

                if ((calendarDiv != null) && typeof calendarDiv != 'undefined') {

                    if ((typeof elem.className != 'undefined')) {

                        if (elem.className.indexOf("BlueSel") >= 0)
                            return false;
                        if (elem.className.indexOf("iArrow") == 0)
                            return true;
                    }

                    var node = elem.parentNode;
                    while ((node != null) && (typeof node != 'undefined')) {
                        if (node == calendarDiv) {
                            return true;
                        }
                        node = node.parentNode;
                    }
                }
            }

            return false;

        }


function statusTypesMatch(nlef,spn,bIsControlKey)
{
	var newNodeValue = trim(spn.firstChild.nodeValue);
	var currentBatchValue = trim(nlef.currentValue);
	if(newNodeValue != null)
	{
		newNodeValue = newNodeValue.substring(0,newNodeValue.indexOf("-"));
		currentBatchValue = currentBatchValue.substring(0,currentBatchValue.indexOf("-"));
	}
	var allowBatch = (newNodeValue == currentBatchValue);
	if(!allowBatch && bIsControlKey)
		displayEntityStatusBatchAlert();
	return allowBatch;
}

function displayEntityStatusBatchAlert()
{
	alert("All status fields in your batch update must be of the same type.");
}

function handleBatchingAfterClick(evnt, nlef, spn)
{
	
	if(spanIsInBatchMode(spn))
		return;

	if(getEventCtrlKey(evnt))
	{
		
		if(nlef.fieldname == 'entitystatus' && !statusTypesMatch(nlef,spn,true))
			return false;
		if(!bInBatchUpdate)
			spansInBatch[nlef.getRowIndex()] = nlef.span.id;
		spansInBatch[getRowId(spn)] = spn.id;
	}
	else  
	{
		var bSetAtLeastOneCell = false;
		clearSpansInBatch(nlef);
		if(!bInBatchUpdate)
			spansInBatch[nlef.getRowIndex()] = nlef.span.id;
		var masterRow = nlef.getRowIndex();
		var childRow = getRowId(spn);
		if(masterRow > childRow)
		{
			var tmp = masterRow-1;
			masterRow = childRow-1;
			childRow = tmp;
		}
		for(var i = masterRow+1; i<=childRow; i++)
		{
			var spnId = nlef.baseId+"_"+i+"_"+nlef.getColumnIndex();
			
			if(nlef.fieldname == 'entitystatus' && !statusTypesMatch(nlef,document.getElementById(spnId),false))
				continue;
			spansInBatch[i] = spnId;
			bSetAtLeastOneCell = true;
		}
		
		if(!bSetAtLeastOneCell)
		{
			if(nlef.fieldname == 'entitystatus')
				displayEntityStatusBatchAlert();
			return false;
		}
	}
	setAllBatchClassNames();
	bInBatchUpdate = true;
}

function spanIsInBatchMode(span)
{
	return span.parentNode.className.substring(0,5) == 'batch';
}

function setEditableCellBatchClass(nlef)
{
	if(spanIsInBatchMode(nlef.span))
		return;
	nlef.span.parentNode.className = getSingleBatchClassName(nlef.span);
}


function listEditFieldOnKeyDown(evnt)
{
	var keyCode = getEventKeypress(evnt), nlef;

	
	if( (keyCode == 8 || keyCode == 46) && bInBatchUpdate && getEventTargetType(evnt) != 'text' )
	{
		nlef = getCurrentListEditField();
		if(nlef != null)
			delete_xlist_record(nlef.span.getAttribute("rec_key"), nlef.baseId);
        
		setEventPreventDefault(evnt);
	}
    
    else if(keyCode == 9 || keyCode == 13 )
    {
        
        if(getEventKeypress(evnt) == 13 && getEventTargetType(evnt) == 'textarea')
            return true;

        nlef = getCurrentListEditField();
        if(nlef != null && !nlef.isPopupSelect)
        {
            openNextEditField(nlef, evnt);
            
            setEventPreventDefault(evnt);
        }
    }
    else if(keyCode == 90 && getEventCtrlKey(evnt))
    {
        nlef = getCurrentListEditField();
        if(nlef != null && nlef.span.undoValue != null)
            nlef.doUndo(false)
    }
    
    else if(getCurrentListEditField() == null && getEventAltKey(evnt))
    {
        
        if( keyCode == 81 )
            focusFirstInputField(null);
		
        else if( keyCode == 88 && !bInBatchUpdate )
        {
            var spn = document.getElementById("lstinln_0_0");
            if(spn != null)
            {
				nlef = getListEditFieldFromId(spn.id);
				if(nlef != null && !nlef.isopen)
					nlef.setSpanAndDisplay(spn);
			}
        }
    }
    
    else if(keyCode == 27)  
    {
        nlef = getCurrentListEditField();
		if(nlef != null)
			nlef.closeAndUpdate(evnt);
    }
	
	else if (keyCode == 32) 
    {
        nlef = getCurrentListEditField();
        if(nlef != null && nlef.fieldtype == 'checkbox')
		{
        	if (nlef.input)
            	NLCheckboxOnClick(nlef.input.parentNode);
        }
    }

}



function getCurrentListEditField()
{
    var listEditDiv = getCurrentListEditFieldDiv();
    return listEditDiv == null ? null : getListEditField(listEditDiv.baseId, listEditDiv.columnIndex);
}


function getExtremePopupField()
{
    var nlef = getCurrentListEditField();
    if(nlef != null)
        return nlef.selecthidden;
    else
        return null;
}


function getExtremePopupDisplayField()
{
    var nlef = getCurrentListEditField();
    if(nlef != null)
        return nlef.input;
    else
        return null;
}



NLExtremeEditField.prototype.currentSiblingColumnIndex = function NLExtremeEditField_currentSiblingColumnIndex(fieldName)
{
    var arry = listEditFields[this.baseId];
    for(var i=0; i<arry.length; i++)                                                             // >
    {
        if(arry[i].fieldname == fieldName)
            return i;
    }
    return -1;
};

NLExtremeEditField.prototype.getSiblingColumnValue = function NLExtremeEditField_getSiblingColumnValue(columnIndex)
{
    var spn = getSpanForEdit(this.baseId, this.getRowIndex(), columnIndex);
    if(spn != null)
        return spn.innerHTML;
    else
        return null;
};

NLExtremeEditField.prototype.setSiblingColumnValue = function NLExtremeEditField_setSiblingColumnValue(columnIndex, sValue, bIncludeForUpdate)
{
    var field = getListEditField(this.baseId, columnIndex);

    if(field.fieldtype == "currency" || field.fieldtype == "currency2")
        sValue = format_currency(sValue);
    if(bIncludeForUpdate)
        this.addExtraFieldValuePair(field.fieldname,sValue);

    var spn = getSpanForEdit(this.baseId, this.getRowIndex(), columnIndex);
    if(spn != null)
    {
        if (field.fieldtype != 'select')
        {
            
            var hidSpan = getInvisibleSpanForColumn(this.baseId, columnIndex, this.getFieldMutatorId());
            var hidInput = hidSpan.firstChild;

            if (isNLNumericOrCurrencyDisplayField(hidInput))
            {
                sValue = NLNumberToString(sValue);
            }
        }

        spn.innerHTML = sValue;
    }
};

NLExtremeEditField.prototype.addExtraFieldValuePair = function NLExtremeEditField_addExtraFieldValuePair(sFieldName, sValue)
{
    this.sExtraFieldValuePairs = (this.sExtraFieldValuePairs == null ? "" : this.sExtraFieldValuePairs+",") + sFieldName + ":" + sValue;
};

function pageHasEditableFields()
{
    for(var i in listEditFields)
        return true;
    return false;
};


function getListEditField(base, column)
{
    var arry = listEditFields[base];
    if(arry != null && arry.length>0)
        return arry[column];
    else
        return null;
}

function getListEditFieldFromId(spanId)
{
    var base = getListEditFieldBaseId(spanId);
    var col = getColumnFromId(spanId);
    return getListEditField(base, col);
}

function getListEditFieldBaseId(spanId)
{
    return spanId.substring(0,spanId.indexOf("_"));
}


function getCurrentListEditFieldDiv()
{
    return document.getElementById('listeditfield_div');
}



function getSpanForEdit(baseId, row, column)
{
    return document.getElementById(baseId+"_"+row+"_"+column);
}



function openNextEditField(listEditField, evnt)
{
    var baseId = listEditField.baseId;
	var keyCode = getEventKeypress(evnt);
	var bShiftKey = getEventShiftKey(evnt);
	var nextColumn =  keyCode== 9  ? (bShiftKey ? listEditField.columnIndex-1 : listEditField.columnIndex+1) : listEditField.columnIndex;
    var nextRow = keyCode == 13 ? (bShiftKey ? listEditField.getRowIndex()-1 : listEditField.getRowIndex()+1) : listEditField.getRowIndex();
    if(!listEditField.closeAndUpdate(evnt)) return;
    var spn = getSpanForEdit(baseId, nextRow, nextColumn);
	if(spn == null)
    {
        nextColumn = keyCode == 9  ? (bShiftKey && nextColumn<0 ? listEditFields[baseId].length-1 : 0) : nextColumn;
        nextRow = bShiftKey ? nextRow-1 : nextRow+1;
        spn = getSpanForEdit(baseId, nextRow, nextColumn);
    }
    listEditField = getListEditField(baseId, nextColumn);
    if(spn != null && listEditField != null)
        listEditField.setSpanAndDisplay(spn);
}


function autoClosePopupSelect()
{
    setTimeout("_autoClosePopupSelect();",10);
}
function _autoClosePopupSelect()
{
    var listEditField = getCurrentListEditField(), spn;
    if(listEditField != null)
    {
        var baseId = listEditField.baseId;
        if(!listEditField.closeAndUpdate())
            return;

        
        if( nextFieldToOpenSpanId != null && !bInBatchUpdate)
        {
            var nlef = getListEditFieldFromId(nextFieldToOpenSpanId);
            spn = document.getElementById(nextFieldToOpenSpanId);
            if(spn != null && nlef != null && !nlef.isopen)
                nlef.setSpanAndDisplay(spn);
        }
        else
        {
            var nextColumn = listEditField.columnIndex+1;
            var nextRow = nextColumn >= listEditFields[baseId].length ? listEditField.getRowIndex()+1 : listEditField.getRowIndex();
            if(nextColumn >= listEditFields[baseId].length)
                nextColumn = 0;
            spn = getSpanForEdit(baseId, nextRow, nextColumn);
            listEditField = getListEditField(baseId, nextColumn);
            if(spn != null && listEditField != null)
                listEditField.setSpanAndDisplay(spn);
        }
    }
    nextFieldToOpenSpanId = null;
}


function setAllBatchClassNames()
{
	var nlef = getCurrentListEditField();
	var currentEditFieldRow = nlef.getRowIndex();
	var newBatchClass = "";
	var span = null;
	var i = 0;
	for(var j in spansInBatch)
	{
		i = Number(j);
		
		if(spansInBatch[i] == null)
			continue;

		span = document.getElementById(spansInBatch[i]);
		resetBatchClass(span);
		
		if( (i==(currentEditFieldRow+1)) || (i>0 && spansInBatch[i-1] != null))
		{
			newBatchClass = 'bot';
			
			if( (i==(currentEditFieldRow-1)) || (spansInBatch.length > (i+1) && spansInBatch[i+1] != null) )
				newBatchClass = 'mid';
		}
		else
		{
			newBatchClass = 'top';
			
			if( (i!=(currentEditFieldRow-1)) && (spansInBatch.length <= (i+1) || spansInBatch[i+1] == null))
				newBatchClass = 'uni';
		}
		span.parentNode.className = 'batch' + span.parentNode.className + newBatchClass;
	}
}


function getColumnFromId(id)
{
    return id.substring(id.lastIndexOf('_')+1,id.length);
}

function getRowFromId(id)
{
    return id.substring(id.indexOf('_')+1,id.lastIndexOf('_'));
}


function getRowId(node)
{
	
	return getParentTD(node).parentNode.rowIndex - 1;
}



function getParentTD(node)
{
	while(node.parentNode != null && node.parentNode.nodeName != "TD")
		node = node.parentNode;
	return node.parentNode;
}


function NLExtremeEditField(column, sStandardField, fieldtype, bIsMandatory, sValidateScript, sPostValidateScript)
{
	this.span = null;
    this.baseId = null;
    this.columnIndex = column;
    this.fieldtype = fieldtype;
    this.ismandatory = bIsMandatory;
    this.fieldname = sStandardField;
    this.validate = new Function(sValidateScript != null && sValidateScript.length > 0 ? sValidateScript + " return true;" : "return true;") ;
    this.postValidateScript = sPostValidateScript != null ? new Function(sPostValidateScript + "; return true;") : null;
    this.isopen = false;
    this.bAllowBatch = true;
	this.applyUndo = false;
	this.fieldMutatorId = null;
    this.isPopupSelect = false;

	
	this.bIsDynamicTextArea = false;
	this.bIsHtmlTextArea = false;
	this.iMaxTextAreaChars = 4000;
	this.sTableAndColumnName = null;
	this.isLoadingTextArea = false;

    this.slaveFieldName = null;
    this.slaveFieldColumn = null;
    this.slaveFieldValue = null;
    this.hasSlave = false;
    this.keyIsString = true;

    
    this.alignClass = null;

    
    this.sBackendClass = null;
    this.sExtraBackendParam = null;

    
    this.sExtraFieldValuePairs = null;

    
    this.bResetDivsOnClose = true;
}



NLExtremeEditField.prototype.loadTextAreaContent = function NLExtremeEditField_loadTextAreaContent()
{
    
	if(this.span.hasBeenLoaded == 'T')
	{
		this.isLoadingTextArea = true;
		this.currentValue = this.span.nonTruncValue;
		this.input.value = this.span.nonTruncValue;
		this.isLoadingTextArea = false;
	}
	else
	{
        this.initExtraBackendParameter();
		this.isLoadingTextArea = true;
		this.input.value = "Loading Text...";
		var serverUrl = "/app/common/extreme/dynamiclisteditor.nl?loadtextarea=T&rp="+this.sTableAndColumnName+"&x_key="+this.span.getAttribute("rec_key");
        if(this.sExtraBackendParam != null)
            serverUrl += "&x_extra="+this.sExtraBackendParam;
		sendRequestToFrame(serverUrl, "extreme_textarea");
        
	}
};

NLExtremeEditField.prototype.setFieldMutatorId = function NLExtremeEditField_setFieldMutatorId(sAttributeName)
{
	this.fieldMutatorId = sAttributeName;
};

NLExtremeEditField.prototype.setIsPopupSelect = function NLExtremeEditField_setIsPopupSelect(bIsPopup)
{
    this.isPopupSelect = bIsPopup;
};

NLExtremeEditField.prototype.setSlaveField = function NLExtremeEditField_setSlaveField(sSlaveFieldName, sSlaveColumn)
{
    if(sSlaveFieldName!=null && sSlaveFieldName.length>0)
    {
        this.slaveFieldName = sSlaveFieldName;
        this.slaveFieldColumn = sSlaveColumn;
        this.hasSlave = true;
    }
};

NLExtremeEditField.prototype.setKeyIsString = function NLExtremeEditField_setKeyIsString(bKeyIsString)
{
    this.keyIsString = bKeyIsString;
};

NLExtremeEditField.prototype.setIsDynamicTextArea = function NLExtremeEditField_setIsDynamicTextArea(maxTextAreaChars, tableAndColumnName)
{
	this.bIsDynamicTextArea = true;
	this.iMaxTextAreaChars = maxTextAreaChars;
	this.sTableAndColumnName = tableAndColumnName;
};

NLExtremeEditField.prototype.setIsHtmlTextArea = function NLExtremeEditField_setIsHtmlTextArea(isHtml)
{
	this.bIsHtmlTextArea = isHtml;
};


NLExtremeEditField.prototype.getFieldMutatorId = function NLExtremeEditField_getFieldMutatorId()
{
	if(this.fieldMutatorId != null && this.span.getAttribute(this.fieldMutatorId))
		return this.span.getAttribute(this.fieldMutatorId);
	else
		return "";
};

NLExtremeEditField.prototype.setResetDivs = function NLExtremeEditField_setResetDivs(bResetDivs)
{
	this.bResetDivsOnClose = bResetDivs;
};

NLExtremeEditField.prototype.setAllowBatchUpdate = function NLExtremeEditField_setAllowBatchUpdate(bAllowBatch)
{
    this.bAllowBatch = bAllowBatch;
};

NLExtremeEditField.prototype.getAllowBatchUpdate = function NLExtremeEditField_getAllowBatchUpdate()
{
    return this.bAllowBatch;
};

NLExtremeEditField.prototype.getColumnIndex = function NLExtremeEditField_getColumnIndex()
{
    return this.columnIndex;
};

NLExtremeEditField.prototype.getRowIndex = function NLExtremeEditField_getRowIndex()
{
    return this.rowIndex;
};


NLExtremeEditField.prototype.closeAndUpdate = function NLExtremeEditField_closeAndUpdate(evnt)
{
    var inputElement = this.input;

    
    if(this.ismandatory && trim(inputElement.value).length<1)
    {
        return this.displayCloseAlert('Please enter a value for this mandatory field.', evnt);
    }
    
    else if(this.fieldtype != "select" && !inputElement.validate())
	{
        return this.displayCloseAlert(null);
    }
    else if(this.bIsDynamicTextArea && this.isLoadingTextArea)
	{
		 return this.displayCloseAlert('The content for this text area is still loading...', evnt);
	}
	
    else
    {
        
        if(this.postValidateScript != null && this.fieldHasChanged())
            this.postValidateScript();

		this.dbval = this.fieldtype != "checkbox" ? inputElement.value : inputElement.checked ? "Yes" : "No";
        this.displayval = this.dbval;
        if (isNumericField(inputElement) ||isCurrencyField(inputElement) )
        {
            this.dbval = NLStringToNumber(this.displayval);
            getNLNumericOrCurrencyValueField(inputElement).value = this.dbval;
        }

		
		if(this.fieldtype == "select")
		{
			
			this.dbval = getSelectValue(this.getSelectField());
			if(!this.isPopupSelect)
			    this.displayval = getSelectText(this.getSelectField());
            this.close();
		}
		else if(this.fieldtype == "checkbox")
		{
            this.close();
			
			inputElement.value = this.dbval;
			
			this.dbval = this.dbval == "Yes" ? "T" : "F";
		}
		else if(this.fieldtype == "email")
		{
            this.close();
			showHideEmailIcon(this.span, this.displayval);
		}
        else
        {
            this.close();
        }
		this.sendBackendRequest();
		clearSpansInBatch(this);
		return true;
	}
};

NLExtremeEditField.prototype.displayCloseAlert = function NLExtremeEditField_displayCloseAlert(sAlert, evnt)
{
	if(sAlert != null)
		alert(sAlert);
	this.setFocus();
	setEventPreventDefault(evnt);      
	return false;
};


function showHideEmailIcon(span, newValue)
{
	
	var anchor =  span.previousSibling.previousSibling;
	if(anchor != null && anchor.nodeName == "A")
	{
		if(newValue.length > 5)
		{
		   anchor.style.visibility = "visible";
		   anchor.href = "mailto:"+newValue;
		}
		else
		{
			anchor.style.visibility = "hidden";
			anchor.href = "#";
		}
	 }
}


NLExtremeEditField.prototype.close = function NLExtremeEditField_close()
{
		resetBatchClass(this.span);
        
        this.span.removeChild(this.div);
        var emptySpan = document.createElement("span");
        emptySpan.innerHTML = " ";
        this.swapHiddenWidthHolderSpans(emptySpan);

        
        if(this.alignClass != null)
            getParentTD(this.span).className = this.alignClass;

        
		var displayText = this.textAreaIsTruncated(this.displayval) ? this.displayval.substring(0,this.iMaxTextAreaChars)+'(more...)' : this.displayval;
        if(this.bIsHtmlTextArea)
        {
            this.span.innerHTML = displayText;
        }
        else
        {
            
            if(this.isPopupSelect && !this.fieldHasChanged())
                displayText = this.currentValue;

            
                var txt = document.createTextNode(displayText);
                this.span.appendChild(txt);
        }

        this.span.style.zIndex = 0;
        this.span.style.display = "";
        this.span.style.width = "";

        
        if(this.bResetDivsOnClose && resetDivSizes)
            resetDivSizes();


        
		var sMutatorKey = this.getFieldMutatorId();

		
        var invisibleDiv = document.getElementById(this.baseId+"_invis_"+this.columnIndex+sMutatorKey);
        invisibleDiv.insertBefore(this.div.firstChild,invisibleDiv.firstChild);

        this.isopen = false;
};


NLExtremeEditField.prototype.updateBatchCellDisplayValues = function NLExtremeEditField_updateBatchCellDisplayValues()
{
	var keys = "";
	var fieldtype = this.fieldtype;
	var bVisited = false;

	if(spansInBatch != null && spansInBatch.length > 0)
	{
	    for(var i=0; i<spansInBatch.length; i++) //>
		{
			if(spansInBatch[i] == null)
				continue;

			var c = document.getElementById(spansInBatch[i]);
			
			if(fieldtype == "email")
				showHideEmailIcon(c, this.displayval);

			
            if(fieldtype == "select")
            {
                c.undoValue = c.getAttribute("ntv_val");
                c.setAttribute("ntv_val", this.dbval);
            }
            else
            {
				c.undoValue = c.firstChild.nodeValue;
			}

			
			c.firstChild.nodeValue = this.displayval;

			if(bVisited)
				keys += ",";
			keys += c.getAttribute("rec_key")+":"+getRowFromId(spansInBatch[i]);
			bVisited = true;
		}
    }
	return keys;
};

function getBatchUpdateKeys()
{
	var keys = "";
	var bVisited = false;

	if(spansInBatch != null && spansInBatch.length > 0)
	{
	    for(var i=0; i<spansInBatch.length; i++) //>
		{
			if(spansInBatch[i] == null)
				continue;

			var c = document.getElementById(spansInBatch[i]);
			if(bVisited)
				keys += ",";
			keys += c.getAttribute("rec_key")+":"+spansInBatch[i];
			bVisited = true;
		}
	}
	return keys;
}


NLExtremeEditField.prototype.fieldHasChanged = function NLExtremeEditField_fieldHasChanged()
{
    
    if(this.fieldtype == "select")
        return this.selectNativeValue != this.dbval;
    else
        return trim(this.currentValue) != trim(this.input.value);
};

NLExtremeEditField.prototype.initExtraBackendParameter = function NLExtremeEditField_initExtraBackendParameter()
{
    if(this.sExtraBackendParam == null)
        this.sExtraBackendParam = document.getElementById(this.baseId+"_xextraparams").value;
};


var lastFieldEdited = null;


NLExtremeEditField.prototype.sendBackendRequest = function NLExtremeEditField_sendBackendRequest()
{
	var runUpdate = this.fieldHasChanged();

    if(runUpdate || this.applyUndo)
    {
        
        if(this.bIsDynamicTextArea)
            this.span.nonTruncValue = this.dbval;

        
        this.setSlaveValues();


        
        if(this.sBackendClass == null)
            this.sBackendClass = document.getElementById(this.baseId+"_xclass").value;
        
        this.initExtraBackendParameter();

        
        var updateForm = this.constructFormForPost();
        document.body.appendChild(updateForm);
        updateForm.submit();
        document.body.removeChild(updateForm);

        
        if(this.fieldtype == "select")
        {
            this.span.undoValue = this.selectNativeValue;
            
            this.span.ntv_val = this.dbval;
        }
        else
        {
            this.span.undoValue = this.currentValue;
        }
        this.applyUndo = false;
        
        lastFieldEdited = this.span.id;
    }
    
};

function createAndAppendHiddenField(form, name, value)
{
    var input = document.createElement("input");
    input.setAttribute('type', 'hidden');
    input.setAttribute('name', name);
    input.setAttribute('value', value);
    form.appendChild(input);
}


NLExtremeEditField.prototype.constructFormForPost = function NLExtremeEditField_constructFormForPost()
{
    var form = document.createElement("FORM");
    form.method = "POST";
    form.target = "extreme_list_commands";
    form.action = "/app/common/extreme/dynamiclisteditor.nl";
    form.name = "dynamic_xlist_form";

	
    var keys;
    if(bInBatchUpdate)
    {
        keys = this.updateBatchCellDisplayValues();
        createAndAppendHiddenField(form, "batch", "T");
        createAndAppendHiddenField(form, "batchlist", this.baseId);
        createAndAppendHiddenField(form, "batchcolumn", this.getColumnIndex());
    }
    else
    {
        keys = this.span.getAttribute("rec_key");
    }

    
    createAndAppendHiddenField(form, "_executexlist", "T");
    createAndAppendHiddenField(form, "rp", this.fieldname);
    createAndAppendHiddenField(form, "x_key", keys);
    createAndAppendHiddenField(form, "newval", this.dbval);
    createAndAppendHiddenField(form, "back_class", this.sBackendClass);

    
    if(this.hasSlave && this.slaveFieldValue != null)
    {
        createAndAppendHiddenField(form, "slvrp", this.slaveFieldName);
        createAndAppendHiddenField(form, "slvval", this.slaveFieldValue);
        if(this.slaveFieldColumn>-1)
        {
            var slaveSpan = getSpanForEdit(this.baseId, this.rowIndex, this.slaveFieldColumn);
            slaveSpan.undoValue = slaveSpan.firstChild.nodeValue;
            slaveSpan.firstChild.nodeValue = this.slaveFieldValue;
        }
    }

    
    if(this.sExtraBackendParam != null && this.sExtraBackendParam.length>0)
        createAndAppendHiddenField(form, "x_extra", this.sExtraBackendParam);

    
    if(this.sExtraFieldValuePairs != null)
        createAndAppendHiddenField(form, "x_fldvalpairs", this.sExtraFieldValuePairs);
    this.sExtraFieldValuePairs = null;

    return form;
};



NLExtremeEditField.prototype.setSlaveValues = function NLExtremeEditField_setSlaveValues()
{
	if(this.hasSlave)
	{
        
        var sArrayIndex = !isIE && !this.keyIsString ? (1000+parseInt(this.dbval)) : this.dbval;
		var evalFunc = "xsync"+this.columnIndex+"('"+ sArrayIndex +"');";
		this.slaveFieldValue = eval(evalFunc);
	}
};


NLExtremeEditField.prototype.setSpanAndDisplay = function NLExtremeEditField_setSpanAndDisplay(span)
{
    
    if(getCurrentListEditFieldDiv() != null)
        return;
    this.span = span;
    this.span.style.display = "block";
    this.span.style.width = "100%";
    this.baseId = getListEditFieldBaseId(span.id);
    this.span.style.zIndex = 1;

    
    if(this.listIsInPortlet == null)
        this.listIsInPortlet = document.getElementById(this.baseId+"_xisinportlet").value == "T";

    
    if(span.innerHTML == '&nbsp;' )
        this.currentValue = "";
    else if(this.bIsHtmlTextArea || span.firstChild.nodeValue == null)
        this.currentValue = trim(span.innerHTML);
    else
        this.currentValue = trim(span.firstChild.nodeValue);

    if(this.fieldtype == "email" && this.currentValue.length < 2)
    {
        this.currentValue = "";
    }
    else if(this.fieldtype == "select")
    {
        
        this.selectNativeValue = span.getAttribute('ntv_val');
		
        if(this.selectNativeValue == null || this.selectNativeValue == "0")
            this.selectNativeValue = "";
    }
    this.displayInputFieldDiv();
};



NLExtremeEditField.prototype.doUndo = function NLExtremeEditField_doUndo(error)
{
    if(this.fieldtype == "select")
    {
        
        setSelectValue(this.getSelectField(), this.span.undoValue);
    }
    else if(this.currentValue != this.span.undoValue)
    {
        if (this.fieldtype == "checkbox")
        {
            this.setCheckboxValue(this.span.undoValue);
        }
        else
        {
            this.currentValue = this.span.undoValue;
            this.input.value = this.currentValue;
        }
    }
    
    if(!error)
    {
        this.applyUndo = true;
    }
};



NLExtremeEditField.prototype.setCheckboxValue = function setCheckboxValue(value)
{
    if (this.fieldtype == "checkbox")
    {
        if (typeof(value) != 'string')
        {
            value = value ? 'Yes' : 'No';
        }
        this.currentValue = value;
        this.input.value = this.currentValue;
        this.input.checked = this.input.value == 'Yes';
        var className = this.span.className;
        if (this.input.checked)
        {
            this.span.className = className.replace('_unck', '_ck');
        }
        else
        {
            this.span.className = className.replace('_ck', '_unck');
        }
    }
};



NLExtremeEditField.prototype.displayInputFieldDiv = function NLExtremeEditField_displayInputFieldDiv()
{
    this.isopen = true;
    this.rowIndex = getRowId(this.span);
    this.div = document.createElement("div");
    this.div.id = "listeditfield_div";
    this.div.columnIndex = this.columnIndex;
    this.div.baseId = this.baseId;
    this.div.className = 'listEditDiv';

    
    var cloneNode = this.span.cloneNode(true);
    this.swapHiddenWidthHolderSpans(cloneNode);

    
    var alignClassName = getParentTD(this.span).className;
    if(alignClassName.substring(alignClassName.length - 2) == "rt")
    {
        this.alignClass = getParentTD(this.span).className;
        getParentTD(this.span).className = alignClassName.substring(0,alignClassName.length - 2);
    }

    
    if(this.bIsDynamicTextArea)
        this.span.errorValue = this.currentValue;

    
	while(this.span.firstChild != null)
        this.span.removeChild(this.span.firstChild);
    this.span.appendChild(this.div);

    
    this.buildEditFieldDiv();
    this.positionInputFieldDiv();

    
    if(this.fieldtype == 'select' && !this.isPopupSelect)
    {
        this.openSelectField();
    }
    else
    {
        
        if(this.fieldtype == 'checkbox')
	        setFormValue(this.input, (this.currentValue == "Yes"));

	    this.setFocus();
    }
};

NLExtremeEditField.prototype.getSelectField = function NLExtremeEditField_getSelectField()
{
    return !bUseNativeDropdowns || this.isPopupSelect ? this.selecthidden : this.input ;
};


NLExtremeEditField.prototype.openSelectField = function NLExtremeEditField_openSelectField()
{
    if(bUseNativeDropdowns)
    {
        setSelectValue(this.getSelectField(),this.selectNativeValue);
        this.getSelectField().focus();

    }
    else
    {
        
        var dd = getDropdown(this.getSelectField());

        
        dd.cancelEventOnEnterKey = true;
        
        dd.handleMouseDown();

        
        if((dd.inpt.offsetWidth + getParentTD(this.span).offsetLeft) > getDocumentWidth() - 10)
            dd.setWidth( (getDocumentWidth() - getParentTD(this.span).offsetLeft ),null);
        setSelectValue(this.getSelectField(),this.selectNativeValue);
        dd.setFocus();
    }
};


NLExtremeEditField.prototype.positionInputFieldDiv = function NLExtremeEditField_positionInputFieldDiv()
{
    
    if(this.fieldtype == "email")
    {
        this.div.parentNode.style.display = "inline-block";
        this.div.style.display = 'inline-block';
        this.div.style.position = 'relative';
        this.div.style.left = findPosX(this.div) - findPosX(this.span) + 18;
        this.div.style.top = findPosY(this.div) - findPosY(this.span) - 18;
    }
    else
    {
        this.div.style.top = findPosY(this.div) - findPosY(this.span) - 2;
    }
};

function getInvisibleSpanElementFromDiv(div)
{
    if(div != null)
    {
        for(var i=0; i < div.childNodes.length; i++)
        {
            if(div.childNodes[i].nodeName == "SPAN")
                return div.childNodes[i];
        }
    }
    return null;
}

function getInvisibleSpanForColumn(baseId, columnIdx, mutatorKey)
{
    var invisibleDiv = document.getElementById(baseId + "_invis_" + columnIdx + mutatorKey);
    return getInvisibleSpanElementFromDiv(invisibleDiv);
}

function getInputFieldForSelect(innerSpan)
{
    if(innerSpan !=null)
    {
        if(bUseNativeDropdowns)
        {
            var selects = innerSpan.getElementsByTagName("SELECT");
            return selects.length > 0 ? selects[0] : null;
        }
        else
        {
            for(var i=0; i < innerSpan.childNodes.length; i++)
            {
                if( innerSpan.childNodes[i].nodeName == "INPUT" )
                    return innerSpan.childNodes[i];
            }
        }
    }
    return null;
}

function getHiddenInputFieldForSelect(innerSpan)
{
    var dd = getDropdown(innerSpan);
    if (dd)
        return dd.getHiddenInput();
    else
    {
	 	var inputs = innerSpan.getElementsByTagName('INPUT');
		for ( var i = 0; i < inputs.length; i++ )
		{
		 	if ( inputs[i].type == 'hidden' && inputs[i].id != null && inputs[i].id.indexOf('hddn_') == 0 )
			 	return inputs[i];
		}
    }
    return null;
}


NLExtremeEditField.prototype.buildEditFieldDiv = function NLExtremeEditField_buildEditFieldDiv()
{
	
    var innerSpan = getInvisibleSpanForColumn(this.baseId, this.columnIndex, this.getFieldMutatorId());
    this.div.appendChild(innerSpan);

    
    if(this.fieldtype == "select")
    {
        if(this.isPopupSelect)
        {
            
            this.selecthidden = getHiddenInputFieldForSelect(innerSpan);
            
            this.input = NLPopupSelect_getDisplayFieldByValueInput(this.selecthidden);
            this.input.value = this.currentValue;
            this.selecthidden.value = this.selectNativeValue;
        }
        else
        {
            
            if(bUseNativeDropdowns)
                this.input = getInputFieldForSelect(innerSpan);
            else
            {
                var sel = getDropdown(innerSpan);

                
                if (this.listIsInPortlet && sel.bInitialize)
                    sel.initializeElements();

                
                this.input = sel.getInput();

                
                this.selecthidden = sel.getHiddenInput();
                this.selecthidden.onchange = null;
                this.selecthidden.onfocus = null;
            }
        }
    }
    else
    {
        innerSpan.style.position = "relative";
        // the input field should be the first child inside the inner span
        this.input = innerSpan.firstChild;

        // we want very different behavior than the basic NLField event handlers.  We disable any event attributes that have been set
        // for this field, and define our own in the validate() function that was passed in to the constructor (from NLField)
        this.input.onclick = null;
        this.input.onblur = null;
        this.input.onchange = null;
        this.input.validate = this.validate;
        // Input style attributes
        // we drop the width of email fields by 5% because they contain an icon on the left side

        // in FF, relatively positioned input fields only show one character at a time when their width attribute is set to 100%
        // so we set it to 95% instead... it's almost impossible to tell the difference on the screen.
        if(this.fieldtype != "checkbox")
            this.input.style.width = this.fieldtype == "email" ? "95%" : this.fieldtype == "date" ? "80%" : isIE ? "100%" : "95%";

        // if this is a text area, we have to grab it's value from teh database since it's
           // current value could be the truncated version, or could contain special characters that don't live happily
        // in HTML.  (new lines for instance)
        if( this.bIsDynamicTextArea )
            this.loadTextAreaContent();
        else
            this.input.value = this.currentValue;
    }
};

NLExtremeEditField.prototype.textAreaIsTruncated = function NLExtremeEditField_textAreaIsTruncated(sText)
{
	return this.bIsDynamicTextArea && sText != null && sText.length >= (this.iMaxTextAreaChars-2);
};

/**
 *  Set focus and select the current input object
 */
NLExtremeEditField.prototype.setFocus = function NLExtremeEditField_setFocus()
{
    this.input.focus();
    if(this.fieldtype != "textarea" && !this.isPopupSelect)
        this.input.select();
};


/**
 *  Called when an exception occurs on the backend that prevents the last batch update from succeeding.  This will revert the
 *  changes in the batch that failed, and refocus one of the failed fields for edit again...
 */
function undoLastExtremeBatchEditErrors(batchErrors)
{
	// if the user has already moved on to another field, we'll have to close it
	var nlef = getCurrentListEditField();
	if(nlef != null)
		nlef.closeAndUpdate();

	var dd = null;
	// undo the changes to the batched cells and add them to the "new" error fixing batch
	for(var i=0; i<batchErrors.length; i++)         //>
	{
		var span = document.getElementById(batchErrors[i]);
		nlef = getListEditFieldFromId(batchErrors[i]);

        // update the native select value, which is the option value for the select,
        // which can differe from the display value.
		if(nlef.fieldtype == "select")
			span.setAttribute("ntv_val", span.undoValue);

        // we'll make the first field editable, and the rest will batch off of it
		if(i==0)
		{
            nlef.setSpanAndDisplay(span);
            nlef.doUndo(true);
            nlef.setFocus();
            spansInBatch[nlef.getRowIndex()] = nlef.span.id;
        }
        else
        {
			spansInBatch[getRowId(span)] = span.id;
			setAllBatchClassNames();

            
			if(nlef.fieldtype == "select")
			{
			    span.firstChild.nodeValue = getlisttext(nlef.getSelectField(), span.undoValue, false);
			}
			else
			{
				span.firstChild.nodeValue = span.undoValue;
			}

        }
	}
}

/**
 *  Called when an exception occurs on the backend that prevents the last update from succeeding.  This will revert the
 *  change in the list, and refocus the field on the page.
 */
function undoLastExtremeEdit(sError)
{
	// if the user has already moved on to another field, we'll have to close it
	var nlef = getCurrentListEditField();
	if(nlef != null)
	{
        // if an error occurred while we were trying to load up the data for a dynamic text area, there
           // isn't much we can do other than tell the user and close the field without
        // changing any values
		if(nlef.bIsDynamicTextArea && nlef.isLoadingTextArea)
		{
			alert("An error occurred while we were trying to load data into this text area.");
			nlef.displayval = nlef.span.errorValue;
			nlef.close();
			return;
		}
		else
		{
			nlef.closeAndUpdate();
		}
	}
    if(lastFieldEdited != null)
    {
        // now open up the last field they edited, undo the change (on the UI side) and give the field focus
		var span = document.getElementById(lastFieldEdited);
		nlef = getListEditFieldFromId(lastFieldEdited);
        // update the native select value, which is the option value for the select,
        // which can differe from the display value.
		if(nlef.fieldtype == "select")
			span.setAttribute("ntv_val", span.undoValue);
        nlef.setSpanAndDisplay(span);
        nlef.doUndo(true);
        nlef.setFocus();
    }
}

var lastDeletedRow = null;
function delete_xlist_record(recordId, groupingId)
{
	var sConfirmMessage = "Are you sure you want to delete this record?";
	var span_id = "spn_EXTREMEOPTIONS_" + recordId + "_" + groupingId;
	var navspan = document.getElementById(span_id);
	if(navspan.getAttribute("_d") != null && navspan.getAttribute("_d").length > 0 && navspan.getAttribute("_d") != "null")
		sConfirmMessage = "Are you sure you want to delete this record - {1}?".replace("{1}",navspan.getAttribute("_d"));

    if(bInBatchUpdate)
	{
		recordId = getBatchUpdateKeys();
		sConfirmMessage = "All selected records will be deleted.  Are you sure you want to continue?";
	}

	if (window.enableDeletionReasonInExtremeList)
	{
		// The pop-up will continue with calling perform_delete_xlist_record and the parameters recordId and groupingId
		var popUpUrl = '/app/accounting/transactions/deletionreason/trandeletionreason.nl?extremelist=T'
		             + '&recordid=' + encodeURIComponent(recordId)
		             + '&groupingid=' + encodeURIComponent(groupingId)
		             + '&isbatch=' + (bInBatchUpdate ? 'T' : 'F')
		             + '&message=' + encodeURIComponent(sConfirmMessage); // encodeURIComponent() to don't mess up the encoding

		nlExtOpenWindow(popUpUrl, 'deletionreasonpopup', 420, 340, this, false, '');
		return false;
	}
	else
	{
    if (confirm(sConfirmMessage))
    {
			perform_delete_xlist_record(recordId, groupingId, bInBatchUpdate);
			return true;
		}
		else
		{
			return false;
		}
	}
}

function perform_delete_xlist_record(recordId, groupingId, isBatch, deletionReason, deletionReasonMemo)
{
	var sBackendClass = document.getElementById(groupingId+"_xclass").value;
	var docLocation = document.getElementById(groupingId+"redirecturl").value;
	var docRefreshScript = document.getElementById(groupingId+"refreshportlet").value;
	var sExtraBackendParam = document.getElementById(groupingId+"_xextraparams").value;

	var serverUrl = "/app/common/extreme/dynamiclisteditor.nl?param_delete=T&x_key="+recordId+"&back_class="+sBackendClass+"&redirecturl="+encodeURIComponent(docLocation)+"&refreshportlet="+docRefreshScript+"&x_extra="+sExtraBackendParam;
	if (deletionReason)
		serverUrl += '&deletionreason=' + encodeURIComponent(deletionReason);
	if (deletionReasonMemo)
		serverUrl += '&deletionreasonmemo=' + encodeURIComponent(deletionReasonMemo); // encodeURIComponent() to don't mess up the encoding
	if (isBatch)
		serverUrl += "&batch=T";
	if (window.appendFormDataToURL)
		serverUrl = appendFormDataToURL(serverUrl);
	sendRequestToFrame(serverUrl, "extreme_list_commands");

	if(!bInBatchUpdate)
		lastDeletedRow = span_id;

	// clear the batch and close the edit field
	var nlef = getCurrentListEditField();
	if(nlef != null)
	nlef.closeAndUpdate();
	clearSpansInBatch(null);
}

function refreshList(sRedirectUrl,sQueryString)
{
	if(window.refreshMe)
		refreshMe();
	else
        getEntryFormDoc('extreme_list_commands').location.replace(sRedirectUrl+'&'+sQueryString);
}

function removeLastDeletedRow()
{
    if(lastDeletedRow != null)
    {
        lastDeletedRow.parentNode.parentNode.deleteRow(lastDeletedRow.rowIndex);
        lastDeletedRow = null;
    }
}

function showXListMenu(menuName, entityKey,useTimer,groupingId,bAllowDelete,sParentCompanyKey,sSecondAlternateOptionsKey)
{
    try {
        var imageId = "img_" + menuName;
        var menu = eval("options_"+groupingId+"('"+menuName+"', '"+entityKey+"', '"+groupingId+"',"+bAllowDelete+","+(sParentCompanyKey != null?"'"+sParentCompanyKey+"'":"null")+","+(sSecondAlternateOptionsKey != null?"'"+sSecondAlternateOptionsKey+"'":"null")+")");
        if(menu.isOpen)
        {
            menu.close();
            return;
        }
        clearAllMenusExcept('all menus please');
        
        menu.setXandYoverride(27,-14);
        menu.setCloseAction("resetXlistOptionsImage('"+imageId+"',true);");
        menu.setOpenAction("resetXlistOptionsImage('"+imageId+"',false);");
        return menu.showHide(useTimer);
    } catch (e) { }
    // If there's an error, for now just dont show the menu.  This will prevent JS errors on the client
}

function resetXlistOptionsImage(imageId, bUp)
{
    var image = document.getElementById(imageId);
    if(bUp)
        image.src = '/images/nav/listoptionsup.gif?v=2018.1.0';
    else
        image.src = '/images/nav/listoptionsdown.gif?v=2018.1.0';
}

function newOptionsOnMouseOut()
{
	startTimer('EXTREMEOPTIONS');
	clearTimeout(window.rolloverDelay);
}

function newOptionsOnMouseOver(sMenuName, sEntityKey,sGroupingId,bAllowDelete,sParentCompanyKey,sSecondAlternateNewOptionsKey)
{
	clearTimeout(window.rolloverDelay);
	var delay = (window.menusAreOpen ? 0 : 100);
	window.rolloverDelay = setTimeout("showXListMenu('"+sMenuName+"','"+sEntityKey+"',true,'"+sGroupingId+"',"+(bAllowDelete?"true":"false")+","+(sParentCompanyKey!=null?"'"+sParentCompanyKey+"'":"null")+","+(sSecondAlternateNewOptionsKey!=null?"'"+sSecondAlternateNewOptionsKey+"'":"null")+");",delay);
	resetNavMenuTimer('EXTREMEOPTIONS');
}

function replaceOptionsKeys(sAction, entityKey, sAlternateNewOptionsKey, sSecondAlternateNewOptionsKey)
{
    if (entityKey != null)
		sAction = sAction.replace(/-1([\D])?/g,entityKey+'$1');
	sAction = sAction.replace(/-2([\D])/g, nvl(sAlternateNewOptionsKey, -1) + '$1');
	sAction = sAction.replace(/-3([\D])/g, nvl(sSecondAlternateNewOptionsKey, -1) + '$1');

    return sAction;
}

/**
 *  Do our absolute best to get the proper input field for the pop-up calendar to use
 *  when picking/updating dates
 */
function getExtremeCalendarField()
{
    var nlef = getCurrentListEditField();
    if(nlef != null)
        return nlef.input;
    return null;
}

/**
 *  After we reset the quick add form, we must re-disable auto numbering fields if they have "auto" checkboxes that
 *  allow override
 */
function autoFieldsOnClick(fakeFormName)
{
	var fakeForm = document.forms[fakeFormName];
	for(var i=0; i<fakeForm.elements.length; i++)                                                   //>
	{
		if(fakeForm.elements[i].name == 'autoname' || fakeForm.elements[i].name =='autopartnercode')
			fakeForm.elements[i].onclick();
	}
}

function isAutoField(fieldName)
{
    return fieldName == 'autoname' || fieldName == 'autopartnercode';
}

/**
 *  For entity numbering override - there will be auto checkboxes that need to be set back to their original state
 *  after we reset the wuick-add form
 */
function autoFieldsTransferValues(entryFormFrameName, fakeFormName)
{
	var fakeForm = document.forms[fakeFormName];
	var entryFormDoc = getEntryFormDoc(entryFormFrameName);
	var form = entryFormDoc.forms['main_form'];

	for(var i=0; i < fakeForm.elements.length; i++)
	{
		var fieldName = fakeForm.elements[i].name;
		if(fakeForm.elements[i].type == 'checkbox' && isAutoField(fieldName))
			transferCheckboxValues(form.elements[fieldName], fakeForm.elements[fieldName]);
	}
}

function transferCheckboxValues(toField, fromField)
{
	if(toField.checked != fromField.checked)
	{
		toField.checked = fromField.checked;
		if(toField.onclick)
			toField.onclick();
		if(toField.onchange)
			toField.onchange();
	}
}

function transferFieldValues(toField, fromField)
{
	if(fromField.value != null && toField.value != fromField.value)
	{
		toField.value = fromField.value;
	}
}

/**
 * Called after a transaction/record is committed to the database - this refreshes and calls
 * the dynamic script so that the entry form get's the proper dynamic values
 */
function reloadDynamicScript(entryFormFrameName)
{
	if (entryFormFrameName == null)
		entryFormFrameName = "entry_form_frame";
	// we have to reload the dynamic script if there is one on the page because some of the
	// values (tranid for example) must always be up to date. (as well as date fields)
	var entryFormDoc = getEntryFormDoc(entryFormFrameName);
	var dynScript = entryFormDoc.getElementById("script_dynamic");
    if(dynScript != null)
	{
		document.getElementById(entryFormFrameName).contentWindow.NS.form.setInited(false);
		var dynamicScriptUrl = dynScript.src;
		var url = addParamToURL(dynamicScriptUrl, "execdynamic", "T",true);
        var parent = dynScript.parentNode;
        dynScript.parentNode.removeChild(dynScript);
        dynScript = entryFormDoc.createElement("SCRIPT");
        dynScript.type = "text/javascript";
        dynScript.id = "script_dynamic";
        parent.appendChild(dynScript);
		dynScript.src = url;
        // When we execute the dynamic script it will set the NS.form.isInited() flag back to true.
        // This ensures that we don't actually do anything until it completes
	}
}


function specialEventTimeHandling(field)
{
	if( field != null && field.form.elements['formframe']!=null )
	{
		var formname = field.form.elements['formframe'].value+"_formframe";
	    var form = getEntryFormDoc(formname).forms['main_form'];
		var onchangeField = null;
		if(form != null)
		{
			if( field.form.elements['startdate'] != null && field.form.elements['startdate'].value != form.elements['startdate'].value)
			{
				transferFieldValues(form.elements['startdate'], field.form.elements['startdate']);
				onchangeField = 'startdate';
			}
			if( field.form.elements['starttime'] != null && field.form.elements['starttime'].value != form.elements['starttime'].value)
			{
				transferFieldValues(form.elements['starttime'], field.form.elements['starttime']);
				onchangeField = 'starttime';
			}
			if( field.form.elements['endtime'] != null && field.form.elements['endtime'].value != form.elements['endtime'].value)
			{
				transferFieldValues(form.elements['endtime'], field.form.elements['endtime']);
				onchangeField = 'endtime';
			}
			if(form.elements[onchangeField]!=null && form.elements[onchangeField].onchange)
			{
				form.elements[onchangeField].onchange();

                
                if(field.name == 'starttime' && onchangeField == 'starttime')
                    field.form.elements['endtime'].value = form.elements['endtime'].value;
			}
		}
	}
}



function insertNewRow(frameName, formname)
{
	var entryFormFrameName = frameName != null ? frameName+"_formframe" : "entry_form_frame";
	var fakeFormName = formname != null ? formname : "main_form";

	
    if(document.getElementById(entryFormFrameName).contentWindow.NS.form.isInited() != true)
		return;

	var entryFormDoc = getEntryFormDoc(entryFormFrameName);
	var fakeForm = getMainFormForQuickAdd(fakeFormName);
    var form = entryFormDoc.getElementById('main_form');
    var sClassName = fakeForm.elements['xbackendclass'].value;
    var groupingId = fakeForm.elements['groupingid'].value;
	var docLocation = document.getElementById(groupingId+'redirecturl').value;
	var docRefreshScript = document.getElementById(groupingId+'refreshportlet').value;
	var bHasAutoNumberingFields = fakeForm.elements["resetautoflds"].value == "T";

	if(bHasAutoNumberingFields)
		autoFieldsTransferValues(entryFormFrameName, fakeFormName);

    for(var i=0; i < fakeForm.elements.length; i++)
	{
		
		if( fakeForm.elements[i].name == "id" || fakeForm.elements[i].name == "tranid" || fakeForm.elements[i].type == "button" || isAutoField(fakeForm.elements[i].name))
			continue;

		var fieldName = fakeForm.elements[i].name;
		

		
		for(var j=0; j < entryFormDoc.forms.length;j++)
		{
			
			if(entryFormDoc.forms[j].id == "address_form" || entryFormDoc.forms[j].id == "addressbook_form")
				continue;

			if(entryFormDoc.forms[j].elements[fieldName])
			{
				var entryFormField = entryFormDoc.forms[j].elements[fieldName];
				if(entryFormField.type == "checkbox")
					transferCheckboxValues(entryFormField, fakeForm.elements[fieldName]);
				else
					transferFieldValues(entryFormField, fakeForm.elements[fieldName]);
			}
		}
	}

	
	if(form.onsubmit())
	{
		
		if(window.appendFormDataToURL)
			form.action = appendFormDataToURL('/app/common/extreme/dynamiclisteditor.nl?xbackendclass='+sClassName+'&redirecturl='+encodeURIComponent(docLocation));
		else
			form.action = '/app/common/extreme/dynamiclisteditor.nl?xbackendclass='+sClassName+'&refreshportlet='+docRefreshScript+'&formframe='+entryFormFrameName;
		
		form.target = "extreme_list_commands";
        form.submit();
        fakeForm.reset();
		resetNLDropDowns(fakeForm);
		resetNLPopupSelects(fakeForm);
        if(bHasAutoNumberingFields)
            autoFieldsOnClick(fakeFormName);
        focusFirstInputField(fakeForm);

		
		if( document.getElementById(entryFormFrameName).page_reset )
        {
			document.getElementById(entryFormFrameName).page_reset();
		}
		else
		{
            form.reset();
            form.submitted.value = null;
			resetNLDropDowns(form);
			resetNLPopupSelects(form);
        }
        NS.form.setChanged(false);
        return true;
    }
    return false;
}

function focusFirstInputField(form)
{
	if(form == null)
		form = document.forms['main_form'];
	if(form != null)
	{
	    
	    var div = document.getElementById("div__addnew");
	    if(div==null || div.style.display=='none')
	        return false;

		for(var i=0; i<form.elements.length; i++)
		{
			var elem = form.elements[i];
			if(elem.type != "hidden" && elem.type != "button" && elem.type != "checkbox" && !elem.disabled)
			{
				form.elements[i].focus();
				break;
			}
		}
	}
}


function clearSpansInBatch(nlef)
{
	
	if(nlef != null)
		resetBatchClass(nlef.span);

	
    for(var i=0; i<spansInBatch.length; i++)   //>
    {
        if(spansInBatch[i] != null )
            resetBatchClass(document.getElementById(spansInBatch[i]))
    }

    
    spansInBatch = [];
    bInBatchUpdate = false;
}

function resetBatchClass(span)
{
	if(span != null && spanIsInBatchMode(span))
		span.parentNode.className = span.parentNode.className.substring(5,span.parentNode.className.length-3);
}


NLExtremeEditField.prototype.swapHiddenWidthHolderSpans = function NLExtremeEditField_swapHiddenWidthHolderSpans(newSpan)
{
    var hiddenRow = document.getElementById("hrow_"+this.baseId);
    var parentTD = getParentTD(this.span);
    var cellIndex = getCellIndex(parentTD);
    var cell = hiddenRow.cells[cellIndex];
    
    while(cell.firstChild)
        cell.removeChild(cell.firstChild);
    
    if(this.fieldtype == "email")
    {
        var hiddenAnchor = document.createElement("a");
        var hiddenImage = document.createElement("img");
        var txt = document.createTextNode("  ");
        hiddenAnchor.appendChild(hiddenImage);
        hiddenImage.src = "/images/forms/sendemail.gif";
        hiddenImage.alt = "Send Email";
        hiddenImage.width = "13";
        hiddenImage.height = "10";
        hiddenImage.border = "0";
        cell.appendChild(hiddenAnchor);
        cell.appendChild(txt);
    }
    cell.appendChild(newSpan);
};


function getCellIndex(td)
{
    var ci = 0;
    var tr = td.parentNode;
     for (var i = 0; i < tr.cells.length; i++) {
       if (td == tr.cells[i]) {
         ci = i;
       }
     }
     return ci;
}

function showHideQuickAdd()
{
	var div = document.getElementById("div__addnew");
	if(div != null)
	{
		var sPreferenceVal = false;
		if(div.style.display == "none")
		{
			div.style.display = "block";
			sPreferenceVal = true;
			populateEntryFormFrame();

		}
		else
		{
			div.style.display = "none";
		}
		resetDivSizes();
		setQuickAddPreference(sPreferenceVal);
	}
}

var sCurrentEntryFormFrameUrl = null;
function populateEntryFormFrame()
{
    if(getMainFormForQuickAdd('main_form'))
        var sEntryFormUrl = getMainFormForQuickAdd('main_form').elements['quickaddurl'].value;

	
	if(sCurrentEntryFormFrameUrl != sEntryFormUrl)
	{
		sendRequestToFrame(sEntryFormUrl,"entry_form_frame");
		sCurrentEntryFormFrameUrl = sEntryFormUrl;
	}
}

function setQuickAddPreference(bIson)
{
	var serverUrl = "/app/common/extreme/dynamiclisteditor.nl?quickadd=" + (bIson ? "T" : "F");
	sendRequestToFrame(serverUrl, "list");
}

var currentQuickAddPortletId = null;
function togglePortletQuickAdd(elementId, iPortletId, evnt)
{
	
	if(currentQuickAddPortletId != null)
	{
		var currentPortletId = currentQuickAddPortletId;
		hideQuickAdd(currentQuickAddPortletId);
		
		if(currentPortletId == iPortletId)
			return;
	}

	var div = getQuickAddDiv(iPortletId);
	
	if(div == null)
		return;

	var mainform = document.createElement("FORM");
	mainform.action = "";
	mainform.onkeypress = function (event) { if(getEventKeypress(event) == 13) { insertNewRow() }; };
	mainform.name = "main_form";
	mainform.id = "main_form";

	var outerDiv = document.createElement("DIV");
	outerDiv.id = "outerdiv";
	outerDiv.className = "quickadddragger";
	div.style.display = "block";
	mainform.appendChild(div);
	outerDiv.appendChild(mainform);
	document.body.appendChild(outerDiv);
	outerDiv.style.position = "absolute";
	outerDiv.style.zIndex = 1;

	
	positionFloatingPortlet(outerDiv, -(outerDiv.offsetHeight-4));
	focusFirstInputField(mainform);

	populateEntryFormFrame();
	currentQuickAddPortletId = iPortletId;
}

function getQuickAddDiv(iPortletId)
{
	return document.getElementById("quickadd_placeholder_"+iPortletId);
}

function removeCurrentQuickAdd()
{
	if(currentQuickAddPortletId != null)
		hideQuickAdd(currentQuickAddPortletId);
}

function hideQuickAdd(iPortletId)
{
	var div = getQuickAddDiv(iPortletId);
	if(div != null)
		removeQuickAddDiv(div, iPortletId);
}

function removeQuickAddDiv(div, iPortletId)
{
	var span = document.getElementById("qadd_span_"+iPortletId);
	var outerDiv = document.getElementById("outerdiv");
	span.appendChild(div);
	document.body.removeChild(outerDiv);
	div.style.display = "none";
	currentQuickAddPortletId = null;
}


function scrollToRecord(sRecordNum)
{
    try {
		var bodyDiv = document.getElementById("div__body");
		if(bodyDiv != null)
		{
			var rowAnchor = document.getElementById("scrollid" + sRecordNum);
			if(rowAnchor != null)
			{
				bodyDiv.scrollTop = findPosY(rowAnchor) - findPosY(bodyDiv);
			}
		}
    } catch (e) { }
}



function manageOverrideBuckets(nlef)
{
    var currentVal = parseFloat(nlef.input.value);

    
    if(nlef.fieldname == "rangelow")
    {
        var idxMid = nlef.currentSiblingColumnIndex('projectedtotal');
        var idxHigh = nlef.currentSiblingColumnIndex('rangehigh');
        if( idxMid > -1 && (currentVal > parseFloat(nlef.getSiblingColumnValue(idxMid))) )
            nlef.setSiblingColumnValue(idxMid, currentVal, true);
        if( idxHigh > -1 && (currentVal > parseFloat(nlef.getSiblingColumnValue(idxHigh))) )
            nlef.setSiblingColumnValue(idxHigh, currentVal, true);
    }
    
    else if (nlef.fieldname == "projectedtotal")
    {
        var idxLow = nlef.currentSiblingColumnIndex('rangelow');
        var idxHigh = nlef.currentSiblingColumnIndex('rangehigh');
        if( idxLow > -1 && (currentVal < parseFloat(nlef.getSiblingColumnValue(idxLow))) )
            nlef.setSiblingColumnValue(idxLow, currentVal, true);
        if( idxHigh > -1 && (currentVal > parseFloat(nlef.getSiblingColumnValue(idxHigh))) )
            nlef.setSiblingColumnValue(idxHigh, currentVal, true);
    }
    
    else if (nlef.fieldname == "rangehigh")
    {
        var idxLow = nlef.currentSiblingColumnIndex('rangelow');
        var idxMid = nlef.currentSiblingColumnIndex('projectedtotal');
        if( idxLow > -1 && (currentVal < parseFloat(nlef.getSiblingColumnValue(idxLow))) )
            nlef.setSiblingColumnValue(idxLow, currentVal, true);
        if( idxMid > -1 && (currentVal < parseFloat(nlef.getSiblingColumnValue(idxMid))) )
            nlef.setSiblingColumnValue(idxMid, currentVal, true);
    }
}

function getEntryFormDoc(entryFormFrameName)
{
    var entryFormDoc =
    
	    document.getElementById(entryFormFrameName).contentDocument
	
    ;
    return entryFormDoc;
}



function updatePriceLevelDiscounts(nlef, aDiscounts)
{
    var base = NLStringToNumber(nlef.input.value);
    for(var i=0; i < aDiscounts.length; i++)
    {
        var iPriceKey = aDiscounts[i++];
        var disc = parseFloat(aDiscounts[i]);
        var iNewValue = (base*(1+disc/100));
        
        var fieldColumName =  ( iPriceKey == 5 ? "onlineprice" : 'xprc_'+iPriceKey );
        var columnIdx = nlef.currentSiblingColumnIndex( fieldColumName );

        
        if(columnIdx > -1)
            nlef.setSiblingColumnValue(columnIdx, iNewValue, true);
        else
            nlef.addExtraFieldValuePair(fieldColumName, format_currency(iNewValue));
    }
}


function updateCustomerNameColumn(sNewValue)
{
	if(lastFieldEdited != null)
    {
		var nlef = getListEditFieldFromId(lastFieldEdited);
		var columnIdx = nlef.currentSiblingColumnIndex( "entityid" );
        
        if(columnIdx > -1)
            nlef.setSiblingColumnValue(columnIdx, sNewValue, false);
	}
}

function replaceDLEtoggleHtml(sMessage)
{

    setTimeout(function() {
        if(typeof showAlertBox != "undefined")
        {
            toggleDLEButton(false, true);
            showAlertBox("dle_warning", "", sMessage, NLAlertDialog.WARNING);
        }
        else
        {
            var anchor = document.getElementById('dle_header_link');
            anchor.value="F";
            anchor.disabled = true;
            handleOnOffSwitchField(anchor);
            var label = document.getElementById('dle_header_span');
            if (label) label.style.display='none';
            var span = document.getElementById('dle_msg');
            span.innerHTML = sMessage;
        }
    }, 10);

}

function toggleDLEButton(on, visualOnly)
{
    var $dleButton = jQuery("#extreme-list-edit-button");
    if (visualOnly)
    {
        if (on)
        {
            $dleButton.removeClass("toggled-off");
            $dleButton.addClass("toggled-on");
        }
        else
        {
            $dleButton.removeClass("toggled-on");
            $dleButton.addClass("toggled-off");
        }
    }
    else
    {
        $dleButton.click();
    }
}

function getMainFormForQuickAdd(formId)
{

    var formElement = null;
    var hasMultipleMainForm = false;
    var targetDivId = null;

    hasMultipleMainForm = document.getElementsByName('main_form').length > 1 ? true : false;

    if(isIE)
        targetDivId = document.getElementById('outerdiv') != null? 'outerdiv':null;
    else
        targetDivId = document.getElementsByClassName('quickadddragger').length != 0? 'outerdiv':null;
    if(formId != null)
    {
        if(hasMultipleMainForm)
            formElement = targetDivId != null ? document.getElementById(targetDivId).children.namedItem(formId):null;
        else
            formElement = document.forms[formId];
        return formElement;
    }
    else return null;
}
