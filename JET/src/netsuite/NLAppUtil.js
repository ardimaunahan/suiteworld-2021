







	

        
var NLDate_short_months = new Array("Jan","Feb","Mar",
	                                "Apr","May","Jun","Jul",
	                                "Aug","Sep","Oct","Nov","Dec");
if ( 13 > 12 )
	NLDate_short_months.push();

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


/*************************************************************************
 * validate_html
 *
 * This routine validates the text in a field to assure it is valid HTML
 * val_type must be one of: 'td', 'table' or 'tr' to indicate which table tag
 * must come first in the HTML fragment, or 'html' if it's a whole document.
 * Pass in 'script' to only check for balanced script tags (useful for <head>
 * HTML)
 *
 * Note: If multiple tag types are permitted for the initial tag, enter them
 * as a comma-separated list for val_type.  Example: tr,td if either can be the
 * initial tag.
 *
 * Issue 120604: We don't set NS.form.isValid() based on the quality of HTML per
 * these checks. Users are allowed to submit a form even though HTML has not
 * passed these checks, which are informational only, not absolute.
 *
 * This performs the following checks:
 * - Proper nesting of <table> <tr> <td> tags amongst each other
 * - Proper closure of <script> tags
 * - Proper quoting of tag attributes.  Attribute strings, ig quoted, must
 *   be closed with the same type of quote, but may contain the other quote.
 *************************************************************************/
function validate_html(field, val_type)
{
	var doalert = true;
	if (field.value == null || field.value.length == 0 || val_type == null)
    {
        NS.form.setValid(true);
        return true;
    }

    var html = field.value.toLowerCase().replace(/\n/g,"").replace(/\t/g," ");
    var validflag = true;
    var err = '';

	/* Validate "whole page" HTML to see if it has a good chance of being a valid complete HTML page. */
    if (val_type == 'html')
    {
		if (html.indexOf('<html') == -1)
			err = "HTML document must begin with an <HTML> tag.";
		else if (html.indexOf('</html') == -1)
			err = "HTML document must end with a </HTML> tag.";
		else if (html.indexOf('</html') < html.indexOf('<html') || html.indexOf('</html') < html.lastIndexOf('<'))
			err = "</HTML> tag is in the wrong place.";
		else if (html.indexOf('<body') == -1)
			err = "HTML document is missing </BODY> tag.";
		else if (html.indexOf('<body') < html.indexOf('<html'))
			err = "<BODY> tag is in the wrong place.";
		else if (html.indexOf('</body') == -1)
			err = "HTML document is missing </BODY> tag.";
		else if (html.indexOf('</body') < html.indexOf('<body') || html.indexOf('</body') > html.indexOf('</html'))
			err = "<BODY> tag is in the wrong place.";
		else
			val_type = "table";
    }
    else
    {
		if (html.indexOf('<html') != -1 || html.indexOf('</html') != -1 || html.indexOf('<body') != -1 || html.indexOf('</body') != -1)
		{
			err = "Only an HTML fragment is expected here, not a whole HTML document.  There should be no <HTML> or <BODY> tags.";
		}
    }

	var index = 0;
	var len = 0, list, errpos;
    if (err == '')
    {
		var expectedtaglist = val_type.split(",");
		var expectedtags = "";
		for (var i = 0; i < expectedtaglist.length; i++) { expectedtags += "<"+expectedtaglist[i]+">" }
		var newindex;
		var bFirst = true;
		var iNestLevel = 0;
		var scriptSave;
		var attributeIdx;
		var ignoreInner = false;
		/* This loop iterates thru all tags in the HTML. */
		while ((newindex = html.indexOf(ignoreInner ? expectedtags : "<", index)) != -1)
		{
			if (newindex < attributeIdx) newindex = attributeIdx;
			index = newindex+1;
			var tag = html.substring(newindex);
			if (tag.indexOf(">") != -1)
				tag = tag.substring(0, tag.indexOf(">"));
			if (tag.indexOf(" ") != -1)
				tag = tag.substring(0, tag.indexOf(" "));

			/* Skip comments. */
			if (tag == "<!--")
			{
				index = html.indexOf("-->", index);
				if (index == -1) index = html.length;
				continue;
			}

			/* Skip tag substitution escape sequence tags. */
			if (tag.substring(0,2) == "<"+"%")
			{
				var endindex = html.indexOf("%"+">", index);
				errpos = char_pos_to_line_col(html,index-1);
				if (endindex == -1)
				{
					err="Missing substitution closing tag sequence %> for open tag at line "+errpos[0]+" column "+errpos[1]+"";
					break;
				}
				index = endindex;
				continue;
			}

			tag += ">";
			len = tag.length;

			/* This validates attributes to assure quotes are properly balanced.  Quotes of the opposite type may
			   * themselves quoted (i.e. alt=="He's liable to use single 'quotes' here" is valid. */
			attributeIdx = newindex+len-1;
			var openQuoteIdx;
			var bInSingQuot = false;
			var bInDoubQuot = false;
			while (attributeIdx < html.length)
			{
				var c = html.charAt(attributeIdx);
				if (c == '\\') { attributeIdx+=2; continue; }
				else if (c == '\'') { if (!bInDoubQuot) {bInSingQuot=!bInSingQuot; if (bInSingQuot)openQuoteIdx=attributeIdx;} }
				else if (c == '\"') { if (!bInSingQuot) {bInDoubQuot=!bInDoubQuot; if (bInDoubQuot)openQuoteIdx=attributeIdx;} }
				else if (c == '>' && !(bInSingQuot || bInDoubQuot)) { break; }
				attributeIdx++;
			}
			if (bInSingQuot || bInDoubQuot)
			{
				index = openQuoteIdx+1;
				len = 1;
				err = "Missing closing quote on tag attribute at character "+(index-newindex)+" for:\n"+html.substring(newindex, attributeIdx+1);
				break;
			}

			/* For simplicity (and flexibility) only table and script tags are actually checked for balance.
			   * They are the tags that, if wrong, can most seriously mess up a page. We don't want to be TOO strict. */
			if (tag != "<td>" && tag != "</td>"
			 && tag != "<tr>" && tag != "</tr>"
			 && tag != "<table>" && tag != "</table>"
			 && tag != "<script>" && tag != "</script>")
				continue;

			/* Track quote nesting level. */
			if (tag.substring(0,2) == "</")
				iNestLevel--;
			else
			    iNestLevel++;

			if (iNestLevel < 0)
			{
				errpos = char_pos_to_line_col(html,newindex);
				err = "There are too many closing table tags due to tag "+tag.toUpperCase()+" at line "+errpos[0]+" column "+errpos[1]+"";
				break;
			}

			/* There is a special message for the first tag being wrong to help explain to users the local
			   * table tag convention for HTML fragments that need to start with a certain tag. */
			if (bFirst)
			{
				if (tag != '<script>' && tag != '</script>')
				{
					bFirst = false;
					if (expectedtags.indexOf(tag) == -1)
					{
						if (expectedtags.indexOf('><') != -1)
						{
							list = expectedtags.replace(/></g,'> or <');
							err = "The first table tag in your HTML must be one of "+list+", not "+tag.toUpperCase()+"";
						}
						else
							err = "The first table tag in your HTML must be a "+expectedtags.toUpperCase()+" tag, not "+tag.toUpperCase()+".";
						break;
					}
				}
			}
			else
			{
				if (expectedtags.indexOf(tag) == -1)
				{
					list = expectedtags.toUpperCase().replace(/></g,'> or <');
					errpos = char_pos_to_line_col(html,newindex);
					err = "Expected "+list+" at line "+errpos[0]+" column "+errpos[1]+", but found a "+tag.toUpperCase()+" tag";
					break;
				}
			}

			/* This simple state machine tracks what next tag is valid given the current tag. */
			if (tag == "<table>" || tag == "</tr>")
			{
				expectedtags = "</table><tr><script>";
			}
			else if (tag == "<td>" || tag =="</table>")
			{
				expectedtags = "</td><table><script>";
			}
			else if (tag == "<tr>" || tag == "</td>")
			{
				expectedtags = "</tr><td><script>";
			}
			else if (tag == "<script>")
			{
				ignoreInner = true;
				scriptSave = expectedtags;
				expectedtags = "</script>";
			}
			else if (tag == "</script>")
			{
				ignoreInner = false;
				expectedtags = scriptSave;
				scriptSave = "";
			}
		}

		if (err == '' && iNestLevel > 0)
		{
			err = "Not all table tags were closed ("+iNestLevel+").  Your HTML is missing a closing "+expectedtags.substring(0, expectedtags.indexOf('>'))+"> tag at the end";
		}
    }

    if (err != '')
    {
        if (doalert)
			alert(err);
		validflag = false;
		setSelectionRange(field, index-1, index+len-1);
    }

    return validflag;
}

// Gets an object {start, end} representing a range for the specified time selector ID and fiscal calendar ID.
function getTimeSelectorRange(timeSelectorID, fiscalCalendarID, timeSelectors)
{
    if (!fiscalCalendarID)
        fiscalCalendarID = document.currentFCId;
    if (!timeSelectors)
        timeSelectors = document.timeSelectors;

    var timeSelData = timeSelectors[timeSelectorID];
    if (timeSelData)
    {
        var range = ('start' in timeSelData) ? timeSelData : timeSelData[fiscalCalendarID];
        if (range)
            return range;
    }
    return {start: null, end: null};
}


var ERR_HELP_SESSION_TIMEOUT_MSG = 'Help is unavailable because your connection has timed out.\nPlease log in to the application and open the help window again.';

var ns_domain = 'https://system.na3.netsuite.com';

function nlPopupHelp(taskId)
{
	// if this request was initiated via ubsersearch, pass along the appropriate search param, rather than the task ID
    var url;
    if(taskId.indexOf("uber_")==0)
        url = '/app/help/helpcenter.nl?search=' + taskId.substring(5);
    else
        url = '/app/help/helpcenter.nl?topic='+taskId;
    var newWin = window.open(url,'popuphelp','location=yes,toolbar=yes,menubar=yes,scrollbars=yes,resizable=yes,height='+getDocumentHeight()+',width='+getDocumentWidth());
    newWin.focus();
}

function nlPopupGuides(role_name)
{
    var parms= 'toolbar=0,location=0,directories=0,status=0,menubar=0,scrollbars=0,resizable=0';
    var dest='/images/guide/quicklooks.html?'+role_name, screenx, screeny;

    screenx = window.screenX + 30;
    screeny = window.screenY + 30;

    var newWin = window.open(dest,'popupguide',parms + ',left='+screenx+',top='+screeny+',height=410,width=800');

    newWin.focus();
}

function nlPopupGuide(role_name)
{
    var minwinh = 768;
    var minwinw = 1024;
    var minbarw = 300;
    var screenh = screen.height;
    var screenw = screen.width;
    var windowh = outerHt();
    var windoww = outerWd();
    var screenx, screeny, neww, newh, newx, newy;

    screenx = window.screenX;
    screeny = window.screenY;


    neww = windoww;
    if (neww < minwinw )
        neww = minwinw;
    if (neww+minbarw > screenw - screenx)
        newx = screenw - (neww+minbarw);
    else
        newx = screenx;
    if (newx < -4) newx = -4;

    if (minwinh > screenh - screeny)
        newy = screenh - minwinh;
    else
        newy = screeny;

    newy = newy -121;  //adjust

    if (newy < -4) newy = -4;

    if (windowh < minwinh)
        newh = minwinh;
    else
        newh = windowh;

    if (windoww < minwinw)
        neww = minwinw;
    else
        neww = windoww;

     if (screenw - neww < minbarw)
        neww = screenw-minbarw;

    resizeTo(neww,newh);
    moveTo(newx,newy);

    windowh = getDocumentHeight();
    windoww = getDocumentWidth();
    screenx = this.screenLeft;
    screeny = this.screenTop;

    var parms;
    parms= 'toolbar=no';
    parms += ',statusbar=no';
    parms += ',menubar=no';
    var x = newx+neww-4;
    var dest='/images/guide/quicklooks.html?'+role_name;
    var newWin = window.open(dest,'popupguide',parms + ',resizableresizable=no,left='+x+',top='+newy+',height=700,width='+minbarw);
    newWin.focus();
}

function openMapWindow(address, defaultcountry, type)
{
  if (!defaultcountry || defaultcountry.length == 0)
    defaultcountry = 'US';

  address = trim(address);
  if (address.length == 0)
  {
    alert("You must enter an address before you can view a map.");
    return;
  }

  // determine country
  var country;
  var lines = address.split("\n"), line;
  var j = lines.length - 1;
  for (; j >= 0; j--)
  {
    line = trim(lines[j]);
    if (line.length == 0)
      continue;

	country = getCountry(line);
	if (country != null)
		break;
  }
  if (country == null)
	country = defaultcountry;

   callMapFunctionByIndex(countryMap[country], address, type);
}

/* Resize the height of a VISIBLE or "live" iframe to match its contents. Pixel offsets below (4 px, 3 px) are the
result of hand-tuning to prevent clipping in specific browsers. Adjust as needed by testing supported browsers. */
function nsResizeIframeToContent(iframeId)
{
    var iframe = top.document.getElementById(iframeId);
    var body = iframe.contentWindow.document.body;
    var height = body.offsetHeight;
    if (height > 0)
    {
        var respawn = iframe.height != height;
        iframe.height = height;
        var contentTable = nsDescendantOfType(body, 'TABLE');
        if (contentTable)
            iframe.width = (contentTable.offsetWidth + 3);
        if (respawn)
            nsResizeIframeToContent(iframeId);
    }
}

/*
    A generic inline page message "alert" box.

    Don't use this function directly! Use showAlertBox() and hideAlertBox() instead that are correctly handled
    on the various client devices (browser, mobile app, etc).
*/
function uir_getAlertBoxHtml(sTitle, sMessage, iType, width, helpUrl, helpText, imageHostName)
{
    if (iType != NLAlertDialog.TYPE_LOWEST_PRIORITY &&
        iType != NLAlertDialog.TYPE_LOW_PRIORITY &&
        iType != NLAlertDialog.TYPE_MEDIUM_PRIORITY &&
        iType != NLAlertDialog.TYPE_HIGH_PRIORITY)
        iType = NLAlertDialog.TYPE_LOW_PRIORITY;

    if (!sTitle)
    {
        sTitle = NLAlertDialog.defaultTitles[iType];
        if (sTitle == null)
            sTitle = "Error"
    }

    var hasHelpLink = false;
    if (helpUrl && helpUrl.length > 0)
    {
        hasHelpLink = true;
        if (!helpText)
            helpText = "Visit this Help Topic";
    }

    if (!imageHostName)
        imageHostName = "";

    return  "<div class='uir-alert-box " + NLAlertDialog.imageNames[iType] + "'  width='"+width+"' role='status'>"+
                    "<div class='icon " + NLAlertDialog.imageNames[iType] + "' >" + "<img src='" + imageHostName + "/images/icons/messagebox/icon_msgbox_"+NLAlertDialog.imageNames[iType]+".png' alt=''>" + "</div>" +
                    "<div class='content'>" +
                        "<div class='title'>" + sTitle + "</div>" +
                        "<div class='descr'>" + sMessage + "</div>"+
                        (hasHelpLink ? "<div class='help'><a href=\"" + helpUrl.replace(/"/g, "&#34") + "\">" + helpText + "</a></div>" : "" ) +
                    "</div>" +
            "</div>";
}

function getAlertBoxHtml(sTitle, sMessage, iType, width, helpUrl, helpText, imageHostName)
{
    if (iType != NLAlertDialog.TYPE_LOWEST_PRIORITY &&
            iType != NLAlertDialog.TYPE_LOW_PRIORITY &&
            iType != NLAlertDialog.TYPE_MEDIUM_PRIORITY &&
            iType != NLAlertDialog.TYPE_HIGH_PRIORITY)
        iType = NLAlertDialog.TYPE_LOW_PRIORITY;
    if(!width)
        width = 500;
    if (!sTitle)
    {
        sTitle = NLAlertDialog.defaultTitles[iType];
        if (sTitle == null)
            sTitle = "Error"
    }

    var bHelpLink = false;
    if (helpUrl && helpUrl.length > 0)
    {
        bHelpLink = true;
        if (!helpText)
            helpText = "Visit this Help Topic";
    }

    if (!imageHostName)
        imageHostName = "";

    return "<table class='uir-report-information' cellpadding='0' cellspacing='0' border='0' style='margin:0px; min-height: 65px; border: 1px solid #417ed9;' width='"+width+"' bgcolor='"+NLAlertDialog.backgroundColors[iType]+"'>"+
           "<tr><td colspan='2' width='100%' height='15'></td></tr>"+
           "<tr>"+
           "<td align='left' valign='top'><div class='icon " + NLAlertDialog.imageNames[iType] + "'></div></td>"+
           "<td width='100%' valign='top'><div class='content'>" +
               "<b>"+sTitle+"</b><br />"+sMessage+
               (bHelpLink ? ("<p align='right'> <img src='" + imageHostName + "/images/icons/messagebox/icon_help_green.png' style='height:12px; width:12px; display:block; vertical-align:middle' /> <a href=\"" + helpUrl.replace(/"/g, "&#34") + "\">" + helpText + "</a></p>") : "") +
           "</div></td></tr>"+
           "<tr><td colspan='4' width='100%' height='15'></td></tr>"+
           "</table>";
}

NLAlertDialog.CONFIRMATION = 0;
NLAlertDialog.INFORMATION  = 1;
NLAlertDialog.WARNING      = 2;
NLAlertDialog.ERROR        = 3;
NLAlertDialog.defaultTitles = ["Confirmation",
                               "Information",
                               "WARNING",
                               "Error"];

/**
 * @deprecated Use @var NLAlertDialog.CONFIRMATION instead.
 */
NLAlertDialog.TYPE_LOWEST_PRIORITY = 0;
/**
* @deprecated Use @var NLAlertDialog.INFORMATION instead.
*/
NLAlertDialog.TYPE_LOW_PRIORITY    = 1;
/**
* @deprecated Use @var NLAlertDialog.WARNING instead.
*/
NLAlertDialog.TYPE_MEDIUM_PRIORITY = 2;
/**
* @deprecated Use @var NLAlertDialog.ERROR instead.
*/
NLAlertDialog.TYPE_HIGH_PRIORITY   = 3;

// right pane entry form related behavioral functions
function scrollToField(sFieldName)
{
    try
	{
			var fieldAnchor = document.getElementById("scrollfield_" + sFieldName);
			if(fieldAnchor != null)
				document.body.scrollTop = findPosY(fieldAnchor) - 30;
	}
	catch (e)
	{
		// do nothing - not a critical failure
	}
}

// function to check if the total amount on the form will exceed the safe JS limit after adding the amount on the item field.
function checkMaxTotalLimit(totalFieldName, machineName, itemAmountFieldName)
{
	var newTotalAmount;
	if(machineName == '')
		newTotalAmount = parseFloat(nlapiGetFieldValue(totalFieldName)) + parseFloat(nlapiGetFieldValue(itemAmountFieldName));
	else
		newTotalAmount = parseFloat(nlapiGetFieldValue(totalFieldName)) + parseFloat(nlapiGetCurrentLineItemValue(machineName,itemAmountFieldName));
    if( newTotalAmount >= getMaxTotalLimit() )
    {
    	alert("The total amount is too large. Please split the transaction into multiple ones.");
        return false;
    }
    else
    	return true;
}

function validate_fromaddress(fld)
{
 if (fld.value.length > 0 && !fld.value.toLowerCase().match(/^\"[^<>"]+\"\s\<(?:(?:[-a-zA-Z0-9!#$%&'*+/=?^_`{|}~]+(?:\.[-a-zA-Z0-9!#$%&'*+/=?^_`{|}~]+)*@(?:[a-zA-Z0-9]+(?:-+[a-zA-Z0-9]+)*\.)+(?:xn--[-a-zA-Z0-9]+|[a-zA-Z]{2,16}))|(?:\{[A-Za-z0-9_\.]+\}))\>$/))
 {
     alert('From address must be of the form \"Name\" <Email Address>');
     selectAndFocusField(fld);
     NS.form.setValid(false);
     return false;
 }
 NS.form.setValid(true);
 return true;
}

/* Access key handler
*   - access key works differently in IE than in other browsers
*   - access key pressing will cause click on the selected element
* */

attachEventHandler("keydown", document, keyDownListenerAccessKey);


function keyDownListenerAccessKey(e)
{
    var key = (e.keyCode ? e.keyCode : e.which);
    if(e.altKey && key != 18)
    {
        NS.jQuery("[accesskey='" + e.key + "']").click();
        if(e.stopPropagation)
        {
            e.stopPropagation();
        }
        else
        {
            window.event.cancelBubble = true;
        }
    }
}
/* END - Access key handler */


    function showAlertBox(elemId, sTitle, sMessage, iType, width, helpUrl, helpText)
{
    NS.jQuery('#' + elemId).html(getAlertBoxHtml(sTitle, sMessage, iType, width, helpUrl, helpText)).show();
}

function hideAlertBox(elemId)
{
    NS.jQuery("#"+elemId).hide();
}



var doPageLogging = (window.parent == null || window.parent == window);
var doPerfdbLogging = window.doPageLogging;

var isProdsys = true;
var pageEndToEndTime = null; 
var e2eResultsString = null; 

function storePerfCookie()
{
    var m = /(^| )base_t=([^;]+)/.exec(document.cookie);
    document.cookie = 'base_t=; path=/';

    if (m)
    {
        sessionStorage.setItem('perfCookie', m[2]);
        var cookie = m[2];
        var perfInfo = {}, n;
        var rx = /(\w+):([^|]*)/g;
        while (n = rx.exec(cookie)) {
            perfInfo[n[1]] = unescape(n[2]);
        }
        if (perfInfo.start && perfInfo.url
            && window.location.href.indexOf(perfInfo.url2 || perfInfo.url) != -1)
        {
            sessionStorage.setItem('nthreadid', perfInfo.nthreadid);
        }
        else
        {
            sessionStorage.removeItem('nthreadid');
        }
    }
    else
    {
        sessionStorage.removeItem('perfCookie');
        sessionStorage.removeItem('nthreadid');
    }
}

function logEndOfRequest()
{
    if ( !window.doPageLogging ) return;
    try
    {
        var renderendtime = new Date();
        var endtoendTime = null;

        var perfInfo = {}, m;
        var rx = /(\w+):([^|]*)/g;
        var cookie = sessionStorage.getItem('perfCookie');
        if (cookie) {
            while (m = rx.exec(cookie))
                perfInfo[m[1]] = unescape(m[2]);
        }
        
        if (window.performance && window.performance.timing)
        {
            var navStart = window.performance.timing.navigationStart;
            if (navStart > 0)
            {
                perfInfo.start = navStart;
            }
        }
        var base_t = perfInfo.start;
        var base_t_url = perfInfo.url;
        var base_t_url2 = perfInfo.url2;
        var base_t_sql = nvl(perfInfo.sqlcalls,0);
        var base_t_sqltime = perfInfo.sqltime;
        var base_t_servertime = perfInfo.servertime;
        var base_t_ssstime = perfInfo.ssstime;
        var base_t_swftime = perfInfo.swftime;
        var base_t_user_email = perfInfo.email;
        var base_t_fcalls = perfInfo.fcalls;
        var base_t_ftime = perfInfo.ftime;

        if (base_t && base_t_url && document.location.href.indexOf(base_t_url2 || base_t_url) != -1)
        {
            endtoendTime = renderendtime.getTime() - base_t;
            window.pageEndToEndTime = endtoendTime;
        }

        var pageloadTime = window.headerstarttime != null ? renderendtime.getTime() - window.headerstarttime.getTime() : 0;
        var pageinitTime = window.pageinitstart != null ? (renderendtime.getTime() - window.pageinitstart.getTime()) : 0;
        var headerTime = window.headerstarttime != null ? (window.headerendtime.getTime() - window.headerstarttime.getTime()) : 0;
        var staticscriptTime = window.staticscriptstarttime != null ? (window.staticscriptendtime.getTime() - window.staticscriptstarttime.getTime()) : 0;
        var dynamicscriptTime = window.dynamicscriptstarttime != null ? (window.dynamicscriptendtime.getTime() - window.dynamicscriptstarttime.getTime()) : 0;
        var footerscriptTime = window.footerscriptstarttime != null ? (window.footerscriptendtime.getTime() - window.footerscriptstarttime.getTime()) : 0;
        var unmeasuredTime = pageloadTime - pageinitTime - headerTime - staticscriptTime - dynamicscriptTime - footerscriptTime - (window.dropdownCounter > 0 ? window.dropdownloadtime : 0);

        var logoSpan = document.getElementById("devpgloadtime");
        if (logoSpan != null)
        {
            var resultsAsTable = '<table cellspacing=5 cellpadding=0 class="smalltextnolink">';
            if ( endtoendTime != null )
            {
                resultsAsTable = addPetDataRow(resultsAsTable, 'Total', (endtoendTime/1000));

                if ( window.isProdsys )
                {
                    resultsAsTable = addPetDataRow(resultsAsTable, 'Server', ((base_t_servertime)/1000) + ' ('+format_currency(100*(base_t_servertime)/endtoendTime)+'%)');
                    if (base_t_ssstime != null)
                        resultsAsTable = addPetDataRow(resultsAsTable, 'Server Suite Script', (base_t_ssstime/1000) + ' ('+format_currency(100*base_t_ssstime/endtoendTime)+'%)');
                    if (base_t_swftime != null)
                        resultsAsTable = addPetDataRow(resultsAsTable, 'Server Workflow', (base_t_swftime/1000) + ' ('+format_currency(100*base_t_swftime/endtoendTime)+'%)');
                    resultsAsTable = addPetDataRow(resultsAsTable, 'Network', ((endtoendTime-base_t_servertime-pageloadTime)/1000) + ' ('+format_currency(100*(endtoendTime-base_t_servertime-pageloadTime)/endtoendTime)+'%)');
                    resultsAsTable = addPetDataRow(resultsAsTable, 'Client', (pageloadTime/1000) + ' ('+format_currency(100*pageloadTime/endtoendTime)+'%)');
                }
                else
                {
                    resultsAsTable = addPetDataRow(resultsAsTable, 'Java', ((base_t_servertime-base_t_sqltime)/1000) + ' ('+format_currency(100*(base_t_servertime-base_t_sqltime)/endtoendTime)+'%)');
                    if (base_t_ssstime != null)
                        resultsAsTable = addPetDataRow(resultsAsTable, 'SSS', (base_t_ssstime/1000) + ' ('+format_currency(100*base_t_ssstime/endtoendTime)+'%)');
                    if (base_t_swftime != null)
                        resultsAsTable = addPetDataRow(resultsAsTable, 'SWF', (base_t_swftime/1000) + ' ('+format_currency(100*base_t_swftime/endtoendTime)+'%)');
                    resultsAsTable = addPetDataRow(resultsAsTable, 'SQL', (base_t_sqltime/1000) + ' ('+format_currency(100*base_t_sqltime/endtoendTime)+'%) ('+base_t_sql+' call'+(base_t_sql == 1 ? '' : 's')+')');
                    resultsAsTable = addPetDataRow(resultsAsTable, 'Fetches', (base_t_ftime/1000) + ' ('+base_t_fcalls+' call'+(base_t_fcalls == 1 ? '' : 's')+')');
                    resultsAsTable = addPetDataRow(resultsAsTable, 'Network', ((endtoendTime-base_t_servertime-pageloadTime)/1000) + ' ('+format_currency(100*(endtoendTime-base_t_servertime-pageloadTime)/endtoendTime)+'%)');
                    resultsAsTable = addPetDataRow(resultsAsTable, 'Client', (pageloadTime/1000) + ' ('+format_currency(100*pageloadTime/endtoendTime)+'%)');
                }

            }
            else
                resultsAsTable = addPetDataRow(resultsAsTable, 'Client', (pageloadTime/1000));

            if ( !window.isProdsys )
            {
                resultsAsTable = addPetDataRow(resultsAsTable, 'Header', (headerTime/1000) + ' ('+format_currency(100*headerTime/pageloadTime)+'%)');
                resultsAsTable = addPetDataRow(resultsAsTable, 'Static', (staticscriptTime/1000) + ' ('+format_currency(100*staticscriptTime/pageloadTime)+'%)');
                resultsAsTable = addPetDataRow(resultsAsTable, 'Dynamic', (dynamicscriptTime/1000) + ' ('+format_currency(100*dynamicscriptTime/pageloadTime)+'%)');
                resultsAsTable = addPetDataRow(resultsAsTable, 'Footer', (footerscriptTime/1000) + ' ('+format_currency(100*footerscriptTime/pageloadTime)+'%)');
                resultsAsTable = addPetDataRow(resultsAsTable, 'Selects', (window.dropdownloadtime/1000) + ' ('+format_currency(100*window.dropdownloadtime/pageloadTime)+'%) ('+window.dropdownCounter+' dropdown'+(window.dropdownCounter != 1 ? 's' : '')+')');

                var machinePerfInfo = window.editmachineCounter > 0 ? '('+ window.editmachineCounter+' machine'+(window.editmachineCounter != 1 ? 's' : '')+': '+(window.editmachineConstructorTime/1000) + ')' : '';
                resultsAsTable = addPetDataRow(resultsAsTable, 'PageInit', (pageinitTime/1000) + ' ('+format_currency(100*pageinitTime/pageloadTime)+'%) '+machinePerfInfo);
                resultsAsTable = addPetDataRow(resultsAsTable, 'Other', (unmeasuredTime/1000) + ' ('+format_currency(100*unmeasuredTime/pageloadTime)+'%)');
            }

            resultsAsTable = addPetDataRow(resultsAsTable,'Page', emptyIfNull( base_t_url ));
            resultsAsTable = addPetDataRow(resultsAsTable,'Email', emptyIfNull( base_t_user_email ));
            resultsAsTable = addPetDataRow(resultsAsTable,'Time', getdatestring(renderendtime)+' '+gettimestring(renderendtime)+' GMT '+(renderendtime.getTimezoneOffset() > 0 ? '+' : '')+(renderendtime.getTimezoneOffset()/60));
            resultsAsTable += '</table>';
            logoSpan.ondblclick = new Function("nlShowPet('', 'get_nlPetContent().submitAsCase()','" + resultsAsTable + "');");
        }

        if ( window.doPerfdbLogging && endtoendTime != null && parseInt(endtoendTime) > (parseInt(pageloadTime) + parseInt(base_t_servertime)) )
        {
            if ( window.headerstarttime != null )
            {
                perfInfo['header'] = headerTime;
                perfInfo['pageload'] = pageloadTime;
            }
            if ( window.pageinitstart != null )
                perfInfo['pageinit'] = pageinitTime;
            if ( window.staticscriptstarttime != null )
                perfInfo['staticscript'] = staticscriptTime;
            if ( window.dynamicscriptTime != null )
                perfInfo['dynamicscript'] = dynamicscriptTime;
            if ( window.footerscriptTime != null )
                perfInfo['footerscript'] = footerscriptTime;
            perfInfo['endtoend'] = endtoendTime;
            new NLXMLHttpRequest( true ).requestURL( '/app/PerfRenderTime.nl', perfInfo, null, true )
        }
    }
    catch ( e ) { }   
}

function addPetDataRow(dataThusFar, colName, colValue)
{
    var newData;

    if(!dataThusFar)
        newData = "";
    else
        newData = dataThusFar;

    newData += '<tr><td class="textbold">' + colName + '</td><td>&nbsp;</td><td>' + colValue + '</td></tr>';

    return newData;
}


var loggedBeforeUnload = false;
function logStartOfRequest( type )
{
    if ( window.doPageLogging )
    {
        if ( type != 'onunload' || !window.loggedBeforeUnload )
        {
            var start = new Date().getTime();
            var whence = document.location.href.substring( document.location.href.indexOf( document.location.pathname ) );
            document.cookie = 'base_t=start:'+start+'|whence:'+escape(whence)+'; path=/';
        }
        window.loggedBeforeUnload = (type == 'beforeonunload');
    }
}

function setStartOfRequestLoggers( )
{
    if ( window.doPageLogging )
    {
        window.addEventListener('beforeunload', function() {
            logStartOfRequest('beforeonunload');
        });
    }
}

