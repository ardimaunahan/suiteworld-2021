// *** CORE JAVASCRIPT METHODS ***
//
// Please! Keep this file small for fast store page loads! Only for common methods shared by app and Web store.
// NLAppUtil exists only because our customers complained about initial Web store page loads taking too long.
//
// The kinds of JavaScript that should be here, for example are:
// - Glue needed to work with the page generator, such as resetDivSizes() and related stuff
// - Entry form support: code for manipulating selects and form fields.  Both the Web store and app use entry forms.
// - All kind of basic field validation for fields that could appear in stores. Currency, date, phone number,
//   credit cards, etc. (but NOT HTML fields, RGB/HSV color fields, any anything else esoteric that only appears
//   in the app)
// - Support for the calendar popup widget, and other shared widgets.  (But not, for example, the address mapping
//   widget - that only appears in the application)
//
// Please put everything else into NLAppUtil!
function checkForModuleDependency()
{
    return require.defined("N/format") &&
           require.defined("N/validator");
}

if (!Array.prototype.push) {
  Array.prototype.push = function() {
		var startLength = this.length;
		for (var i = 0; i < arguments.length; i++)
      this[startLength + i] = arguments[i];
	  return this.length;
  }
}

try{
    parentAccesible =(typeof parent.encode != "undefined");
}catch(e)
{
    parentAccesible = false;
}

var isNS = (!isBackend && document.addEventListener) ? true : false;

// In general, you can call encodeURIComponent directly since all browsers support it
function encode(text)
{
    return encodeURIComponent(text);
}

function alphafirst(str)
{
    var re = new RegExp("([A-Za-z].*)");
    return (re.exec(str)!=null && RegExp.$1==str);
}

// return stacktrace as a string, e.g. debugAlert(stacktrace())
function stacktrace()
{
	var stackstring = "stacktrace: ";
	var history = [];
	var func = arguments.callee.caller;

	while (func !== null)
	{
		var funcName = getFuncName(func);
		var funcArgs = getFuncArgs(func);
		var caller = func.caller;
		var infiniteLoopDetected = history.indexOf(funcName) !== -1;
		var historyTooLong = history.length > 50;
		var callerIsSelf = (caller === func);

		if ( infiniteLoopDetected || historyTooLong || callerIsSelf)
			break;

		stackstring += funcName + funcArgs + "\n\n";
		history.push(funcName);
		func = caller;
	}

	return stackstring;
}

function getFuncArgs(a)
{
    var s = "arguments: {";
    for (var i = 0; i < a.arguments.length; i++)
    {
        if (typeof a.arguments[i] == "undefined")
            s += '\'undefined\'';
        else if (a.arguments[i] == null)
            s += 'null';
        else if (typeof a.arguments[i] == "string")
            s += "'" + a.arguments[i].toString() + "'";
        else
            s += a.arguments[i].toString();
        if (i < a.arguments.length -1)
            s += ",";
    }
    s += "}";
    return s;
}

function getFuncName(f)
{
    var s = f.toString();
    if (s.indexOf("anonymous") >= 0)
    {
        if (s.length > 100)
            return s.substr(0, 100) + "\n";
        else
            return s + "\n";
    }
    else
    {
        s = s.match(/function[^{]*/);
        if (s !== null)
            s = s[0];
    }
    if ((s == null) || (s.length == 0)) return "anonymous \n";
    return s;
}

function scrollDiv()
{
    if( document.getElementById('div__label') ) document.getElementById('div__label').scrollLeft = document.getElementById('div__body').scrollLeft;
}

// strictly returns the visible portion of the window's height
function getVisibleWindowHeight()
{
    var isWindowContainedInDivFrame = (window.parentAccesible && typeof parent != "undefined" && typeof parent.Ext != "undefined" && parent.Ext.WindowMgr.getActive()!=null);

    return (isWindowContainedInDivFrame ? parent.Ext.WindowMgr.getActive().body.dom.contentWindow.innerHeight : jQuery(window).height());
}

// Do not use the two functions below to get width and height of document client area
// In IE, the value will not include scroll bar; In FF and Safari, the value will include scrollbar
function getDocumentHeight()
{
    if (window.innerHeight)
        return window.innerHeight;
    else if (document.documentElement && document.documentElement.clientHeight && document.documentElement.clientHeight != 0)
        return document.documentElement.clientHeight;
    else // if (document.body)
        return document.body.clientHeight;
}

function getDocumentWidth()
{
    if (window.innerWidth)
        return window.innerWidth ;
    else if (document.documentElement && document.documentElement.clientWidth && document.documentElement.clientWidth != 0)
        return document.documentElement.clientWidth;
    else  // if (document.body)
        return document.body.clientWidth;
}

function getWindowPageXOffset()
{
	return (window.pageXOffset !== undefined) ? window.pageXOffset : (document.documentElement || document.body.parentNode || document.body).scrollLeft;
}

function getWindowPageYOffset()
{
	return (window.pageYOffset !== undefined) ? window.pageYOffset : (document.documentElement || document.body.parentNode || document.body).scrollTop;
}

// get the width of the document client region (excluding body padding / border / margin)
function getElementContentWidth(element)
{
    return  element.offsetWidth
            - getRuntimeSize(element, "paddingLeft")
            - getRuntimeSize(element, "paddingRight")
            - getRuntimeSize(element, "borderLeftWidth")
            - getRuntimeSize(element, "borderRightWidth")
            - getRuntimeSize(element, "marginLeft")
            - getRuntimeSize(element, "marginRight") ;
}

// get the height of the document client region (excluding body padding / border / margin)
function getElementContentHeight(element)
{
    return element.offsetHeight
            - getRuntimeSize(element, "paddingTop")
            - getRuntimeSize(element, "paddingBottom")
            - getRuntimeSize(element, "borderTopWidth")
            - getRuntimeSize(element, "borderBottomWidth")
            - getRuntimeSize(element, "marginTop")
            - getRuntimeSize(element, "marginBottom") ;
}

var ieDiffWidth=0;
var ieDiffHeight=0;

function initOuter() {

  var w, h, offW, offH, diffW, diffH;
  var fixedW = 800;
  var fixedH = 600;
  if (document.all) {
    offW = document.body.offsetWidth;
    offH = document.body.offsetHeight;
    window.resizeTo(fixedW, fixedH);
    diffW = document.body.offsetWidth  - offW;
    diffH = document.body.offsetHeight - offH;
    w = fixedW - diffW;
    h = fixedH - diffH;
    ieDiffWidth  = w - offW;
    ieDiffHeight = h - offH;
    window.resizeTo(w, h);
  }
}

function outerWd() {

  if (document.all)
  {
    if (ieDiffHeight==0) initOuter();
    return document.body.offsetWidth  + ieDiffWidth;
  }
  else
    return window.outerWidth;
}

function outerHt() {

  if (document.all)
  {
    if (ieDiffHeight==0) initOuter();
    return document.body.offsetHeight  + ieDiffHeight;
  }
  else
    return window.outerHeight;
}

function onBeforePrint()
{
    var t= document.getElementById('div__label');
    if (t != null)
    {
        t.style.width = null ;
        t.style.height = null;
    }
    t = document.getElementById('div__body');
    if (t != null)
    {
        t.style.width = null;
        t.style.height = null;
    }

    document.body.scroll = 'auto';
}
function onAfterPrint()
{
    // see comments in resetDivSizes() below for details on why this check is here
    if(document.getElementById("resetdivwascalled") != null)
        resetDivSizes();
}

if (!isBackend) {
    window.onbeforeprint = onBeforePrint;
    window.onafterprint = onAfterPrint;
}

function getNavTreePaneDivID()
{
    return 'div__nav_tree';
}

/*
 * The label rows are repeated at the bottom of the list.  We want them there for their horizontal sizes, but we don't
 * want them to have any vertical size.  Solve the problem with YAD (Yet Another Div).  This div is named "squeezeBox".
 * It goes just outside the table containing the list.  We sqeeze it so that it doesn't have room to show the label
 * rows.
 */
function hideInvisibleRows()
{
    var div = document.getElementById("squeezeBox");
    if (div == null)
        return;
    var trs = div.getElementsByTagName("tr");
    var hiddenHeight = 0;
    for (var i=0; i < trs.length; i++)
    {
        // -- YAD techique should only be applied once to eliminate the black bar
        if (trs[i].className == "labelRow" && isValEmpty(trs[i].getAttribute("squeezeBox")) )
        {
            hiddenHeight += trs[i].offsetHeight + 1;
            trs[i].setAttribute("squeezeBox","T");
        }
    }
    if (hiddenHeight > 0)
    {
        div.style.overflow = "hidden";
        div.style.height = div.offsetHeight - hiddenHeight + (isIE ? 0 : 28) + "px";
    }
}

// Resize popup window (width only for now) if content on the form (machines, sections, etc..) exceed browser width
// This eliminates the horizontal scrollbar which is good for usability. It also avoids the maintenance
// nightmare of having to change the hard-coded window width in order to fix bugs
function resizePopupWindow()
{
    var list = document.getElementById('div__body');
    if (list == null)
        return; // only run this on the body section of framework generated pages
    var docwidth = getDocumentWidth()-10;
    var maxspanwidth = getMaxContentWidth(list.getElementsByTagName("span"));
    var maxdivwidth = getMaxContentWidth(list.getElementsByTagName("div"));
    var maxwidth = Math.max(list.scrollWidth,Math.max(maxspanwidth,maxdivwidth));
    // compare content width among all spans (machines) and divs (sections) to the windoe
    if ( maxwidth > docwidth )
        window.resizeBy(maxwidth -docwidth,0);
}

// given an Array of elements, return the maximum scrollable width among all of them
function getMaxContentWidth(elems)
{
    var size = 0;
    for (var i = 0; i < elems.length; i++ )
    {
        if ( elems[i].scrollWidth > size )
            size = elems[i].scrollWidth;
    }
    return size;
}

// Mac Safari will return UNDEFINED for elem.offsetHeight if the elem has no display property set.
// Therefore we check to make sure the offsetHeight is defined before we attempt to return it.
function getHeight(elem)
{
    if (elem == null)
        return 0;
    else
        return elem.offsetHeight ? elem.offsetHeight : 0;
}

function makeVisible(elem)
{
    if (elem != null)
        elem.style.visibility = 'visible';
}

function visible(elem, on )
{
    if (elem != null)
        elem.style.visibility = on ? 'inherit' : 'hidden';
}

// This method body was changed because of false positives and false negatives documented in issue 166805
function endsWith(str, token)
{
	return str != null && token != null && str.length >= token.length && str.substr(str.length-token.length) == token;
}

function splitIntoRows( value )
{
    return value != null ? (value.length > 0 ? value.split(String.fromCharCode(2)) : []) : null;
}
function splitIntoCells( value )
{
    return value != null ? (typeof(value) == 'string' ? value.split(String.fromCharCode(1)) : value) : null;
}

// isempty(): check if the value of form field 'fld1' is empty
function isempty(fld1,nam)
{
	var val = fld1.value;
    return isValEmpty(val,nam);
}

// Convert fullwidth characters in the U+FF00 block into their basic Latin equivalents.
// Included are digits, uppercase letters, lowercase letters, and punctuation.
// See http://unicode.org/charts/PDF/UFF00.pdf
function parseCJKNumbers(field)
{
	var val = field.value;
    if (val == null) return null;
	var re = /[\uff01-\uff5e]/g;
	var out = [];
	var m , last = 0;
	re.lastIndex = 0; // This is required for Firefox, but not for IE
	while ((m = re.exec(val)) != null)
	{
		if (m.index > last) out.push(val.substring(last, m.index));
		last = re.lastIndex;
		out.push(String.fromCharCode(m[0].charCodeAt(0) - 0xfee0));
	}
	if (last == 0) return val;
	if (last < val.length) out.push(val.substring(last));
	return out.join('');
}

/*
  New line is stored in database as two characters, but represents differently in browsers.
  This method removes all \r characters and new line counts as two characters (so it's no difference if they were there or not).
*/
function getIndexForSelection(str, index)
{
    var text = str.replace(/\r/g, '');
    var length = 0;
    for (var i=0; i<text.length; ++i)
    {
        var chnum=text.charCodeAt(i);
        if (chnum == 10) // new line is considered as two characters.
        {
            length++;
        }
        length++;
        if (length > index)
            return i;
    }
    return 0;
}

function truncateStringInUnicode(str, maxlen)
{
    var totalnum = 0;
    var sLower = 128;
    var sHigher = 2048;
    var strOut = "";
    for (var i=0; i < str.length; i++ )
    {
        var chnum = str.charCodeAt(i);
        if ( chnum < sLower )
            totalnum += 1;
        else if ( chnum >= sLower && chnum < sHigher )
            totalnum += 2;
        else if ( chnum >= sHigher )
            totalnum += 3;
        if ( totalnum < maxlen )
            strOut = strOut + str.charAt(i);
    }
    return strOut;
}

function UTF8toUTF16index(str, utf8index)
{
    str = str.replace(/\r/g, '');
    var utf8len = 0;
    var sLower = 128;
    var sHigher = 2048;
    for (var i=0; i<str.length; ++i)
    {
        var chnum=str.charCodeAt(i);
        if (chnum == 10) // new line is considered as two characters.
        {
            utf8len += 2;
        }
        else if (chnum < sLower)
            utf8len += 1;
        else if (chnum < sHigher)
            utf8len += 2;
        else
            utf8len += 3;
        if (utf8len > utf8index)
            return i;
    }
    return 0;
}

function lengthInUTF8Bytes(str) {
    /* Replace all occurrences of %XX by one character. Final length is the length in bytes.
         New line is considered as two characters (It is stored as /r/n in the database).
         Also ignore CR character, if it is presented (already counted with new line) */
    return encodeURIComponent(str.replace(/\r/g, '')).replace(/%0A/g, 'UU').replace(/%[A-F\d]{2}/g, 'U').length;
}

// Given a string, analyze its UTF8 bytes. Return the APPROXIMATE number of characters that must be removed to make
 // the length (in bytes) maxByteLen or fewer. (Return 0 if string is already <= maxByteLen.)
function analyzeUTF8(str, maxByteLen)
{
    var lengthInBytes = lengthInUTF8Bytes(str);
    var excessBytes = lengthInBytes - maxByteLen;
    if(excessBytes > 0) {
        var coef = lengthInBytes / str.length; // Number of bytes per one character.
        return Math.round(excessBytes / coef);
    }
    return 0;
}

function searchMonth(str, fullName) {
    var tmp_str = str.toLowerCase();
    var months = [];
    if (fullName) {
        months = ["january", "february", "march", "april", "may", "june", "july",
                  "august", "september", "october", "november", "december"];
    } else {
        months = ["jan", "feb", "march", "april", "may", "june", "july",
                  "aug", "sept", "oct", "nov", "dec"];
    }
    var idx = 0;
    for(var i = 0; i < months.length(); i++) {
        idx = tmp_str.indexOf(months[i], 0);
        if (idx >= 0) {
            idx = idx + months[i].length;
            while (str.charAt(idx) == ' ')
              idx ++;
            return idx;
        }
    }
    return -1;
}

function getTimeStartIdx(str)
{
    var n = 0, spaceIdx= 0;
    if (window.dateformat == "DD de MONTH de YYYY") {
        spaceIdx = str.lastIndexOf("de", 0);
        n = 2;
    }
    else if (window.dateformat == "DD MONTH, YYYY") {
        spaceIdx = str.indexOf(",", 0);
        n = 2;
    }
    else if (window.dateformat == "DD-MONTH-YYYY") {
        spaceIdx = str.lastIndexOf("-", 0);
        n = 1;
    }
    else if (window.dateformat == "DD MONTH YYYY") {
        spaceIdx = searchMonth(str, true);
        n = 1;
    }
    else if (window.dateformat == "DD. Mon YYYY") {
        spaceIdx = searchMonth(str, false);
        n = 1;
    }
    else if (window.dateformat == "YYYY년 MM월 DD?") {
        spaceIdx = 0;
        n = 3;
    } else {
        spaceIdx = 0;
        n = 1;
    }

    for (var i = 0; i < n; ++i) {
        spaceIdx = str.indexOf(" ", spaceIdx + 1);
        if (spaceIdx < 0)
          break;
    }
    return spaceIdx;
}

function validate_date(fldvalue, doalert, id)
{
    var dt = NLDate_parseString(fldvalue, doalert, id);
    var ret;
    if(dt == null)
    {
        ret = { validflag:false }
    }
    else
    {
        ret = { validflag:true, value: getdatestring(dt) };
    }
    return ret;
}

function checkForQuirks(type, value, id)
{
    var quirkText = "";
    switch(type)
    {
        case "mmdddate":
        case "visiblepassword":
        case "printeroffset":
        case "metricprinteroffset":
            quirkText = "Field Type Actually used! (Now removed from validation))";
            break;

        case "integer":
        case "posinteger":
        case "float":
        case "posfloat":
        case "nonnegfloat":
            if (value.indexOf("%") >= 0)
                quirkText = "% found in non-percent type";
            break;

        case "currency":
        case "currency2":
        case "poscurrency":
            if (value.substring(1).search(/[\+\-\*\/]/g) >= 0)
                quirkText = "Equation detected";
            break;

        default:
            return;
    }

    if (quirkText !== "")
        makeValidationQuirkLog(type, value, quirkText, id)
}

function makeValidationQuirkLog(type, value, description, id)
{
    var fieldId = id || "";
    var activeScript = window.NLScriptId || "(UI)";
    var recordType = (typeof nlapiGetRecordType !== "undefined") ? nlapiGetRecordType() : "?";
    nsServerCall(nsJSONProxyURL, "logValidationQuirk", [type, value, description, fieldId, activeScript, recordType]);
}

function _doValidate(options)
{
	var validator = require("N/validator"),
		fieldId = options.fieldId,
		type = options.type,
		value = options.value,
		minVal = options.minVal,
		maxVal = options.maxVal,
		mandatory = options.mandatory;

	return validator.validateField(fieldId, type, value, false, false, null, minVal, maxVal, undefined, mandatory);
}

function validate_field(field, type, doalert, autoplace, minval, maxval, mandatory, separator)
{
    if ((typeof validationFlowSwitch !== "undefined") && validationFlowSwitch.usesNewPath && (typeof require !== "undefined") && checkForModuleDependency())
    {
        if (field.value !== undefined  && field.value !== "")
        {
            var isValid = false;
            NS.form.setValid(false);
	        var formatModule = require("N/format");
            var validateMe = formatModule.parse(field.value, type);
            try
            {
	            _doValidate({fieldId: field.name, type: type, value: validateMe, minVal: minval, maxVal: maxval, mandatory: mandatory});
	            isValid = true;
            }
            catch (e)
            {
                if (doalert)
                    alert(e.message);
                isValid = false;
            }
            finally
            {
                field.value = formatModule.format(validateMe, type);
            }

            if (!isValid)
            {
                selectAndFocusField(field);
            }
            NS.form.setValid(isValid);

            return isValid;
        }
    }
    else
    {
        return old_validate_field(field, type, doalert, autoplace, minval, maxval, mandatory, separator);
    }
}

function getTotalDigitCount(numberString)
{
    numberString = numberString + ''; // convert the parameter to string just in case that it's already a number
    if(numberString == '')
        return 0;
    else
    {
        numberString = numberString.replace('-',''); // remove minus sign
        if(numberString.indexOf(".") > 0)
        	numberString = numberString.replace(/0*?$/, '').replace('.',''); // remove trailing 0's and decimal point
	    return numberString.length;
	}
}

function selectAndFocusField(field)
{
    if (isIE)
    {
        try
        {
            field.focus();
            field.select();
        }
        catch(err)
        {
            //do nothing.
            //issue 206079, field is not visible, IE throws an exception when try to focus on it, Jieping suggested to put try/catch block here
        }
    }
    else
    {
       // Use a zero timeout to force Firefox to perform this after processing the rest of this event.
       // Since this is likely to be an onBlur event, this will get overridden by the browser continuing
       // continuing to give focus to the next field.
       // Issue 233790 Similar problem in IE 11 and Safari 6. Zero timeout is not enough in this case.
       setTimeout(function() { field.focus(); field.select(); }, 50);
    }
}

function setSelectionRange(input, selectionStart, selectionEnd) {
  if (input.setSelectionRange) {
    input.focus();
    // Issue 235915: Newer versions of Firefox silently throws an error which prevents filtering from finishing
    // Catching this error allows it to finish properly. (Reproduced on FF12, FF18. No problem on FF3)
    try
    {
        input.setSelectionRange(selectionStart, selectionEnd);
    }
    catch (e)
    {
    }
  }
  else if (input.createTextRange) {
    var range = input.createTextRange();
    range.collapse(true);
    range.moveEnd('character', selectionEnd);
    range.moveStart('character', selectionStart);
    range.select();
  }
}

function clearMultiSelect(sel)
{
    if ( isNLMultiDropDown( sel ) )
        getMultiDropdown( sel ).removeAll();
    else if (sel.type == "select-multiple")
    {
        for (var i=sel.length-1; i >=0 ; i-- )
            sel.options[i].selected = false;
    }
    else
    {
        sel.value='';
        if (sel.form.elements[sel.name+'_display'] != null)
            sel.form.elements[sel.name+'_display'].value='';
    }
}

function getnamevaluelisttext(val,delim,alllabels)
{
    if (val == null || val.length == 0)
        return "";
    var nvarray = val.split(String.fromCharCode(4));
    var result = "";
    for (var i=0; i < nvarray.length; i++)
    {
        var nv = nvarray[i].split(String.fromCharCode(3));
        var dv = nv.length==5?nv[4]:nv[3];
        if ((dv != null && dv.length > 0) || alllabels == true)
        {
            if (!isValEmpty(result)) result += delim;
            result += nv[2]+": "+dv;
        }
    }
    return result;
}

function getnamevaluelistdata(val)
{
    if (val == null || val.length == 0)
        return "";
    var nvarray = val.split(String.fromCharCode(4));
    var result = "";
    for (var i=0; i < nvarray.length; i++)
    {
        if (i>0)
            result += String.fromCharCode(4);
        var nv = nvarray[i].split(String.fromCharCode(3));
        var v = nv.length>3?nv[3]:"";
        result += nv[0]+String.fromCharCode(3)+v;
    }
    return result;
}

function getnamevaluelistvalue(nvlist,name)
{
    if (nvlist == null || nvlist.length == 0)
        return null;
    var nvarray = nvlist.split(String.fromCharCode(4));
    for (var i=0; i < nvarray.length; i++)
    {
        var nv = nvarray[i].split(String.fromCharCode(3));
        if (nv[0].toLowerCase() == name.toLowerCase())
            return nv[3];
    }
    return null;
}

function getnamevaluelistdisplayvalue(nvlist,name)
{
    if (nvlist == null || nvlist.length == 0)
        return null;
    var nvarray = nvlist.split(String.fromCharCode(4));
    for (var i=0; i < nvarray.length; i++)
    {
        var nv = nvarray[i].split(String.fromCharCode(3));
        if (nv[0].toLowerCase() == name.toLowerCase())
            return nv.length==5?nv[4]:nv[3];
    }
    return null;
}

function setnamevaluelistvalue(nvlist,name,value)
{
    if (nvlist == null || nvlist.length == 0)
        return "";
    var nvarray = nvlist.split(String.fromCharCode(4));
    for (var i=0; i < nvarray.length; i++)
    {
        var nv = nvarray[i].split(String.fromCharCode(3));
        if (nv[0].toLowerCase() == name.toLowerCase())
        {
            nv[3] = value;
            nvarray[i] = nv.join(String.fromCharCode(3));
            break;
        }
    }
    return nvarray.join(String.fromCharCode(4));
}

function syncnamevaluelist(list)
{
    var fldDisp = list.form.elements[list.name+"_display"];
    fldDisp.value = getnamevaluelisttext(list.value,"\n", true);
    if(fldDisp.onchange)
    {
        fldDisp.onchange();
    }
}

function syncpopupmachinefield(machine, fld, line, value)
{
    if (machine == null)
        nlapiSetFieldValue(fld, value);
    else if (line != null)
        nlapiSetLineItemValue(machine, fld, line, value);
    else
        nlapiSetCurrentLineItemValue(machine, fld, value);
}

/*
Handles key presses on a name-value list (such as item options).

- Hitting <SPACE> on a name-value list pops-up its options dialog.
- The call to this handler is set up in NLField.java (NLField.getInputTag())
*/
function NLNameValueList_onKeyPress(evt, sFieldName, sOptionHelperSuffix)
{
    var keyCode = getEventKeypress(evt);

    if( keyCode == 32 ) // <SPACE>
    {
        // if the user hit <SPACE> find the helper icon which pops-up the options dialog and click it
        var ndAction = document.getElementById(sFieldName + '_helper_' + sOptionHelperSuffix);
        if( ndAction && ndAction.click)
        {
            ndAction.click();
        }
    }
    return true;
}

function synclist(list,val,makedefault)
{
    if (isNLDropDown(list))
    {
        var dd = getDropdown(list);
        if(dd != null)
        {
            var idx = dd.getIndexForValue(val);
            dd.setIndex(idx, true /* don't fire onchange */);
            if (makedefault)
            {
                dd.setDefaultIndex(idx);
                list.setAttribute("defaultValue", val); // defaultValue is used in clearline() of inline edit machine to reset field value for non IE browsers
            }
        }
    }
    else if (list.type == 'select-one')
    {
        for (var i=0; i < list.length; i++)
        {
            if (list.options[i].value == val)
            {
                list.selectedIndex=i;
                if (makedefault)
                {
                    list.options[i].defaultSelected = true;
                    list.setAttribute("defaultValue", val); // defaultValue is used in clearline() of inline edit machine to reset field value for non IE browsers
                }
                break;
            }
        }
    }
    else
    {
        list.value = val;
        if (makedefault)
            list.setAttribute("defaultValue", val); // ddefaultValue is used in clearline() of inline edit machine to reset field value for non IE browsers

    }
}

function syncpopup(list,val,name,makedefault)
{
    var i, dd;
    if (isNLDropDown(list))
    {
        dd = getDropdown(list);
        var idx = dd.getIndexForValue(val);
        dd.setIndex(idx, true /* don't fire onchange */);
        if (makedefault)
            dd.setDefaultIndex(idx);
    }
    else if (isNLMultiDropDown(list))
    {
        dd = getMultiDropdown(list);
        dd.setValues(val);
    }
    else if (list.type == "select-one" || list.type == "select-multiple")
    {
        for (i=0; i < list.length; i++)
        if (list.options[i].value == val)
        {
            list.selectedIndex=i;
            if (makedefault)
                list.options[i].defaultSelected = true;
            break;
        }
    }
    else if ( isPopupSelect( list ) )
    {
        list.value = val;
        if (makedefault)
            list.setAttribute('defaultValue', val);
        var dispfld = list.form.elements[list.name+"_display"];
        if ((val != null && val.length > 0) || (name != null && name.length > 0))
        {
            if (typeof name != "undefined" && name != null)
            {
                dispfld.value = name;
                dispfld.style.color='#000000';
                if (makedefault)
                    dispfld.defaultValue = name;
            }
        }
        else if (list.getAttribute('onlyAllowExactMatch') == null)
        {
            dispfld.value = dispfld.type == 'text' ? _popup_help : _mult_popup_help;
            dispfld.style.color='#999999';
            if (makedefault)
                dispfld.defaultValue = dispfld.value;
        }
    }
    else
    {
        list.value = val;
        if (makedefault)
            list.defaultValue = val;
    }
}

function syncmultiselectlist(list,val,labels, bDontFireOnChange)
{
    clearMultiSelect(list);
	if ( typeof val != "string" && !isArray(val) )
		val = ""+val;
	if (isNLMultiDropDown(list))
    {
        if ( typeof val != "string" )
            val = val.join( String.fromCharCode(5) );
        var dd = getMultiDropdown(list);
        dd.setValues(val, bDontFireOnChange);
    }
    else if (list.type != "select-multiple")
    {
        list.form.elements[list.name].value = val;
		labels = emptyIfNull(labels);
		var delimiter = labels.indexOf(String.fromCharCode(5)) != -1 ? String.fromCharCode(5) : "\n"
		var labelsfld = list.form.elements[list.name+"_labels"];
		if (labelsfld != null)
			labelsfld.value = isValEmpty(val) ? "" : labels.split(delimiter).join(String.fromCharCode(5));
		var displayfld = list.form.elements[list.name+"_display"];
		if (displayfld != null && list.getAttribute('onlyAllowExactMatch') == null)
			displayfld.value = labels ? labels.split(delimiter).join('\n') : _mult_popup_help;
    }
    else
    {
        if ( typeof val == "string" )
            val = val.split( String.fromCharCode(5) );
        for ( var i=0; i < val.length; i++)
        {
            for ( var j=0; j < list.length; j++)
            {
                if (list.options[j].value == val[i])
                    list.options[j].selected = true;
            }
        }
    }
}

/*
    Note to optimizing developers: this implementation intentionally updates both selected elements AND non selectd
    elements (with .checked = false, of course. This is necessary when run in the "virtual browser", which uses
    a "fake" DOM and does not automaticallly deselect the elements whose values do not match the one being selected.
*/
function syncradio(radio,val,makedefault)
{
    var i;
    var selected;
    for (i=0; i < radio.length; i++)
    {
     	selected = radio[i].value == val;
		radio[i].checked=selected;
		if (makedefault)
			radio[i].defaultChecked = selected;
    }
}
function getlisttext(list, val, frommultisel)
{
    if (isNLDropDown(list))
        return getDropdown(list).getTextForValue(val);
    if (list.type != "select-one" && !frommultisel)
        return '';
    for (var i=0; i < list.length; i++)
        if (list.options[i].value == val)
            return list.options[i].text;
    return "";
}
function getmultiselectlisttext(list, val, delim)
{
    if (!delim)
        delim = '<br>';

    if ( isNLMultiDropDown(list) )
    {
        return getMultiDropdown(list).getSelectedTextFromValues(val, delim);
    }
    else if (list.type != "select-multiple")
    {
        return '';
    }
    else
    {
        var selvals = val.split(String.fromCharCode(5));
        var label = '';
        for (var i=0; i < selvals.length; i++)
        {
            if (i > 0) label += delim;
                label += getlisttext(list, selvals[i], true);
        }
        return label;
    }
}

function getradiotext(radio, val)
{
    var i;
    for (i=0;i< radio.length;i++)
        if (radio[i].value == val)
            return radio[i].textValue;
    return "";
}

function getRadioValue(radio)
{
    var val = '';
    if (typeof radio.length=="undefined") // a radio input is passed in
        radio = radio.ownerDocument.getElementsByName(radio.name);
    for (var i=0; i < radio.length; i++)
    {
        if (radio[i].checked == true)
        {
            val = radio[i].value;
            break;
        }
    }
    return val;
}

function getSelectedRadio(radio)
{
    var val = null;
    if (typeof radio.length == "undefined") // a radio input is passed in
        radio = radio.ownerDocument.getElementsByName(radio.name);
    for (var i=0; i < radio.length && val == null; i++)
		val = radio[i].checked ? radio[i] : null;
    return val;
}

// YF, WB: We handle empty drop downs by returning an empty String which is essentially the same
// as the drop down having a blank option. The bug we were fixing (#17135) was caused when the
// syncwithholdid() function was called when creating a new employee without any active
// withholding items....
function getSelectValue(sel)
{
    var returnMe;
    if (sel.type != null && sel.type == "select-one")
        returnMe = (sel.options.length == 0 || sel.selectedIndex == -1 || sel.selectedIndex >= sel.options.length) ? '' :  sel.options[sel.selectedIndex].value;
    else if (isMultiSelect(sel))
        returnMe = getMultiSelectValues(sel);
    else if (isNLDropDown(sel))
        returnMe = getDropdown(sel).getValue();
    else if (isNLMultiDropDown(sel))
        returnMe = getMultiDropdown(sel).getSelectedValues();
    else
        returnMe = sel.value;
    return returnMe;
}
function getSelectValueArray(sel)
{
    var returnMe;
    if (sel.type == "select-one" || sel.type == "select-multiple")
    {
        returnMe = new Array(sel.length);
        for ( var i = 0; i < sel.length; i++ )
            returnMe[i] = sel.options[i].value;
    }
    else if (isNLDropDown(sel))
        returnMe = getDropdown(sel).valueArray;
    else if (isNLMultiDropDown(sel))
        returnMe = getMultiDropdown(sel).valueArray;
    return returnMe;
}

function getIndexForValue(sel,val)
{
    var returnMe=-1;
    if (sel.type == "select-one" || sel.type == "select-multiple")
    {
        for ( var i = 0; i < sel.length; i++ )
            if(sel.options[i].value==val)
            {
                returnMe=i;
                break;
            }
    }
    else if (isNLDropDown(sel))
        returnMe = getDropdown(sel).getIndexForValue(val);
    else if (isNLMultiDropDown(sel))
        returnMe = getMultiDropdown(sel).getIndexForValue(val);
    if (typeof(returnMe) == "undefined")
     	returnMe = -1;
	return returnMe;

}

function getSelectTextForValue(  sel, val )
{
    if (!isBackend) {
        var textArray = getSelectValueArray(sel);
        var i;
        for (i = 0; i < textArray.length; i++)
        {
            if (textArray[i] == val)
                return getSelectTextAtIndex(sel, i);
        }
        return null;
    } else {
        return '';
    }
}

function addSelectOption(doc,sel,text,value,selected,win,idx)
{
    if (!isBackend)
    {
        if (isNLDropDown(sel))
        {
            var dd = getDropdown(sel,win);
            if (dd == null)
                return;

            dd.addOption(text, value, idx);
            if (selected !== false)
            {
                var idx = dd.getIndexForValue(value);
                dd.setIndex(idx, true /* don't fire onchange */);
            }
        }
        else if (isNLMultiDropDown(sel))
        {
            var dd = getMultiDropdown(sel,win);
            if (dd == null)
                return;

            dd.addOption(text, value, selected, idx);
        }
        else if (isPopupSelect(sel))
        {
	        throw "Unsupported operation: Adding options to a popup select"
        }
        else
        {
            var opt = doc.createElement('OPTION');
            opt.text= text;
            opt.value= value;
            if (isIE)
            {
                if (typeof(idx)=='undefined') idx = sel.length;
                sel.add(opt, idx);
            }
            else
            {
                var optInsertBefore = null;
                if (typeof(idx)!='undefined' && idx >=0 && idx < sel.length)
                    optInsertBefore = sel.options[idx];
                sel.add(opt, optInsertBefore);
            }
            if (selected !== false)
            {
                opt.selected = true;
                /* This next line is redundant and throws exceptions on Netscape 7.x browsers when then select field is disabled. */
                if (isIE)
                    sel.selectedIndex = idx;
            }
        }
    }
}

function getSelectTextArray(sel)
{
    var returnMe;
    if (sel.type == "select-one" || sel.type == "select-multiple")
    {
        returnMe = new Array(sel.length);
        for ( var i = 0; i < sel.length; i++ )
            returnMe[i] = sel.options[i].text;
    }
    else if (isNLDropDown(sel))
        returnMe = getDropdown(sel).textArray;
    else if (isNLMultiDropDown(sel))
        returnMe = getMultiDropdown(sel).textArray;
    return returnMe;
}

function getSelectText(sel, returnArray)
{
	var val = getSelectValue(sel);
	if (sel.type == "select-one")
        return (sel.options.length == 0 || sel.selectedIndex == -1 || sel.selectedIndex >= sel.options.length) ? null : sel.options[sel.selectedIndex].text;
    else if (isNLDropDown(sel))
        return getDropdown(sel).getText();
    else if ( isMultiSelect(sel) || isPopupMultiSelect( sel ) )
        return getMultiSelectText( sel, null, returnArray );
    else if ( isPopupSelect( sel ) )
        return isValEmpty(val) ? '' : getFormElement(sel.form,sel.name+'_display').value.replace(/\s$/,'');
    else if ( isDisplayOnlySelect( sel ) )
        return getInlineTextValue(document.getElementById(sel.name+"_displayval"));
    else
        return sel.text;
}

function setSelectValue(sel, val)
{
    if (window.virtualBrowser)
    {
        sel.value = val;
    }
    else if (isNLDropDown(sel))
    {
        var dd = getDropdown(sel);
        var idx = dd.getIndexForValue(val);
        if (idx == null)
            return false;
        dd.setIndex(idx, true /* don't fire onchange */);
        // if this NLDropdown is currently open, we also need to set the
        // current cell so that the value is not out of sync with the selection
        if(dd.isOpen)
            dd.setCurrentCellInMenu(dd.divArray[idx]);

    }
    else if (isNLMultiDropDown(sel))
    {
        var dd = getMultiDropdown(sel);
        var idx = dd.getIndexForValue(val);
        if (idx == null)
            return false;
        dd.setIndex(idx);
    }
    else if (sel.type == "select-one")
    {
        var opt = sel.options;
        for (var i=0; i < opt.length; i++)
        {
            if (opt[i].value==val)
            {
                sel.selectedIndex=i;
                return true;
            }
        }
        return false;
    }
    else if (sel.type == "select-multiple")
    {
        var opts = sel.options;
        var result = false;
        for (var i=0; i < opts.length; i++)
        {
            opts[i].selected = opts[i].value == val;
            result = result || opts[i].value == val;
        }
        return result;
    }
    else
    {
        sel.value = val;
        if (val.length == 0 && isPopupSelect( sel ) )
        {
            var dispfld = sel.form.elements[sel.name+"_display"];
            dispfld.value = dispfld.type == 'text' ? _popup_help : _mult_popup_help;
            dispfld.style.color = '#999999';
        }
    }
    return true;
}

function addMultiSelectValue(sel, val, name)
{
    if (isNLMultiDropDown(sel))
    {
        var dd = getMultiDropdown(sel);
        var idx = dd.getIndexForValue(val);
        dd.addIndex(idx);
    }
    else if (sel.type == "select-multiple")
    {
        var opts = sel.options;
        for (var i=0; i < opts.length; i++)
            if ( opts[i].value == val )
                opts[i].selected = true;
    }
    else
    {
        var values = sel.value.split(String.fromCharCode(5));
        for (var i=0;i < values.length;i++)
            if (values[i] == val) return;
        sel.form.elements[sel.name+"_display"].style.color = '#000000';
        if (values.length == 0 || values[0].length == 0)
        {
            sel.value = val;
            sel.form.elements[sel.name+"_display"].value = name;
            sel.form.elements[sel.name+"_labels"].value = name;
        }
        else
        {
            sel.value += String.fromCharCode(5)+val;
            sel.form.elements[sel.name+"_labels"].value += String.fromCharCode(5)+name;
            var lines = sel.form.elements[sel.name+"_display"].value.split(/\n|\r/);
            if (lines.length == values.length)
                sel.form.elements[sel.name+"_display"].value += "\n"+name;
            else
            {
                lines[values.length] = name;
                sel.form.elements[sel.name+"_display"].value = lines.join("\n");
            }
        }
    }
}

/*
The multiselect user input is a list of strings seperated seperated by\n\r.
This method will return the substring that the user is typing in(i.e. with curosr in).
@param inputField this is the field the user is typing in, not the hidden value field
*/
function getCurrentMultiSelectUserInputValue (inputField)
{
    var selectionStartPos = getSelectedTextRange(inputField)[0];
    var subStrBefore = inputField.value.substr(0, selectionStartPos);
    var startPos = Math.max(subStrBefore.lastIndexOf('\n'), subStrBefore.lastIndexOf('\r')) + 1;
    var endPos = inputField.value.substr(selectionStartPos).search(/\n|\r/);
    endPos = endPos == -1? inputField.value.length : selectionStartPos + endPos;
    return inputField.value.substring(startPos, endPos);
}

function getSelectValueForText(sel, txt)
{
    var textArray = getSelectTextArray(sel);
    for (var i = 0; i < textArray.length; i++)
    {
        if (textArray[i] == txt)
            return getSelectValueAtIndex(sel, i);
    }
    return null;
}

function deleteAllSelectOptions(sel, win)
{
    if (isNLDropDown(sel))
    {
        getDropdown(sel, win).deleteAllOptions();
    }
    else if (isNLMultiDropDown(sel))
    {
        getMultiDropdown(sel, win).deleteAllOptions();
    }
    else if (sel.type == 'select-one' || sel.type == 'select-multiple')
    {
        sel.options.length = 0;
    }
    else if ( sel.form.elements[sel.name+"_display"] != null )
    {
        sel.form.elements[sel.name+"_display"].value = "";
        sel.value = "";
    }
}

/*
 * Delete one option from a select's list of options.  This is a wrapper that works for various implementation
 * classes for selects, including NLDropdown and NLMultiDropdown.  It tries to do the right thing for each
 * different implementation class.
 *
 * bDontSetWidth is passed to the NLDropdown.deleteOneOption() method if sel is an NLDropdown.
 * It tells that method not to set the width of the select.  Use it in cases where calling setWidth
 * would mess up the page layout, e.g. when each row of a machine has a select, but deleteOneSelectOption()
 * is called on some of them, but not on others.  setWidth() would make the ones that deleteOneSelectOption()
 * is called on be a different width from the others, which would look bad and make everyone laugh at you.
 */
function deleteOneSelectOption(sel, value, bDontSetWidth)
{
    if (isNLDropDown(sel))
    {
        getDropdown(sel).deleteOneOption(value, bDontSetWidth);
    }
    else if (isNLMultiDropDown(sel))
    {
        getMultiDropdown(sel).deleteOneOption(value);
    }
    else if (sel.type == 'select-one' || sel.type == 'select-multiple')
    {
        var opts = sel.options;
        for (var i=0; i < opts.length; i++)
            if (opts[i].value == value)
                opts[i] = null;
    }
    else if ( sel.form.elements[sel.name+"_display"] != null )
    {
        sel.form.elements[sel.name+"_display"].value = "";
        sel.value = "";
    }
}

function getSelectIndex(sel,win)
{
    if (isNLDropDown(sel))
    {
        return getDropdown(sel,win).getIndex();
    }
    else
    {
        return sel.selectedIndex;
    }
}

function setSelectIndex(sel, val)
{
    if (isNLDropDown(sel))
    {
        return getDropdown(sel).setIndex(val, true /* don't fire onchange */);
    }
    else if (isNLMultiDropDown(sel))
    {
        return getMultiDropdown(sel).setIndex(val);
    }
    else
    {
        sel.selectedIndex = val;
    }
}

function setMultiSelectValues(sel, val)
{
    syncmultiselectlist( sel, val );
}

function getMultiSelectValues( sel, returnArray )
{
    var val = null;
    if (isMultiSelect(sel))
    {
        if ( isNLMultiDropDown(sel) )
            val = getMultiDropdown(sel).getSelectedValues();
        else
        {
            val = '';
            for (var i=0; i < sel.length; i++)
            {
                if (sel.options[i].selected)
                    val += ((val == '' ? '' : String.fromCharCode(5)) + sel.options[i].value);
            }
        }
    }
    else
        val = sel.value;
    return returnArray ? (isValEmpty( val ) ? [] : val.split( String.fromCharCode(5) )) : val;
}

function getMultiSelectText(sel,inmachine,returnArray)
{
	var val = '';
	var delim = returnArray ? String.fromCharCode(5) : ", ";
	if ( isMultiSelect(sel) )
    {
		delim = inmachine ? '\n' : delim;
		if ( isNLMultiDropDown(sel) )
            val = getMultiDropdown(sel).getSelectedText( delim );
        else
        {
            var i, numParams = 0;
            for (i=0; i < sel.length; i++)
            {
                if (sel.options[i].selected)
                    val += ((numParams++ == 0 ? '' : ( delim )) + sel.options[i].text);
            }
        }
    }
    else if ( isPopupMultiSelect( sel ) )
    {
        val = getFormElement(sel.form,sel.name+'_labels').value;
        if ( val != null && delim != String.fromCharCode(5) )
            val = val.replace( new RegExp( String.fromCharCode(5), "g" ), delim )
    }
    else
        val = sel.text;
	return returnArray ? (isValEmpty( val ) ? [] : val.split( delim )) : val;
}

function updateMultiSelectValue(fld,displayfld,val,displayval,labelsfld)
{
    fld.value = val;
    labelsfld.value = displayval;
    var sellabels = displayval.split(String.fromCharCode(5));
    var displaytempval = '', numParams = 0;
    for (var i=0; i < sellabels.length; i++)
    {
        displaytempval += ((numParams==0 ? '' : '\n') + sellabels[i]) ;
        numParams++;
    }
    displayfld.value = displaytempval;
}

function setSelectOptionText(sel,value,text,win)
{
    if (isNLDropDown(sel))
    {
        var dd = getDropdown(sel,win);
        dd.setOptionText(value,text);
    }
    else if (sel.type == 'select-one' || sel.type == 'select-multiple')
    {
        var opts = sel.options;
        for (var i=0; i < opts.length; i++)
            if (opts[i].value == value)
                opts[i].text = text;
    }
}

/* Retrieve style value at runtime for any object.. The second argument is only required for Mozilla
   i.e. getCascadedStyle( field, "backgroundColor", "background-color") returns the current background color for a field */
function getCascadedStyle(object, property, attribute)
{
    if ( object.currentStyle )
        return object.currentStyle[property];
    else if ( window.getComputedStyle )
    {
        // process NODE_ELEMENT objects only
        if ( object.nodeType != 1 )
            return null;
        var objStyle = window.getComputedStyle(object, "");
        if (objStyle)
            return objStyle.getPropertyValue( attribute );
    }
    return null;
}

// call this one if you want to know if a FIELD element is focusable %>
function isFocusable( fld )
{
    if ( fld == null || (typeof fld.type == "undefined" && !isNLDropDownSpan(fld)) || fld.type == "hidden" || fld.disabled || fld.type == "button")
        return false;
    return elementIsFocusable(fld);
}

// call this one if you want to know if ANY block level element is focusable
function elementIsFocusable(elem)
{
    while ( elem != null )
    {
        var visibility = getCascadedStyle(elem, "visibility", "visibility");
        var display = getCascadedStyle(elem, "display", "display");
        if ( display == 'none' || visibility == 'hidden' || visibility == 'hide' )
            return false;
        elem = elem.parentNode;
    }
    return true;
}

function NLIsButton(elem)
{
    return elem &&
        (elem.tagName == "BUTTON" || (elem.tagName == "INPUT" && ( elem.type == "submit" || elem.type == "button" || elem.type == "reset")));
}

function NLDisableButton(elem, val)
{
    elem.disabled = val;
    if (elem.className.indexOf("nlbutton") >= 0 || elem.className.indexOf("bgbutton") >= 0 || elem.className.indexOf("nlinlineeditbutton") >= 0)
        elem.className = elem.className.split("Disabled")[0] + (val ? "Disabled" : "");


    //if the buttons is a styled button, change styles by changing the parent css class
    if ((elem.className.indexOf('bntBgT') >= 0) && (elem.name))
    {
        var trElem = document.getElementById('tr_' + elem.name);
        if (trElem && trElem.className)
        {
        	if (val)
        	{
        		// make sure that the button class is not disabled already. function can be called multiple times.
        		if (trElem.className.indexOf('Dis') < 0)
        			trElem.className = trElem.className +'Dis';
        	}
        	else
        		trElem.className = trElem.className.replace('Dis', '');

        }
    }
}

function NLIsSubmitButton(elem)
{
	return elem && (elem.tagName == "INPUT") && (elem.type == "submit");
}

//simulate a button click for secondary buttons. The primary element (on the main form) gets passed in
//click() will call onClick event handlers and will submit if the button is a submit button
function NLInvokeButton(elem)
{
	if (elem)
    {
    	//Check to see if the button is disabled
    	if (elem.disabled)
    		return;

        elem.click();
    }
}

function NLAddButtonDisabledMessage(container, name, message)
{
	var obj = document.getElementById(container);
    var elem = document.getElementById(name);
	if (obj == null || elem == null)
		return;

	var positionX = findGlobalPosX(obj);
	var positionY = findGlobalPosY(obj);
	var objWidth = obj.offsetWidth;
	var objHeight = obj.offsetHeight;

	var tDiv = document.createElement('div');
	tDiv.style.position = "absolute";
	tDiv.style.left = positionX + 'px';
	tDiv.style.top = positionY + 'px';
	tDiv.style.width = objWidth  + 'px';
	tDiv.style.height = objHeight  + 'px';
	tDiv.style.background = '#000000';
	tDiv.style.opacity = '0';
	tDiv.style.zindex = '100';

	attachEventHandler('mouseover', tDiv, function(){ nlShowMessageTooltip(elem, message);} );
	attachEventHandler('mouseout', tDiv, function(){ closePopup();} );
    attachEventHandler('click', tDiv, function() {if (!elem.disabled)	elem.onClick();} );

	obj.appendChild(tDiv);
}

function getSubmitButton(name, value)
{
    var allInputs = document.getElementsByName(name);
    for (var i = 0; i < allInputs.length; i++)
    {
        var input = allInputs[i];
        if (NLIsSubmitButton(input) && (value == null || value == input.value))
        {
            return input;
        }
    }

    return null;
}

function isDisplayOnlySelect(sel)
{
    return sel != null && sel.type == "hidden" && document.getElementById(sel.name+'_displayval' ) != null;
}

function isPopupSelect(sel)
{
    return sel != null && sel.type == "hidden" && getFormElement(sel.form, sel.name+'_display' ) != null && getFormElement(sel.form, sel.name+'_display' ).type == "text";
}

function isPopupMultiSelect(sel)
{
    return sel != null && sel.type == "hidden" && getFormElement(sel.form, sel.name+'_display' ) != null && getFormElement(sel.form, sel.name+'_display' ).type == "textarea" && getFormElement(sel.form, sel.name+'_labels' ) != null;
}

// Helper functions placed here (instead of NLAppUtil.jsp) because of NLAPI.jsp dependencies
function NLPopupSelect_setExactMatchQuery(sel, b)
{
    sel.setAttribute('exactMatchQuery', b ? 'T' : 'F');
}

function NLPopupSelect_getExactMatchQuery(sel)
{
    return sel.getAttribute('exactMatchQuery') == 'T';
}

function isSelect(sel)
{
    return  sel != null && ( sel.type == "select-one" || isNLDropDown( sel ) );
}

function isMultiSelectInput(sel)
{
	return sel != null && sel.type == "hidden" && document.getElementById(sel.name+'_multiselect' ) != null;
}

function isNLDropDown(sel)
{
    return sel.className && sel.className.indexOf('nldropdown')>=0;
}

function isNLDropDownSpan(span)
{
    return span != null && span.tagName == 'SPAN' && window.getDropdown != null && getDropdown(span) != null;
}

function isMultiSelect(sel)
{
    return  sel != null && (isNLMultiDropDown(sel) || sel.multiple || sel.type == 'select-multiple');
}

function isNLMultiDropDown(sel)
{
    // Check for a very common error on Firefox. Given an expression
    // "someform.elements['item'], IE will always return the element
    // named 'item' (if it exists). On Firefox, the "elements" array
    // has a method named 'item' which is used for numerically indexing
    // the array. Instead of returning a reference to a Javascript
    // object or HTML element, Firefox returns a reference to the
    // function. This IE-specific construct is still being used in
    // some places and it quite often causes errors in this function
    // because the function "item" does not have a "getAttribute"
    // method, so a run-time error occurs. If something like a button
    // works on IE, but seems to be completely dead on Firefox, it is
    // often because of this Javascript error. Running the test on
    // Firefox in a dev environment will catch this error and immediately
    // show an alert explaining it (and what should be done about it).
    return sel != null && sel.getAttribute && !isValEmpty(sel.getAttribute("nlmultidropdown"));
}

function isRichTextEditor(fld)
{
	return  fld != null && window.getHtmlEditor != null && getHtmlEditor( fld.name ) != null;
}

// This method detects the rich text even in case it has not been registered yet.
function isRichTextEditorUnregisteredSafe(fld)
{
	if (fld == null)
		return false;
    return fld.className != null && fld.className.indexOf('rteditor') != -1;
}

function isSummaryField(fld)
{
	return  fld.className && fld.className.indexOf('nlsummary')>=0;
}

function resetlist(sel)
{
    if ( sel != null )
    {
        if (sel.type == "select-one" || sel.type == 'select-multiple')
        {
            var i;
            for (i=0; i < sel.length; i++)
            {
                if (sel.options[i].defaultSelected)
                {
                    sel.selectedIndex=i;
                    return;
                }
            }
            sel.selectedIndex=0;
        }
        else if (isNLDropDown(sel))
        {
            getDropdown(sel).resetDropDown();
        }
        else if (isNLMultiDropDown(sel))
        {
            getMultiDropdown(sel).resetDropDown();
        }
        else
        {
            sel.value = sel.defaultValue;
            sel.form.elements[sel.name+"_display"].value = sel.form.elements[sel.name+"_display"].defaultValue;
        }
    }
}

function setFieldFocus(fld)
{
    if ( isSelect( fld ) || isMultiSelect( fld ) || isPopupSelect( fld ) || isPopupMultiSelect( fld ) )
        setSelectFocus( fld );
    else if ( window.getHtmlEditor != null && window.getHtmlEditor( fld.name ) != null )
        window.getHtmlEditor( fld.name ).setFocus();
    else if ( isFocusable( fld ) )
        fld.focus();
}

function setSelectFocus(sel,win)
{
    if ( sel != null )
    {
        if (sel.type == "select-one" || sel.type == "select-multiple")
        {
            if ( isFocusable( sel ) )
                sel.focus();
        }
        else if (isNLDropDown(sel))
        {
            if ( isFocusable( getDropdown(sel,win).getContainer( ) ) )
                getDropdown(sel,win).setFocus();
        }
        else if (isNLMultiDropDown(sel))
        {
            if ( isFocusable( getMultiDropdown(sel,win).getContainer( ) ) )
                getMultiDropdown(sel,win).setFocus();
        }
        else
        {
            if ( isFocusable( sel.form.elements[sel.name+"_display"] ) )
                sel.form.elements[sel.name+"_display"].focus();
        }
    }
}

// Call this function on a select to set it's value back to what it was when the page first rendered.
// This was implemented to support page_reset on options slaves and does not ensure that the options in the
// select are the same as they were when the page was rendered.
function restoreSelectToOriginalValue(sel, win)
{
    if(sel != null)
    {
        if (sel.type == "select-one" || sel.type == "select-multiple")
        {
            var valueWhenRendered = sel.getAttribute("valuewhenrendered");
            if(valueWhenRendered != null && valueWhenRendered.length > 0)
                setSelectValue(sel, valueWhenRendered);
        }
        else if (isNLDropDown(sel))
        {
            getDropdown(sel, win).restoreToOriginalValue();
        }
    }
}

function getSelectValueAtIndex(sel, idx)
{
    if ( sel != null )
    {
        if (sel.type == "select-one" || sel.type == "select-multiple")
        {
            if ((sel.options != null) && (sel.options.length > idx))
                return sel.options[idx].value;
            else
                return null;
        }
        else if (isNLDropDown(sel))
        {
            return getDropdown(sel).getValueAtIndex(idx);
        }
        else if (isNLMultiDropDown(sel))
        {
            return getMultiDropdown(sel).getValue(idx);
        }
    }
}

function getSelectTextAtIndex(sel, idx)
{
    if ( sel != null )
    {
        if (sel.type == "select-one" || sel.type == "select-multiple")
        {
            if ((sel.options != null) && (sel.options.length > idx))
                return sel.options[idx].text;
            else
                return null;
        }
        else if (isNLDropDown(sel))
        {
            return getDropdown(sel).getTextAtIndex(idx);
        }
        else if (isNLMultiDropDown(sel))
        {
            return getMultiDropdown(sel).getText(idx);
        }
    }
}

// functions for NLCheckBox. NLCheckBox is a custom checkbox that has a span wrapper around
// the form input field. The span wapper is used to display a custom checkbox image. The checkbox
// input element is made invisible. Due to this design, manipulating NLCheckboxes needs to go through
// an API to ensure that both the input and the span are in-sync. An onchange event handler, used to
// both elements in-sync is added to the input element.
function setNLCheckboxValue( fld, value)
{
	if (!fld)
    	return;

    if (typeof(value) == 'string')
	    fld.checked = value == 'T';
	else
    	fld.checked = value;

    // fire onChange automatically. function makes sure that the span and input are kept in-sync
    NLCheckboxOnChange(fld);
}

// return boolean true if check, false, otherwise
function getNLCheckboxValue( fld )
{
	if (!fld)
    	return;

	return fld.checked;
}

function getNLCheckboxSpan(fld)
{
	var span = fld.parentNode;
    if (span && span.nodeName == 'SPAN' && span.className && (span.className.indexOf('checkbox') == 0))
    	return span;

	return null;
}

function setNLCheckboxDisabled( fld, bDisabled)
{
	if (!fld || fld.type != 'checkbox')
		return;

	var sClassName = 'checkbox'+(bDisabled? '_disabled' : '')+(fld.checked? '_ck' : '_unck');
	fld.disabled = bDisabled;

	var span = getNLCheckboxSpan(fld);
    if (span)
	    span.className = sClassName;
}

function setNLCheckboxReadOnly(fld, bReadOnly)
{
	if (!fld || fld.type != 'checkbox')
		return;

	var sClassName = 'checkbox'+(bReadOnly? '_read' : '')+(fld.checked? '_ck' : '_unck');
	fld.readonly = bReadOnly;

	var span = getNLCheckboxSpan(fld);
    span.className = sClassName;
}

// This onclick handler is added to the checkbox span. When a checkbox is clicked, the span updates itself with the
// correct checkbox image and propergates the event down to its input element.
function NLCheckboxOnClick(span)
{
    var origSpanClass = span.className;
	var inpt = null;

	// Find the input.
    for (var i=0; i<span.childNodes.length; i++)
    {
    	if (span.childNodes[i].type == 'checkbox')
        {
        	inpt = span.childNodes[i];
            break;
        }
	}

    if (!inpt || inpt.disabled)
		return;

	if (inpt.type == 'checkbox' && inpt.checked) {
        //it was checked, now switch it to unchecked.
	    span.className = span.className.replace('_ck', '_unck');
		inpt.checked = false;
	}
	else {
        //it was unchecked, now switch it to checked.
	    span.className = span.className.replace('_unck', '_ck');
		inpt.checked = true;
	}

    inpt.focus();

    // call the input checkbox and check to make sure that onclick succeeded and didn't change back the checked status
	var origChecked = inpt.checked;
	if (inpt.onclick)
        inpt.onclick();
	var newChecked = inpt.checked;

    //if the onlick event changed back the checked status, revert back the span className also.
    if (origChecked != newChecked)
    	span.className = origSpanClass;
    else if (inpt.onchange)
    	inpt.onchange();
}

//Put on the checkbox input element, this onChange function make sure that input and span are in-sync. read above for checkbox design.
function NLCheckboxOnChange(fld)
{
    if (!fld)
		return;
	// make sure the input and the custom checkbox image on the parent span is in sync
	var span = getNLCheckboxSpan(fld);
    if (span)
    {
        if (fld.checked)
            span.className = span.className.replace('_unck', '_ck');
        else
            span.className = span.className.replace('_ck', '_unck');
    }
}

function NLCheckboxSetParentState(fld, state)
{
    if (!fld)
		return;
	// make sure the input and the custom checkbox image on the parent span is in sync
	var span = getNLCheckboxSpan(fld);
    if (span)
    {
    	if (state)
			span.className = span.className.replace('_unck', '_ck');
    	else
       		span.className = span.className.replace('_ck', '_unck');
    }
}

function NLCheckboxOnKeyPress(evt)
{
	if(window.event) // IE
	{
    	evt = getEvent(evt);
		if(evt.keyCode == 32 && evt.srcElement) //space bar
        {
           if (evt.srcElement.onclick)  evt.srcElement.onclick();
    		NLCheckboxSetParentState(evt.srcElement, !evt.srcElement.checked);
        }
	}

    return true;
}

function getNLSummaryFieldContent(fld)
{
	if (!isSummaryField(fld))
		return "";

    var docObj = (fld.document) ? fld.document : document;
    var textElement = docObj.getElementById(fld.id+"_val");
    if(textElement && textElement.parentNode)
        return textElement.parentNode.innerHTML;
     return "";
}

function setNLSummaryFieldTextValue(fld, val)
{
    if (!isSummaryField(fld))
        return "";

    var docObj = (fld.document) ? fld.document : document;
    var textElement = docObj.getElementById(fld.id+"_val");
    if(textElement)
        textElement.innerHTML = val;
}

function getNLSummaryFieldTextValue(fld)
{
	if (!isSummaryField(fld))
		return "";

    var docObj = (fld.document) ? fld.document : document;
    var textElement = docObj.getElementById(fld.id+"_val");
    if(textElement)
        return textElement.innerHTML;
    return "";
}

function setNLSummaryFieldDisabled( fld, bDisabled)
{
	if (!isSummaryField(fld))
		return;

	fld.disabled = bDisabled;

    var docObj = (fld.document) ? fld.document : document;
    var helperLink = docObj.getElementById(fld.name+"_helper_popup");
    if(helperLink != null)
        helperLink.style.visibility = bDisabled ? "hidden" : "inherit";
}

function isNLNumericOrCurrencyDisplayField( fld )
{
    if (!fld)
        return false;
    if (!(isNumericField(fld) ||isCurrencyField(fld)))
        return false;

    return (fld.name.indexOf("_formattedValue")>0);
}

function getNLNumericOrCurrencyDisplayField( fld )
{
    if (!fld) {
        return null;
    }

    var name = fld.name+"_formattedValue";
    return findNLNumericFieldByName(fld, name);
}

function getNLNumericOrCurrencyValueField( fld )
{
    if (!fld) {
        return null;
    }

    var name = fld.name.replace("_formattedValue", "");
    return findNLNumericFieldByName(fld, name);
}

function findNLNumericFieldByName(fld, name) {
    if (!fld.form) {
        var elements = fld.ownerDocument.getElementsByName(name);
        for(var i = 0; i < elements.length; i++) {
            if(elements[i].parentNode == fld.parentNode) {
                return elements[i];
            }
        }
        return fld.ownerDocument.getElementById(name);
    }
    return fld.form.elements[name];
}

function isCurrencyField( fld )
{
    if (!fld)
        return false;
    var dataType = "";
    if(typeof fld.getAttribute != 'undefined')
        dataType = fld.getAttribute("dataType");
    if (dataType == "currency" || dataType == "poscurrency" || dataType == "currency2")
        return true;
    return false;
}

function setNLCurrencyValue(fld, value)
{
    fld.value = value;
    var displayField = getNLNumericOrCurrencyDisplayField(fld);
    if (!displayField)
        return;
    displayField.value = NLNumberToString(value);
}

function isNumericField( fld )
{
    if (!fld)
        return false;
    var dataType = "";
    if(typeof fld.getAttribute != 'undefined')
        dataType = fld.getAttribute("dataType");
    if (dataType == "float" || dataType == "posfloat" || dataType == "nonnegfloat" || dataType == "integer" || dataType == "posinteger" || dataType == "rate" || dataType == "ratehighprecision" || dataType == "percent")
        return true;
    return false;
}

function setNLNumericValue(fld, value)
{
    fld.value = value;
    var displayField = getNLNumericOrCurrencyDisplayField(fld);
    if (!displayField)
        return;
    displayField.value = NLNumberToString(value);
}

function setNLNumericOrCurrencyFieldDisabled(fld, val)
{
    var displayField = getNLNumericOrCurrencyDisplayField(fld);
    if (!displayField)
        return;
    displayField.disabled = val;
}

function getNLNumericOrCurrencyFieldDisabled(fld)
{
    var displayField = getNLNumericOrCurrencyDisplayField(fld);
    if (!displayField)
        return false;
    return displayField.disabled;
}

// If val is true then restore to originally required state. If val is false then set not required.
function setDefaultOrNotRequired(fld, val)
{
    setRequired(fld, val ? getRequired(fld) : false);
}

function hasAttribute(fld,flag)
{
    if ( isNLDropDown(fld) )
        return getDropdown(fld).hasAttribute(flag);
    else if ( isNLMultiDropDown( fld ) )
        return getMultiDropdown(fld).hasAttribute(flag);
    else if ( window.getHtmlEditor != null && getHtmlEditor( fld.name ) != null )
        return getHtmlEditor(fld.name).hasAttribute(flag);
    else
        return (fld.getAttribute("flags") & flag) != 0;
}


function disableField(fld, val)
{
    if (!isBackend)
    {
        if (fld == null)
            return;
        // NLField.GetDomJScript() returns an Array for radio fields.
        // make sure it's not an html native select, for which fld.length is the number of options
        if (!isSelect( fld ) && fld.length > 1)
        {
            for ( var i = 0; i < fld.length; i++ )
                if ( fld[i].type == 'radio' )
                    disableField( fld[i], val);
            return;
        }
        else if (isSelect( fld ) || isPopupSelect( fld ) || isMultiSelect( fld ) || isPopupMultiSelect(fld))
            disableSelect(fld, val);
        else if ( window.getHtmlEditor != null && getHtmlEditor( fld.name ) != null )
            getHtmlEditor( fld.name ).setDisabled( val );
        else if (NLIsButton( fld ))
            NLDisableButton(fld, val);
        else if (fld.type=='checkbox')
            setNLCheckboxDisabled(fld, val);
        else if (isSummaryField(fld))
            setNLSummaryFieldDisabled(fld, val);
        else if (isNumericField(fld) || isCurrencyField(fld))
            setNLNumericOrCurrencyFieldDisabled(fld, val);
        else
        {
            fld.disabled = val;
            // fld.document is undefined in Safari and Firefox. In order to avoid a JS error (which causes the rest
            // of the JS to be skipped, we fallback on getting the datelink reference directly from the document.
            // This might potentially be the wrong thing to do if the fld is inside a different document, but it
            // should work fine in the common case and subsequent JS will execute, leaving the form usable.
            var docObj = (fld.document) ? fld.document : document;
            var datelink = docObj.getElementById(fld.name+"_helper_calendar");
            if(datelink != null)
                datelink.style.visibility = val ? "hidden" : "inherit";
        }
    }

    updateFieldEditabilityFlags(fld, 'sp_disabledField', val);
}

function setFieldReadOnly(fld, val)
{
	if (fld != null && fld.type == "textarea")
	{
		fld.readOnly = val;
	}

    updateFieldEditabilityFlags(fld, 'sp_readOnlyField', val);
}

function getFieldDisabled(fld)
{
    if (fld == null)
        return;
    // NLField.GetDomJScript() returns an Array for radio fields.
    // make sure it's not an html native select, for which fld.length is the number of options
    if (!isSelect( fld ) && fld.length > 1)
    {
        for ( var i = 0; i < fld.length; i++ )
            if ( fld[i].type == 'radio' )
                return fld[i].disabled;
    }
    else if (isSelect( fld ) || isPopupSelect( fld ) || isMultiSelect( fld ))
	{
		if (fld.type == "select-one" || fld.type == "select-multiple")
			return fld.disabled;
		else if (isNLDropDown(fld))
			return getDropdown(fld, window).disabled;
		else if (isNLMultiDropDown(fld))
			return getMultiDropdown(fld, window).disabled;
		else if ( isPopupSelect( fld ) )
			return getFormElement(fld.form, fld.name+'_display' ).disabled
	}
    else if ( window.getHtmlEditor != null && getHtmlEditor( fld.name ) != null )
        return getHtmlEditor( fld.name ).disabled;
    else if (isNumericField(fld) || isCurrencyField(fld))
        return getNLNumericOrCurrencyFieldDisabled(fld);
    else
        return fld.disabled;
	return false;
}

function isDisplayOnlyField(fld)
{
    if (fld == null)
        return;
	if ( isDisplayOnlySelect(fld) )
		return true;
	else if (fld.type == "hidden" && document.getElementById(fld.name+'_val') != null)
		return true;
	return false;
}

function setOptionsFromMachineField( machine_name, field_name, selectObject, alternate_label, test_field, test_value )
{
    deleteAllSelectOptions( selectObject, window );
    var doc = window.document;
    var mch = eval( machine_name + '_machine');
    addSelectOption( doc, selectObject, "",  "", true, window );
    var bNewOptions = false;
    for ( var i = 1; i <= getLineCount(machine_name); i++)
    {
        if (mch.getMachineIndex() == i || ( test_field != null && getEncodedValue( machine_name, i, test_field) != test_value ) )
            continue;
        bNewOptions = true;
        addSelectOption( doc, selectObject,  getEncodedValue( machine_name,i, alternate_label != null ? alternate_label :field_name + '_display'),  getEncodedValue( machine_name,i,field_name ), false, window);
    }
    return bNewOptions;
}

// return the name of the Sync Function for a field (if one exists)
function getSyncFunctionName(fldname, machine)
{
    var syncFuncName = "Sync"+fldname;
    if ( machine != null )
    {
        var machSyncFunc = syncFuncName + machine;
        if ( eval( "window." + machSyncFunc ) != null )
            return machSyncFunc;
    }
    return syncFuncName;
}

/*
    safeSetDocumentLocation(url)
    An onbeforeunload handler may cancel the document.location set and throw
    an exception which if uncaught displays a JS error to the user.  This function silently catches these
    on browsers that support exceptions (those that don't shouldn't be able to veto set-location).
*/
function safeSetDocumentLocation(url)
{
    try {
        document.location = url;
    } catch (e) {}
}

function addParamToURL(url, param, value,replace)
{
    if ( url == null )
        return null;
    if (url.length && url.charAt(url.length - 1) == '#')
        url = url.substring(0, url.length - 1);
    if (url.length && url.indexOf('#') > -1)
        url = url.substring(0, url.indexOf('#'));
    if ( isValEmpty( param ) )
        return url;
    if (replace == true)
        url = removeParamFromURL(url,param);
    return addNextParamPrefixToURL( url ) + param + "=" + emptyIfNull(value);
}

function addNextParamPrefixToURL( url )
{
    return url + ( url.indexOf("?") == -1 ? "?" : "&" );
}

function removeParamFromURL(url, param)
{
    var sep = "&";
    var startIndex = url.indexOf("&"+param+"=");
    if (startIndex == -1)
    {
        startIndex = url.indexOf("?"+param+"=");
        sep = "?";
    }
    if (startIndex != -1)
    {
        var endIndex = url.indexOf("&",startIndex+1);
        return url.substring(0,startIndex)+ (endIndex > 0 ? (sep == "?" ? "?"+url.substr(endIndex+1) : url.substr(endIndex)) : "");
    }
    return url;
}

function formEncodeURLParams( params )
{
    var paramString = '';
    for ( var param in params )
        paramString += (isValEmpty(paramString) ? '' : '&') + encodeURIComponent( param ) + '=' + encodeURIComponent( emptyIfNull( params[param] ) );
    return paramString;
}

function downloadMedia(mediaid)
{
    var url = '/core/media/previewmedia.nl?id='+mediaid+'&_xd=T';
    preview(url, 'prevmedia');
}

function previewTemplate(id, entity)
{
    var url = '/app/crm/common/merge/previewtemplate.nl?id='+id;
    if ( !isValEmpty(entity) )
        url = addParamToURL( url, 'entity', entity );
    preview(url, 'previewtemplate');
}

function siteMedia(mediaid, bIsHref, document)
{
    if (bIsHref)
        mediaid = mediaid.substr(mediaid.lastIndexOf('/')+1);
    var url = '/app/site/media/sitemedia.nl?id='+mediaid;
    preview(url, 'sitemedia');
}

function getCookieVal(offset)
{
    var endstr = document.cookie.indexOf (';', offset);
    if (endstr == -1)
        endstr = document.cookie.length;
    return unescape(document.cookie.substring(offset, endstr));
}

function GetCookie(name)
{
    var arg = name + '=';
    var alen = arg.length;
    var clen = document.cookie.length;
    var i = 0;
    while (i < clen)
    {
        var j = i + alen;
        if (document.cookie.substring(i, j) == arg)
        {
            // Not stripping JSESSIONID as we need the full cookie sent by browser, if we wanted to would use NLSessionIdUtil.getPracticalSessionId()
            return getCookieVal(j);
        }
        i = document.cookie.indexOf(' ', i) + 1;
        if (i == 0) break;
    }
    return null;
}

function getStickyTag( pageName )
{
    var cbody = GetCookie('stickytags');
    if (cbody != null)
    {
        // the cookie string always starts with a comma so that we have a common delimiter.
        // "b" will be the start index of that pageName, not including the comma
        var b=cbody.indexOf(','+pageName+':') + 1;
        if (b>=1)
        {
             var e=cbody.indexOf(',',b);
             if (e<0)
                e=cbody.length;
             return unescape(cbody.substring(b+pageName.length+1, e));
        }
    }
    return null;
}

function addStickyTagToUrl(url, pageName)
{
    return url + (url.indexOf('?') >= 0 ? '&t=' : '?t=') + getStickyTag(pageName);
}

function redirectToStickyPage(url,pageName,framed)
{
    var newUrl = addStickyTagToUrl(url, pageName);
    try {
        if (typeof(framed) == "number")
            parent.frames[framed].document.location = newUrl;
        else if (framed)
            parent.document.location = newUrl;
        else
            document.location = newUrl;
    // If the user hits cancel at the "do you want to navigate away" question, an exception can occur here.
    } catch (e) { }
}

// type ahead key select handler
var SelectKeyPressMaxKeyPause = 2000; // two seconds between keystrokes max
var SelectKeyPressTypedString = "", SelectKeyPressTimeoutID = null;
function SelectKeyPressHandler (evnt, sorted)
{
    var keyString = String.fromCharCode (getEventKeypress(evnt)).toUpperCase(), option;
    if (!(keyString >= " "  &&  keyString <= "_"))
    {
        SelectKeyPressTypedString = "";
        return true;
    }
    if (SelectKeyPressTimeoutID != null)
        window.clearTimeout (SelectKeyPressTimeoutID);
    SelectKeyPressTimeoutID = window.setTimeout ("SelectKeyPressTimeout()",
                                                SelectKeyPressMaxKeyPause);
    SelectKeyPressTypedString += keyString;
    if (sorted)
    {
        if (SelectKeyPressTypedString.length == 1)
            option = SelectKeyPressLookupFirst (evnt, SelectKeyPressTypedString);
        else
            option = SelectKeyPressLookupNext (evnt, SelectKeyPressTypedString);
    }
    else
        option = SelectKeyPressLookupLinear (evnt, SelectKeyPressTypedString);
    setEventPreventDefault(evnt);
    if (option != -1)
    {
        getEventTarget(evnt).selectedIndex = option;
        getEventTarget(evnt).onchange();
    }

    return false;
}

function SelectKeyPressTimeout ()
{
    SelectKeyPressTypedString = "";
    SelectKeyPressTimeoutID = null;
}

function SelectKeyPressLookupFirst (evnt, str)
{
    var select = getEventTarget(evnt);
    var options = select.options;
    var low = 0;
    var high = options.length;
    while (high - low > 1)
    {
        var i = Math.floor ((high + low) / 2);
        if (str.charAt(0) <= options(i).text.charAt(0).toUpperCase())
            high = i;
        else
            low = i;
    }
    while (high > 0 && str.charAt(0) == options(high - 1).text.charAt(0).toUpperCase())
        --high;
    if (high < options.length  &&
        str.charAt(0) == options(high).text.charAt(0).toUpperCase())
        return high;
    else
        return -1;
}
function SelectKeyPressLookupNext (evnt, str)
{
    var select = getEventTarget(evnt);
    var options = select.options;

    var selIndex = select.selectedIndex;
    while (selIndex < options.length - 1 && options(selIndex).text.toUpperCase() < str)
        ++selIndex;
    if (selIndex < options.length - 1 && options(selIndex).text.substr(0, str.length).toUpperCase() == str)
        return selIndex;
    else
        return -1;
}
function SelectKeyPressLookupLinear (evnt, str)
{
    var select = getEventTarget(evnt);
    var options = select.options;

    for (var i = 0; i < options.length; ++i)
        if (options(i).text.substr(0, str.length).toUpperCase() == str)
            return i;

    return -1;
}
function disableFilter(radio, disableVal, fld1,fld2)
{
    if (getRadioValue(radio) == disableVal)
    {
        fld1.disabled = true;
        if (fld2)
            fld2.disabled = true;
    }
    else
    {
        fld1.disabled = false;
        if (fld2)
            fld2.disabled = false;
    }
}

// number of days in each month
var NLDate_pnDaysInMonths = [31,28,31,30,31,30,31,31,30,31,30,31];

// NLDate_getLastDayOfMonth: returns the last day of the month in the dDate
function NLDate_getLastDayOfMonth(dDate)
{
    var m = dDate.getMonth();
    var days = NLDate_pnDaysInMonths[m];

    if(m == 1) // feb -- handle possible leap year
    {
        var y = dDate.getYear();
        if ( (y% 400 == 0) || ((y % 4 == 0) && (y % 100 != 0)) )
            days++;
    }
    return days;
}

function setDisabledState(elementid,enable)
{
    // disable input fields
    var elem = document.getElementById(elementid), i;
    if (typeof elem.disabled != "undefined" )
    {
        elem.disabled=!enable;
        return;
    }
    var childnodes=document.getElementById(elementid).getElementsByTagName('INPUT');
    for(i=0;i< childnodes.length;i++)
    {
        if(childnodes[i].name.indexOf('_send')==-1)
            childnodes[i].disabled=!enable;
    }
    // disable helpers
    childnodes=document.getElementById(elementid).getElementsByTagName('A');
    for(i=0;i< childnodes.length;i++)
    {
        if(!enable && !childnodes[i].disabled)
        {
            childnodes[i].enabledonclick=childnodes[i].onclick;
            childnodes[i].onclick = function () {
				return false;
			}
        }
        else if (enable && childnodes[i].enabledonclick!=null && childnodes[i].disabled)
        {
            childnodes[i].onclick=childnodes[i].enabledonclick;
        }
        childnodes[i].disabled=!enable;
    }
}

function nlOpenWindow(url, winname, widthOrFeatures, height, fld, scrollbars)
{
    if ( window.doPageLogging ) // onunload and onbeforeunload events don't fire for popup requests. This is required in order to track end-to-end time
        logStartOfRequest( 'popup' );
    if ( isValEmpty( widthOrFeatures ) )
        return window.open(url, winname);
    else if ( isNaN(parseInt( widthOrFeatures )) )
        return window.open(url, winname, widthOrFeatures);
    else if ( isIE )
        return window.open(url, winname, 'scrollbars='+(scrollbars ? 'yes' : 'no')+',width='+Math.min(screen.availWidth,widthOrFeatures)+',height='+Math.min( screen.availHeight-40,height)+',left='+Math.min(screen.availWidth-widthOrFeatures,getObjectLeft(fld))+',top='+Math.min( (screen.availHeight-40)-height,getObjectTop(fld))+',resizable=yes');
    else
        return window.open(url, winname, 'scrollbars='+(scrollbars ? 'yes' : 'no')+',width='+widthOrFeatures+',height='+height+',resizable=yes');
}

function nlExtOpenDivWindow(winname, width, height, fld, scrollbars, winTitle, listeners, html, triggerObj, chartHTML, winProperties)
{
    var divhtml = "<div id='" + winname + "_framediv'></div>";

    if (html != null && typeof html != 'undefined')
        divhtml = html;

    if(chartHTML != null && typeof chartHTML != 'undefined'){
        divhtml= chartHTML + "<div style='width:100%;float:left;clear:left;' id='" + winname + "_framediv'>";
    }

    var xPos = null;
    var yPos = null;
    if (triggerObj != null && typeof triggerObj != 'undefined')
    {
        xPos = findGlobalPosX(triggerObj);
        yPos = findGlobalPosY(triggerObj);
    }

    var defaultProperties = {
        title: (winTitle != undefined ? winTitle : winname),
        id: winname,
        name: winname,
        stateful: false,
        modal: true,
        autoScroll: false,
        width: width,
        height: height,
        style: 'background-color: #FFFFFF;',
        bodyStyle: 'background-color: #FFFFFF;',
        resizable: true,
        listeners : listeners,
        bodyCfg: {
            tag: 'center',
            name: winname+'_frame',
            id: winname+'_frame',
            html: divhtml,
            width: width+'px',
            height: height+'px',
            style: 'border:none;background-color: #FFFFFF;'
        }
    };
    NS.jQuery.extend(defaultProperties, winProperties);
    var extWindow = new Ext.Window(defaultProperties);

	if ((!isValEmpty(xPos))&&(!isValEmpty(yPos)))
	{
		extWindow.x = xPos;
		extWindow.y = yPos;
	}

    extWindow.show();
    extWindow.syncSize();

    return extWindow;
}

function nlOpenIframe(url, winname, listeners)
{
    if (!listeners)
        listeners = {};

    var deferred = NS.jQuery.Deferred();
    var id = winname;
    var iframe = NS.jQuery("#" + id);
    if (iframe.length == 0)
    {
        NS.jQuery("<iframe/>", {id: id, tabindex: -1, style: "display: none", height: 0, width: 0}).appendTo("body");
        iframe = NS.jQuery("#"  + id);

        if (listeners['onload']) {
            iframe.on('onload', function(event, iframe) {
                listeners['onload'](iframe);
            });
        }
        iframe.load(function() {
			deferred.resolve();
            NS.jQuery(this).trigger('onload', [NS.jQuery(this)]);
        });
        if (listeners['beforeclose']) {
            iframe.on('beforeclose', function(event) {
                listeners['beforeclose']();
            });
        }
    }

    iframe.load(deferred.resolve);
    iframe.data("iframeid", id);
    iframe.attr("src", url);
    return deferred.promise();
}

// give the left coorinate of the object relative to the whole screen (not just the browser window)
function getObjectLeft(obj)
{
    var offset=0;
    while (obj != null && obj != document.body)
    {
        offset += obj.offsetLeft;
        obj = obj.offsetParent;
    }
    return offset + (isIE ? window.screenLeft : window.screenX + window.outerWidth - window.innerWidth);
}

// give the top coorinate of the object relative to the whole screen (not just the browser window)
function getObjectTop(obj)
{
    var offset=0;
    while (obj != null && obj != document.body)
    {
        offset += obj.offsetTop;
        obj = obj.offsetParent;
    }
    if (isIE)
    return offset + window.screenTop;

    //mozilla browsers
    var statusbarHeight = 0;
    if (typeof window.statusbar != "undefined" && window.statusbar != null && window.statusbar.visible)
        statusbarHeight = 20; //rough number

    return offset + window.screenY + window.outerHeight - window.innerHeight - statusbarHeight;
}

function setFieldVisibility ( spanId, on )
{
    var spanInput = document.getElementById( spanId  );
    visible ( spanInput, on );
}
function setLabelVisibility ( spanId, on )
{
    var spanLabel = document.getElementById( spanId + "_lbl" );
    visible( spanLabel, on );
}
function setFieldAndLabelVisibility( spanId, on )
{
    setLabelVisibility( spanId, on );
    setFieldVisibility( spanId, on );
}

function showHelperText ( spanId, on )
{
    var spanLabel = document.getElementById( spanId + "_hlp" );
    display( spanLabel, on );
}

function showLabel ( spanId, on )
{
    if (!isBackend) {
        var spanLabel = document.getElementById( spanId + "_lbl" );
        if (on) {
            var elem = !!NS && !!NS.UI && !!NS.UI.Helpers && !!NS.UI.Helpers.getClosestAncestorFromClass &&
                    NS.UI.Helpers.getClosestAncestorFromClass(document.getElementById(spanId), 'uir-field-wrapper');

            if (elem) {
                display(elem, on);
            }

        }

        display( spanLabel, on );
    }
}

function getLabel( spanId )
{
    if (!isBackend) {
    var spanLabel = document.getElementById( spanId + "_lbl" );
	if (spanLabel == null)
		return null;
	// cm: span often contains a link, which itself contains the label
	else if (spanLabel.getElementsByTagName('a') != null && spanLabel.getElementsByTagName('a').length == 1)
		return spanLabel.getElementsByTagName('a').item(0).innerHTML;
	else
		return spanLabel.innerHTML;
    }
}

function showFieldAndLabel( spanId, on )
{
    if (!isBackend) {
        var elem = !!NS && !!NS.UI && !!NS.UI.Helpers && !!NS.UI.Helpers.getClosestAncestorFromClass &&
            NS.UI.Helpers.getClosestAncestorFromClass(document.getElementById(spanId), 'uir-field-wrapper');

        if(!!elem){
            display(elem, on);
        }

	    var radioWrapperElem = !!NS && !!NS.jQuery &&
		    NS.jQuery(document.getElementById(spanId)).closest('.uir-combined-field-radio');

	    if(!!radioWrapperElem){
		    NS.jQuery(radioWrapperElem).find('*').toggle(on);
	    }

        showLabel( spanId, on );
        showField( spanId, on );
    }
}

//module that encapsulates basic tab APIs
var ns_tabUtils = (function() {

    // this function is available only in Browser version of this jsp
    // legacy version of fields has no mechanism to get all visible fields on specific tab.
    // browser version has fields wrapped in div with specific class.
    function isEmpty(){
        return false;
    }

    function updateTabVisibility(tabName) {
        if (!isBackend)
        {
            hideTab(tabName, this.isEmpty(tabName));
        }
    }

    function isTabAreaVisible(tabName)
    {
        return (NS.jQuery("#" + tabName + ":visible").length > 0);
    }

    /* This function is used to dynamically/conditionally hide inactive tabs on the page based on settings in the form.
    * We use this to make tabs go away when settings are set that causes that tab's contents to all be irrelevant.
    * Note: this is distinct from ShowHideTab(), which activates/deactivates a tab.  This hides or replaces tabs. */
    function hideTab( tabName, hide )
    {
		var tabSufix = {
			PANE: '_pane', 	// sufix for unlayered tab name
			LNK: 'lnk', 	// sufix for layered tab name in sublist header
			LAYER: '_layer' // sufix for layered tab name content
		};

		if (!isBackend)
        {
			// currently unlayered, look for the PANE element
			var sufix = "";
			if (document.getElementById(tabName + tabSufix.PANE) != null) {
				sufix = tabSufix.PANE;
			} else if (document.getElementById(tabName + tabSufix.LNK) != null) {
				sufix = tabSufix.LNK;
			} else if (document.getElementById(tabName + tabSufix.LAYER) != null) {
				sufix = tabSufix.LAYER;
			}

			// for "lnk" sufix is the tab visible when header is visible. The content could be active or hidden.
			var currentlyDisplayed = ns_tabUtils.isTabAreaVisible(tabName + sufix);
			if (currentlyDisplayed !== hide)
                return;
        }

        var displayVal = hide ? 'none' : '';
        var tableSuffixis = ['upperlt', 'uppermiddot', 'uppermid', 'upperrt', 'lt', 'lnkdot', 'lnk', 'rt', '_umh'];

        for(var i=0; i<tableSuffixis.length; ++i)
        {
            var elem = document.getElementById(tabName + tableSuffixis[i]);
            if (elem != null)
                elem.style.display = displayVal;
        }

        var elem = document.getElementById(tabName + tabSufix.PANE);
        if (elem != null)
        {
            //show/hide tab in unlayered mode
            elem.style.display = displayVal;
        }
        else
        {
            //show/hide tab in layered mode
            elem = document.getElementById(tabName + tabSufix.LAYER);
            if (elem != null)
                elem.style.display = displayVal;
        }
    }

    return {
        updateTabVisibility: updateTabVisibility,
        isEmpty: isEmpty,
        isTabAreaVisible : isTabAreaVisible,
        hideTab: hideTab
    }
})();

function setRichTextEditorValue(fld, value, retries)
{
    var editor = getHtmlEditor(fld.name);

    // if HTML editor is already registered, set the value right away
    if (editor != null && fld == editor.hddn)
    {
        if (editor.initialized)
        {
            editor.setValue(value, true);
        }
        else // if editor is placed on inactive subtab, it won't be initialized yet => we have to use the hook
        {
            editor.on('initialize', function ()
            {
                editor.setValue(value, true);
            });
        }
    }
    else // otherwise we have to do it later
    {
        if (retries > 0) // limit the recursion
        {
            setTimeout(function () { setRichTextEditorValue(fld, value, retries - 1); }, 200);
        }
    }
}

function setFormValue(fld,value,text,firefieldchanged,synchronous)
{
	if (fld == null)
        return;
	if (fld.type == 'checkbox')
    {
     	setNLCheckboxValue(fld, value);
    }
    else if (fld.type == 'radio' || (fld.length > 0 && fld[0]!=null && fld[0].type == "radio"))
        syncradio(fld,value);
	else if (fld.type == 'select-one')
        synclist(fld,value);
    else if (isNLDropDown(fld))
        getDropdown(fld).setValue(value, true /* no onchange */);
    else if (isMultiSelect(fld))
        syncmultiselectlist(fld, value, null, true /* no onchange */);
    else if (isRichTextEditorUnregisteredSafe(fld))
    {
        // test for existence of RTE scripts since this script file is used externally
        if (window.getHtmlEditor != null)
        {
            setRichTextEditorValue(fld, value, 10);
        }
    }
    else if (fld.nodeName == 'INPUT' || fld.nodeName == 'TEXTAREA' || window.virtualBrowser)
    {
		var val = value != null && value.join != null && (isPopupMultiSelect( fld ) || isArray(value)) ? value.join( String.fromCharCode(5) ) : value;
        if ( isPopupSelect( fld ) )
            syncpopup( fld, val, text );
        else if ( isPopupMultiSelect( fld ) )
            syncmultiselectlist( fld, val, text, true /* no onchange */);
        else if ( isCurrencyField(fld) )
            setNLCurrencyValue(fld, value);
        else if ( isNumericField(fld) )
            setNLNumericValue(fld, value);
		else if ( isMultiSelectInput(fld) ) {
			var multiSelect = document.getElementById(fld.id + '_multiselect' );
			syncmultiselectlist( multiSelect, val, text);
			multiSelect.onchange();
		}
		else
        {
            // Bug in quirks mode IE
            // when put null to fld.value, in IE is inserted "null" string
            fld.value = (val == null) ? "" : val;
            if ( isDisplayOnlySelect( fld ) && typeof text != "undefined" )
                document.getElementById(fld.name+'_displayval').innerHTML = text != null ? text.replace( new RegExp( String.fromCharCode(5), "g" ), '<BR>' ) : "";
        }
    }
    else
		fld.innerHTML = value;

    var uiField = fld;
    if ((isNumericField(fld) || isCurrencyField(fld)) && getNLNumericOrCurrencyDisplayField(fld) != null)
        uiField = getNLNumericOrCurrencyDisplayField(fld);

    if(uiField.machine)
        uiField.machine.setFieldInputValue(fld.name, value, firefieldchanged, text);
    else if (uiField.uiform)
        uiField.uiform.setFieldInputValue(fld.name ,value, firefieldchanged, text);

	if (firefieldchanged)
	{
		var aSync = getSlavingAsync();
		try
		{
			if (synchronous)
				setSlavingAsync(false);
			fireProperOnChange(fld);
		}
		finally
		{
			setSlavingAsync(aSync)
		}
	}
}
function getFormValue(fld, returnArray)
{
    if (fld == null)
        return null;
    if (fld.type == "checkbox")
        return fld.checked ? 'T' : 'F';
    else if (fld.type == "radio" || (fld.length > 0 && fld[0].type == "radio"))
        return getRadioValue(fld);
    else if (fld.type == "select-one" || isNLDropDown(fld))
        return getSelectValue(fld);
    else if (isMultiSelect(fld))
        return getMultiSelectValues(fld, returnArray);
    // test for existence of RTE scripts since this script file is used externally
    else if ( isRichTextEditor( fld ) )
        return fld.value;
    else
        return returnArray && fld.value != null && isPopupMultiSelect( fld ) ? fld.value.split( String.fromCharCode(5) ) : fld.value;
}

// return parameter values from document URL
// TODO this function has name conflict with that in NLEventReminder.jsp
function getParameter( param, doc )
{
    if (typeof doc == "undefined" || doc == null)
        doc = document;
    var re = new RegExp(".*[?&]"+param+"=([^&]*)");
    var matches = re.exec( doc.location.href.toString() ) ;
    return matches != null && matches.length > 0 ? decodeURIComponent(matches[1]) : null;
}

// return paramater value from url with fragment identifier (part after hash) removed
function getParam(paramName)
{
	var param = getParameter(paramName);
	if (param && param.indexOf('#') > -1)
	{
		param = param.substring(0, param.lastIndexOf('#'));
	}

	return param;
}

// return TRUE if the parameter value is equal to "T"
function getBooleanParameter( param )
{
    return getParameter( param ) == "T";
}

// return an Array of parameters and parameter values
function getParameterValuesArray( )
{
    var url = document.location.href.toString();
    if ( url.indexOf('?') < 0 )
        return null;

    var pairs = url.substring( url.indexOf('?')+1 ).split("&");
    var a = [];
    for ( var i = 0; i < pairs.length; i++ )
    {
        var pair = pairs[i].split("=");
        a[a.length] = pair[0];
        a[a.length] = pair.length > 0 ? pair[1] : null;
    }
    return a;
}

/*  This returns a reference to a field given a form and field name. Handles Netscape bug where
    references to item form element return a function pointer. Also handles bug where references to language
    field sometimes returns a reference to the language Dom Node property */
function getFormElement(frm,fldname, fieldType)
{
    var returnMe = null;
    if ( frm != null )
    {
        if ( fldname == 'language' || (!isBackend && (fldname == 'item' || fldname == 'cash')) )
        {
            for ( var i = 0; i < frm.elements.length; i++ )
                if ( frm.elements[i].name == fldname )
                {
                    returnMe = frm.elements[i];
                    break;
                }
        }
        else if (fieldType && fieldType == 'inlinehtml')
        {
            returnMe = document.getElementById(fldname + "_val");
        }
        else if  (frm.elements != null)
            returnMe = frm.elements[fldname];
    }
    return returnMe;
}

/*  This returns a reference to a field given a form name and field name. Handles Netscape bug where
    references to item form element return a function pointer. */
function getFormElementViaFormName(frmName,fldname)
{
    return getFormElement( document.forms[ frmName ], fldname  );
}

// give the X coordinate of the object obj relative to the object container
// this method usually is used to find the position of the trigger object - obj, so that an absolutely positioned
// element as a direct child of the container object will be positioned next to the trigger object.
// if container is null, it is the body
function findGlobalPosX(obj, container)
{
    var curtop = 0;
    if (document.getElementById || document.all)
    {
        while (obj.offsetParent)
        {
            curtop += obj.offsetLeft;
            obj = obj.offsetParent;
        }

        if (obj.document!=null && obj.document.parentWindow != null && obj.document.parentWindow.frameElement)
            curtop += findGlobalPosX(obj.document.parentWindow.frameElement)
    }
    else if (document.layers)
        curtop += obj.y;

    return curtop;
}

// give the Y coordinate of the object relative to the brownser window
function findGlobalPosY(obj)
{
    var curtop = 0;
    if (document.getElementById || document.all)
    {
        while (obj.offsetParent)
        {
            curtop += obj.offsetTop;
            obj = obj.offsetParent;
        }

        if (obj.document!=null && obj.document.parentWindow != null && obj.document.parentWindow.frameElement)
            curtop += findGlobalPosY(obj.document.parentWindow.frameElement)
    }
    else if (document.layers)
        curtop += obj.y;

    return curtop;
}

// give the X coordinate of the object relative to the window.
// A more accurate version when the containing scrollable divs are offset parents (css posiiton = relative/absolute)
function findAbsolutePosX(obj)
{
    var curleft = 0;
    if (document.getElementById || document.all)
    {
        while (obj.offsetParent)
        {
            curleft += obj.offsetLeft;
            if (obj.offsetParent != document.body)
                curleft -= obj.offsetParent.scrollLeft;
            obj = obj.offsetParent;
        }
    }
    else if (document.layers)
        curleft += obj.x;
    var isWindowContainedInDivFrame = window.parentAccesible && false;
    return (isWindowContainedInDivFrame ? parent.Ext.WindowMgr.getActive().x+curleft : curleft);
}

// give the Y coordinate of the object relative to the window
// A more accurate version when the containing scrollable divs are offset parents (css posiiton = relative/absolute)
function findAbsolutePosY(obj)
{
    var curtop = 0;
    if (document.getElementById || document.all)
    {
        while (obj.offsetParent)
        {
            curtop += obj.offsetTop;
            if (obj.offsetParent != document.body)
                curtop -= obj.offsetParent.scrollTop;
            obj = obj.offsetParent;
        }
    }
    else if (document.layers)
        curtop += obj.y;

    var isWindowContainedInDivFrame = window.parentAccesible && false;
    return (isWindowContainedInDivFrame ? parent.Ext.WindowMgr.getActive().y+curtop : curtop);
}

// give the X coordinate of the object relative to the window
function findPosX(obj)
{
    var curleft = 0;
    var isExtLoaded = (window.parentAccesible && parent && parent.Ext); //adding check for webstore Issue #203781
    var isWindowContainedInDivFrame = (isExtLoaded ?  parent.Ext.WindowMgr.getActive()!=null : false);
    //following conditional logic attempts to address Issue #200936 regarding date pickers in Chrome and Safari within new Ext popups
    if (isWindowContainedInDivFrame && (parent.Ext.isSafari || parent.Ext.isChrome)) {
        curleft = obj.offsetParent.offsetLeft;
    }
    else if (document.getElementById || document.all)
    {
        while (obj.offsetParent)
        {
            curleft += obj.offsetLeft;
            obj = obj.offsetParent;
        }
    }
    else if (document.layers)
        curleft += obj.x;

    return curleft;
}

// give the Y coordinate of the object relative to the window
function findPosY(obj)
{
    var curtop = 0;
    if (document.getElementById || document.all)
    {
        while (obj.offsetParent)
        {
            curtop += obj.offsetTop;
            obj = obj.offsetParent;
        }
    }
    else if (document.layers)
        curtop += obj.y;

    return curtop;
}

function getParentElementByTag(tag, element)
{
    if(!tag)
        return null;

    var elem = element;

    while(elem != null)
    {
        if (elem.tagName.toLowerCase() == tag.toLowerCase())
            return elem;
        if (elem == elem.parentNode)
            break;
        elem = elem.parentNode;
    }
    return null;
}

/**
 * Test if an html elenet is contained in the other element in dom hierarchy
 * @parem parentElem
 * @parem childElem
 * @return true if childElem is contained in parentElem or they are the same. Otherwise return false;
 */
function contains(parentElem, childElem)
{
    var elem = childElem;

    while(elem != null)
    {
        if (elem == parentElem)
            return true;
        elem = elem.parentNode;
    }
    return false;
}

// since some fields use the onChangeFunc attribute, and others use the real onChange handler,
// this will call the proper one, in the proper window
// this is also called from nlapi functions.  We do not currently support onChange functionality.
function fireProperOnChange(elem, win)
{
    if (!isBackend) {
        if (elem != null)
        {
            if (win == null)
                win = window;
            if (elem.getAttribute('onChangeFunc'))
                win.localEval(elem.getAttribute('onChangeFunc').replace(/this/g,'document.forms.'+elem.form.name+'.'+elem.name));
            else if ((elem.type == "checkbox" || elem.type == "radio") && elem.onclick)
                elem.onclick();
            else if (elem.onchange)
                elem.onchange();
        }
    }
}

// get the value of an inline text field (handle the server-side scripting case where node.innerText is undefined)
function getInlineTextValue(node)
{
    if (( typeof node == 'undefined') || node == null)
        return "";

    if (isBackend) {
        return node.value;
    } else {
        var textValue = "";
        if(node.innerText){ // IE, Chrome, Opera
            textValue = node.innerText;
        } else {
            // Firefox
            // Note: there's no need to check <BR>, <br/> etc. as innerHTML unifies that to <br>
            textValue = node.innerHTML.replace(/<br>/gi, '\n').replace(/(<([^>]+)>)/gi,"");
        }
        return textValue;
    }
}

// set the value of an inline text field
function setInlineTextValue(node, value)
{
    if ( node == null )
        return;
    node.innerHTML = value;
    if (isBackend) {
        node.value = value;
    }
}

function findUp(node, type)
{
    while ((node != null) && (node.nodeName != type))
        node = node.parentNode;
    return node;
}

/**
 * These routines abstract handling the event object in a cross-browser manner.
 * They all handle a null event gracefully. This can happen when event handlers
 * (onpress, onclick, etc.) are called directly from Javascript.
 * They all begin with "getEvent" so that they group together.
 */

/**
 * Returns event object, taking into consideration IE's global "event" object
 * @param {Event} event event object
 * @returns {Event} event object
 */
function getEvent(evnt)
{
    return (typeof(evnt) != 'undefined' && evnt) ? evnt : ((typeof(event) != 'undefined' && event) ? event : null);
}

/**
 * Returns event target
 * @param {Event} e event object
 * @returns {HTMLElement} event target
 */
function getTarget(event)
{
    var evt = getEvent(event);
    return evt.target || evt.srcElement;
}

/**
 * Add event handler to an html object
 * @param event the name of the event to attach to, which follows Mozilla event naming convention (mousedown, mouseup etc)
 * @param element the element to attach the event handler to
 * @param handler the function object that serves as event handler. The return value (true/false) of the function object
 *               will be passed back to the system, and determine wheter the default handling of the event should be
 *               executed.
 * @param useCapture whether use capturing or bubbling phase
 */
function attachEventHandler(event, element, handler, useCapture)
{
    var evt = getEvent(event);
    var handlerBound = function(event)
    {
        var evt = getEvent(event);
        handler.call(element, evt);
    };
    handler.handlerBound = handlerBound;
    if (element.addEventListener)
    {
        element.addEventListener(evt, handlerBound, !!useCapture);
    }
    else if (element.attachEvent)
    {
        element.attachEvent('on' + evt, handlerBound);
    }
    else
    {
        element['on' + evt] = handlerBound;
    }
}

/**
 * Detach event handler
 * @param event the name of the event to detach from, which follows Mozilla event naming convention (mousedown, mouseup etc)
 * @param element the element to detach the event handler from
 * @param handler the function object that was attached as event handler.
 * @param useCapture whether use capturing or bubbling phase
 */
function detachEventHandler(event, element, handler, useCapture)
{
    var evt = getEvent(event);
    if (element.removeEventListener)
    {
        element.removeEventListener(evt, handler.handlerBound, !!useCapture);
    }
    else if (element.detachEvent)
    {
        element.detachEvent('on' + evt, handler.handlerBound);
    }
    else
    {
        element['on' + evt] = null;
    }
}

/**
 * Cancels default event behavior. Use this method only when property <code>cancelable</code> is set to <code>true</code>.
 * @param {Event} e event object
 */
function preventDefault(event)
{
    var evt = getEvent(event);
    if (evt.preventDefault)
    {
        evt.preventDefault();
    }
    else
    {
        evt.returnValue = false;
    }
}

/**
 * Cancels any further event capturing or bubbling. Use this method only when property <code>bubble</code> is set to <code>true</code>.
 * @param {Event} e objekt udÃ¡losti
 */
function stopPropagation(event)
{
    var evt = getEvent(event);
    if (evt.stopPropagation)
    {
        evt.stopPropagation();
    }
    else
    {
        evt.cancelBubble = true;
    }
}

// these routines abstract checking of modifier keys
function getEventAltKey(evnt)
{
    evnt = getEvent(evnt);

    if (evnt && typeof evnt.altKey != "undefined")
	{
        return evnt.altKey;
    }
    else if(typeof event != "undefined" && typeof event.altKey != "undefined")
    {
        return event.altKey;
    }

	return false;
}

function getEventCtrlKey(evnt)
{
    evnt = getEvent(evnt);
    return (evnt) ? evnt.ctrlKey : false;
}

function getEventShiftKey(evnt)
{
    evnt = getEvent(evnt);
    return (evnt) ? evnt.shiftKey : false;
}

// return the target element
function getEventTarget(evnt)
{
    evnt = getEvent(evnt);
    if (evnt)
    {
        if (evnt.srcElement)
            return evnt.srcElement;         // IE uses srcElement
        if (evnt.target)
            return evnt.target;             // Netscape, Firefox and Safari use target
    }

    return null;                            // Something unknown is going on here
}

// return the type of the target element
function getEventTargetType(evnt)
{
    evnt = getEventTarget(evnt);
    return (evnt) ? evnt.type : null;
}

// sets the event so default actions are not performed
function setEventPreventDefault(evnt)
{
    evnt = getEvent(evnt);
    if (evnt)
    {
        if (evnt.preventDefault)
            evnt.preventDefault();
        else
            evnt.returnValue = false;
    }
}

// set the event to not bubble up to parents
function setEventCancelBubble(evnt)
{
    evnt = getEvent(evnt);
    if (evnt)
    {
        if (evnt.stopPropagation)
            evnt.stopPropagation();
        else
            evnt.cancelBubble = true;
    }
}

// Helper function used to restore all HTML editors in a form
function restoreHtmlEditors( frm )
{
    if ( typeof NetSuite == "object" && typeof NetSuite.RTEManager == "object" )
    {
		var vfFunc = document.forms['main_form'] != null && document.forms['main_form'].elements.nlapiVF != null ? document.forms['main_form'].elements.nlapiVF.value : null;
		try
		{
			if (vfFunc != null)
				document.forms['main_form'].elements.nlapiVF.value = '';
            NetSuite.RTEManager.getMap().eachKey(function (key, value) {
                var editor = value.obj;
				if (( frm == null || editor.hddn.form == frm ) && editor.getValue() != editor.hddn.value ) {
                    editor.setValue( editor.hddn.value );
                }
             });
		}
		finally
		{
			if (vfFunc != null)
				document.forms['main_form'].elements.nlapiVF.value = vfFunc;
		}
	}
}

function nlFieldHelp(perm, fieldName, flhId, fld, helpTopic)
{
    var url = '/core/help/fieldhelp.nl?fld=' + fieldName + '&flhId=' + flhId;
    if (helpTopic)
    {
    	url = url + "&topic=" + helpTopic;
    }

    if (NS && NS.Dashboard)
    {
        nlExtOpenWindow(url, 'fieldhelp', 400, 150, fld, "no", "Field Help", {}, fld);
        return false;
    }

    var winname = 'fieldhelp';
    var width = 400;
    var height = 150;
    if (fld != null)
    {
        var left= Math.min(screen.availWidth-width,getObjectLeft(fld));
        var top = Math.min((screen.availHeight-40)-height,getObjectTop(fld) + fld.offsetHeight);
    }
    var win = window[winname];
    // if we set scrollbars to 'yes' all of the time, IE still shows a disabled scroll bar when the content does not need it.  We have special handling
    // in fieldhelp.nl to add scrollbars for IE only if they need them.  We can always add them outside of IE because the other browsers are smart
    // enough to show only when content extends beyond the height of the window
    if (typeof win == "undefined" ||  win == null || win.closed )
        win = window.open(url, winname, 'scrollbars='+(isIE ? 'no' : 'yes')+',width='+Math.min(screen.availWidth,width)+',height=100,left=' + left + ',top=' + top + ',resizable=yes');
    else
    {
        win.location = url;
        win.moveTo(left, top);
    }
    win.focus();
    window[winname] = win;

    return false;
}

// this allows servers side and client side to treat alerts differently - server side overrides the function
function NLAlert(msg,ignoreServerSide)
{
    alert(msg);
}

function findClassUp(node, clss)
{
    // classAlias is used to label a node with a certain className, so that
    // it can be located by this method, while the node
    // can use another class for real layout rendering
    while ((node != null) && (node.className != clss && node.classAlias != clss))
        node = node.parentNode;
    return node;
}

function getScrollLeftOffset(btn)
{
    // sometimes popups are contained within divs that are scrollable. (in xlist list pages, etc)
    // In this case we have to compensate for the scroll position when we put the popup on the page
    var scrollLeftOffset = 0;
    var scrollDiv;
    if(btn != null && (scrollDiv = findClassUp(btn,'scrollarea')) != null)
    {
        scrollLeftOffset = scrollDiv.scrollLeft;
    }
    else if ( (scrollDiv = document.getElementById('div__body')) != null )
    {
        scrollLeftOffset = scrollDiv.scrollLeft;
    }

    return scrollLeftOffset;
}

function getScrollTopOffset(btn)
{
    // sometimes popups are contained within divs that are scrollable. (in xlist list pages, etc)
    // In this case we have to compensate for the scroll position when we put the popup on the page
    var scrollTopOffset = 0;
    var scrollDiv;
    if(btn != null && (scrollDiv = findClassUp(btn,'scrollarea')) != null)
    {
        scrollTopOffset = scrollDiv.scrollTop;
    }
    else if ( (scrollDiv = document.getElementById('div__body')) != null )
    {
        scrollTopOffset = scrollDiv.scrollTop;
    }

    return scrollTopOffset;
}

/**
 * remove all the child nodes
 */
function removeAllChildren(obj)
{
    while (obj.childNodes[0])
    {
        obj.removeChild(obj.childNodes[0]);
    }
}

// basic stringbuffer implementation
function StringBuffer() { this.buffer = []; }
StringBuffer.prototype.append = function(string)
{
    this.buffer.push(string);
    return this;
};

StringBuffer.prototype.toString = function()
{
    return this.buffer.join("");
};

function setObjectOpacity(opacity, styleElem)
{
    var style = styleElem.style;
    style.opacity = (opacity / 100);
    style.MozOpacity = (opacity / 100);
    style.filter = "alpha(opacity=" + opacity + ")";
}

function fadeObjectOpacity(styleElem, startOpacity, endOpacity, elapsedTime)
{
    var speed = Math.round(elapsedTime / 100);
    var timer = 0, i;

    if(startOpacity > endOpacity)
    {
        for(i = startOpacity; i >= endOpacity; i--)
        {
            setTimeout(function(){setObjectOpacity(i, styleElem);}, (timer * speed));
            timer++;
        }
    }
    else if(startOpacity < endOpacity)
    {
        for(i = startOpacity; i <= endOpacity; i++)
        {
            setTimeout(function(){setObjectOpacity(i, styleElem);}, (timer * speed));
            timer++;
        }
    }
}

function tellafriend(strSubject, strAddress, strBodyMain, strBodyName, strBodyPrice, strBodyLink, strPrice)
{
    var strBody = encodeURIComponent (strAddress)+ ",%0d%0a%0d%0a";
    strBody += encodeURIComponent(strBodyMain) + encodeURIComponent(location.hostname) + ".%0d%0a%0d%0a";
    strBody += encodeURIComponent(strBodyName) + encodeURIComponent(document.title) + ".%0d%0a";
    strBody += encodeURIComponent(strBodyPrice) + encodeURIComponent(strPrice)+ "%0d%0a";
    strBody += encodeURIComponent(strBodyLink) + encodeURIComponent(location.href) + "%0d%0a";
    location.href = "mailto:?subject=" + encodeURIComponent(strSubject) + "&body=" + strBody;
}

function isLeftButtonDown(evnt)
{
    var bLeftClick = false;
    var e = getEvent(evnt);

    if(isIE && e.button==1 || (!isIE && e.button==0))
        bLeftClick = true;

    return bLeftClick;

}

function isRightButtonDown(evnt)
{
    var bRightClick = false;
    var e = getEvent(evnt);

    if(e.button==2) // ie, mozilla (ctrl-click on mac)
        bRightClick = true;

    return bRightClick;

}

function getSelectedTextRange (elem)
{
    var startPos, endPos, range;
    if (document.all)
    {
        var selectedText = document.selection.createRange();
        range = selectedText.duplicate();
        range.moveToElementText(elem);
        range.setEndPoint('EndToEnd', selectedText);
        startPos = range.text.length - selectedText.text.length;
        endPos   = startPos + selectedText.text.length;
    }
    else
    {
        startPos = elem.selectionStart;
        endPos   = elem.selectionEnd;
    }
    range = [];
    range[0] = startPos;
    range[1] = endPos;
    return range;
}

// insert text at cursor pos for text and textarea
function insertTextAtCursor (elem, text)
{
    elem.focus();
    if (document.all)
    {
        var sel = document.selection.createRange();
        sel.text = text;
        sel.scrollIntoView(true);
    }
    else
    {
        var startPos = elem.selectionStart;
        var endPos   = elem.selectionEnd;
        elem.value = elem.value.substring(0, startPos) + text + elem.value.substring(endPos);
        // adjust cursor position to the end
        elem.selectionEnd = elem.selectionStart + text.length;
        elem.selectionStart = elem.selectionEnd;
    }
}

function setWindowChanged(win, bChanged)
{
    win.NS.form.setChanged(bChanged);
}

function escapeHTML (text)
{
    var div = document.createElement('div');
    var textNode = document.createTextNode(text);
    div.appendChild(textNode);
    return div.innerHTML;
}

function escapeHTMLAttr (text)
{
    text = escapeHTML(text);
    return text.replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

//get runtime size property value
//this does not work for values defined other than pixel, such as border-width:medium
function getRuntimeSize(el, styleProp)
{
    var val = getRuntimeStyle(el, styleProp);
    if (!val)
        return 0;
    val = val.replace("px", "");
    if (isNaN(val)) // primarily for IE before IE 9
        return 0;
    return val*1.0; //return number only
}

//get runtime property value
//styleProp is in camel format such as borderWidth
function getRuntimeStyle(el, styleProp)
{
    var val = null;
    if (typeof el == "string")
        el = document.getElementById(el);
    if (el == null)
        return val;

    // getComputedStyle will be supported in IE 9
	if (window.getComputedStyle)
	    val = document.defaultView.getComputedStyle(el, null)[styleProp];
    else if (el.currentStyle)
        val = el.currentStyle[styleProp];

    if (val == "auto")
    {
        if (styleProp == "height")
            val = el.offsetHeight;
        else if (styleProp == "width")
            val = el.offsetWidth;
    }
	return val;
}

// convert dash seperated string to camalized version: background-color -> backgroundColor
function camelize(str)
{
    var parts = str.split('-');
    var len = parts.length;
    if (len == 1) return parts[0];

    var camelized = str.charAt(0) == '-'
      ? parts[0].charAt(0).toUpperCase() + parts[0].substring(1)
      : parts[0];

    for (var i = 1; i < len; i++)
      camelized += parts[i].charAt(0).toUpperCase() + parts[i].substring(1);

    return camelized;
}

function eval_js(sScript)
{
	sScript = sScript.replace(/^\s*<!--[\s\S]*?-->\s*$/gm, '');

    try {
        return eval(sScript);
    } catch (e) {
        // output eval error to console only in debug environment
        if(isDebug) {
            if(window.console != undefined) window.console.log(e.message);
        }

        if (e instanceof SyntaxError) {
        }
    }
}

var slave_machines = {};
function extractMachineHtmlFromText(components)
{
	for (var i=0;i<components.length;i++)
	{
		var idx = components[i].indexOf("name='")+6;
		var name = components[i].substring(idx, components[i].indexOf("'>", idx));
		slave_machines[name] = components[i].substring(components[i].indexOf("'>")+2, components[i].lastIndexOf("</machine>"));
	}
}

function isFunction(obj)
{
    return Object.prototype.toString.call(obj) === '[object Function]';
}

function process_slaving_result(response)
{
    var sText = response.getBody();
    var components=sText.split("<machine");
    extractMachineHtmlFromText(components);
    var script = components[0];

    if(response.getHeaders()['newslaving'] != null)
	{
        eval(script);

        if(slaveValues['machinesData'])
		{
			slavingUtil.redrawEditMachines(slaveValues['machinesData']);
		}
        slavingUtil.processSlavingValues(slaveValues['fields']);
        if(slaveValues['aspectScript'] != null)
            if(isFunction(slaveValues['aspectScript']))
                slaveValues['aspectScript'].call();
		NS.form.setInited(true);
		window.status = '';
	}
	else
	{
	    eval_js(script);
	}

	slave_machines = {};

}
var process_slaving_result_original = process_slaving_result;

var performSlavingAsync = !isFirefox;
function setSlavingAsync(async)
{
    performSlavingAsync = async;
}
function getSlavingAsync()
{
    return performSlavingAsync;
}

// This is called in getSyncFunction() and we do not do sync calls in record validation in general. For the ones we do call we customize them.
function loadSlavingResults(url, callbacks, asynch)
{
    if (!isBackend) {
        var func = process_slaving_result;
        if(!!callbacks){
            if(typeof callbacks === 'function'){
                func = function(){
                    process_slaving_result.apply(this, arguments);
                    callbacks.apply(this, arguments);
                };
            } else if (Object.prototype.toString.call(callbacks) === '[object Array]'){
                func = function(x){
                    var i = 0;

                    process_slaving_result.apply(this, arguments);
                    while(i < callbacks.length){
                        callbacks[i++].apply(this, arguments);
                    }
                };
            }
        }
        /*if the caller doesn't want to override the asynch - just for this call, use the default value*/
        /*more common way to change asynch is to use setSlavingAsync(boolean) before calling this method*/
        if (typeof asynch === 'undefined' || asynch === null)
        {
            asynch = getSlavingAsync();
        }
        nlXMLRequestURL(url, null, null, func, asynch);
    }
}

function execute_js(response, postResponseFn)
{
	eval_js(response.getBody());
	if (postResponseFn)
		postResponseFn();
}

// Get the host name (including protocol to port if available) of the current script file
// Return null if no script tag exits or current script tag does not load a file, empty if the url starts with '/' or is invalid
function NLGetCurrentScriptFileHostName()
{
   var scripts = document.getElementsByTagName('script');
   if (!scripts || scripts.length == 0)
       return null;

   var currentScriptFileUrl = scripts[scripts.length - 1].src;
   if (!currentScriptFileUrl)
       return null;

   var hostName = currentScriptFileUrl.match(/^((http|https):\/\/)?[^\/]+/g);
   if (hostName && hostName.length>0)
       hostName = hostName[0];
   if (!hostName)
       hostName = "";

   return hostName;
}

// Load javascript by creating a dynamic script tag
// Useful to load js across domain
function NLLoadScriptInScriptTag(sUrl, id, doc)
{
   if (!doc)
       doc = document;

   var script = doc.getElementById(id);
   if (!script)
   {
       var head= doc.getElementsByTagName('head')[0];   //always exists
       script= doc.createElement('script');
       script.type= 'text/javascript';
       head.appendChild(script);
   }
   script.src= sUrl;
}

function loadXMLJSDoc(url, postResponseFn)
{
	nlXMLRequestURL(url, null, null, function(response) { execute_js(response, postResponseFn); }, true);
}

/*
issue a GET or POST request for an Internal URL resource
support for external resources can be added later if needed.
copied from nlapiRequestURL to avoid unnecessary dependency
*/
function nlXMLRequestURL(url, postdata, headers, responseHandler, async)
{
    var request = new NLXMLHttpRequest();
    if ( responseHandler instanceof Function )
        request.setResponseHandler( responseHandler );

    return request.requestURL( url, postdata, headers, async );
}

/*--------------- NLHttpXMLRequest class definition ------------*/
function NLXMLHttpRequest( ignoreErrors )
{
	this.requestPending = false;
	this.callbackFunc = null;
    this.ignoreResponseErrors = ignoreErrors;
    if ( window.XMLHttpRequest )
		this.xmlrequest = new XMLHttpRequest();
	else
	{
		try	{ this.xmlrequest = new ActiveXObject("Msxml2.XMLHTTP.4.0"); }
		catch ( e )	{ this.xmlrequest = new ActiveXObject("Msxml2.XMLHTTP"); }
	}
}
NLXMLHttpRequest.prototype.pendingSyncRequests = [];
NLXMLHttpRequest.prototype.pendingAsyncResponseCallbacks = [];
NLXMLHttpRequest.prototype.setResponseHandler = function( callbackFunc )
{
    this.callbackFunc = typeof callbackFunc == "function" ? callbackFunc : null;
};
NLXMLHttpRequest.prototype.requestURL = function( url, postdata, requestHeaders, async, httpMethod )
{
	if ( this.requestPending )
		return;

	this.requestPending = true;
	var method;

	if (!isValEmpty(httpMethod))
	    method = httpMethod;
	else
	    method = postdata != null ? "POST" : "GET";

	if (typeof nsDefaultContextObj !== 'undefined' && nsDefaultContextObj !== null)
	{
		url += url.indexOf("?") > 0 ? "&" : "?";
		url += "c=" + nsDefaultContextObj.company;
		url += "&isExternal=T";
	}

	this.xmlrequest.open( method, url, (async != null ? async : false) );
	for ( var header in requestHeaders )
		this.xmlrequest.setRequestHeader( header, requestHeaders[ header ] );
    this.xmlrequest.setRequestHeader("NSXMLHttpRequest", "NSXMLHttpRequest");
    if ( method == 'POST' || method == 'PUT')
    {
        if ( postdata instanceof String || typeof postdata == "string" || nsInstanceofDocument( postdata ) )
            this.xmlrequest.setRequestHeader("Content-Type", "text/xml; charset=UTF-8");
        else
        {
            postdata = formEncodeURLParams( postdata );
            this.xmlrequest.setRequestHeader("Content-Type", "application/x-www-form-urlencoded; charset=UTF-8");
        }
    }
    var response = null;
	if ( async )
	{
		this.xmlrequest.onreadystatechange = this.handleResponse.bindAsEventListener( this );
		this.xmlrequest.send( postdata );
	}
	else
	{
		this.pendingSyncRequests.push(this);
		try
		{
			this.xmlrequest.send(postdata);
		}
		finally
		{
			var index = (function(request){
					var result = undefined;
					var i = request.pendingSyncRequests.length;
					while(i > 0){
						i -= 1;
						if(request === request.pendingSyncRequests[i]){
							result = i;
							break;
						}
					}

					return result;
				})(this);

			if(index !== undefined){
				this.pendingSyncRequests.splice(index, 1);
			}
			while (this.pendingAsyncResponseCallbacks.length > 0){ this.pendingAsyncResponseCallbacks.shift()(); }
		}
		response = this.handleResponse( );
	}
	return response;
};
NLXMLHttpRequest.prototype.handleResponse = function()
{
	var response = null;
	if ( this.xmlrequest.readyState == 4 )  /* For now, we'll not worry about the Loading, Loaded, Interactive readyStates  */
	{
		var responseCode = this.xmlrequest.status;
		var responseBody = this.xmlrequest.responseText;
		var responseHeaders = [];
		var responseHeadersArray = this.xmlrequest.getAllResponseHeaders();
		var trim = String.prototype.trim || function(){
            return this.replace(/^\s+|\s+$/gm,'');
        };
        var isJson = function(body)
        {
            if(!body)
                return false;
            body = trim.call(body);
            return body && body.indexOf('{') === 0 && body.lastIndexOf('}') === body.length - 1;
        };

		responseHeadersArray = responseHeadersArray.replace(/^\s+/,"").replace(/\s+$/,"").split("\n");
		for ( var i = 0; i < responseHeadersArray.length; i++ )
		{
			var responseArray = responseHeadersArray[i].split(":");
			var header = responseArray[0];
            var valueArray = responseHeaders[ header ];
            if ( valueArray == null )
            {
                valueArray = [];
                responseHeaders[ header ] = valueArray
            }
            valueArray[valueArray.length] = responseArray[1];
		}
        /* Extract Netsuite Server Error (if one exists)  */
        /*
            kevinng 4/7/2011
            responseCode must be 200 or 206 with non-empty responseBody (see NLErrorPage.prepResponse())
            the changes include the fix for issue 193944 (CL 401296)
         */
		var responseError = null, onlineError;
        if (responseBody && responseBody.toLowerCase().indexOf('error')>=0)
        {
            if (isJson(responseBody))
            {
                if (responseBody.indexOf('{"error"') >= 0)
                {
                    var onlineError = JSON.parse(responseBody);
                    responseError = new NLXMLResponseError(onlineError.error.code, onlineError.error.message);
                }
            }
            else if ( responseBody.indexOf('<onlineError>') >= 0 )
            {
                onlineError = nsStringToXML( responseBody );
                responseError = new NLXMLResponseError( nsSelectValue( onlineError, '/onlineError/code' ), nsSelectValue( onlineError, '/onlineError/detail' ), nsSelectValue( onlineError, '/onlineError/id' ) );
            }
            else if ( responseBody.indexOf('<error>') >= 0 )
            {
                onlineError = nsStringToXML( responseBody );
                responseError = new NLXMLResponseError( nsSelectValue( onlineError, '/error/code' ), nsSelectValue( onlineError, '/error/message' ) );
            }
            else if (isJson(responseBody) && responseBody.indexOf('{"error"') >= 0 )
            {
                onlineError = JSON.parse( responseBody );
                responseError = new NLXMLResponseError( onlineError.error.code, onlineError.error.message );
            }
            // This error is returned for restlet and the error code is set to 4xx(client error) or 5xx(server error) and won't be 200. Not exclude 206 because it is returned as an error in NLErrorPage.
            else if ( responseBody.indexOf('error code:') >= 0 && responseBody.indexOf('error message:') >= 0 && responseCode != 200)
            {
                onlineError = responseBody.split("\n");
                responseError = new NLXMLResponseError( onlineError[0].substring("error code: ".length), onlineError[1].substring("error message: ".length) );
            }
        }
        else if ( responseCode != 200 && responseCode != 206 )
            responseError = new NLXMLResponseError( 'SERVER_RESPONSE_ERROR', responseBody );
		try
		{
			if ( responseError != null && this.callbackFunc == null && !this.ignoreResponseErrors )
				throw responseError;
			response = new NLXMLResponse( responseCode, responseBody, responseHeaders, responseError );
			if ( this.callbackFunc != null )
			{
				if(this.pendingSyncRequests.length > 0)
				{
					this.pendingAsyncResponseCallbacks.push(function(nlXMLHttpRequest, response){
						setTimeout(function(){
							nlXMLHttpRequest.callbackFunc( response );
						}, 0);
					}.bind(null, this, response));
				}
				else
				{
					this.callbackFunc( response );
				}
			}
		}
		finally
		{
			this.requestPending = false;
		}
	}
	return response;
};
/*--------------- NLXMLResponse class definition ------------*/
function NLXMLResponse( responseCode, responseBody, responseHeaders, responseError )
{
	this.code = responseCode;
	this.body = responseBody;
	this.headers = responseHeaders;
	this.error = responseError;

	this.getCode = function() { return this.code };
	this.getBody = function() { return this.body };
	this.getError = function() { return this.error };
	this.getHeaders = function() { return this.headers };
}
/*--------------- NLXMLResponse class definition ------------*/
function NLXMLResponseError( errorCode, errorBody, errorId )
{
	this.id = errorId;
	this.code = errorCode;
	this.details = errorBody;

	this.getId = function() { return this.id };
	this.getCode = function() { return this.code };
	this.getDetails = function() { return this.details };
}

/**
 * @param url URL of request handler
 * @param methodName method name on remote object to call
 * @param methodParams an array of parameters to the method
 * @param asyncCallback a callback if this is to be an async request.  Callback signature should be: callback(result, error)
 * @param httpMethod Specify GET or POST.  GET is the default.
 */
function nsServerCall(url, methodName, methodParams, asyncCallback, httpMethod)
{
	var client = new NLJsonRpcClient(url);
	return client.sendRequest(methodName, methodParams, asyncCallback, httpMethod);
}

NLJsonRpcClient = function (serverURL)
{
	if (serverURL.indexOf("?") > 0)
		serverURL = serverURL + "&jrr=T";
	else
		serverURL = serverURL + "?jrr=T";
	this.serverURL = serverURL;
	this.responseCallbackMap = {};
};
NLJsonRpcClient.requestId = 0;
NLJsonRpcClient.prototype =
{
	sendRequest : function (methodName, args, callback, httpMethod)
	{
		httpMethod = httpMethod || "GET";
		var jsonRpcReq = {
			id : NLJsonRpcClient.requestId++,
			method : "remoteObject." + methodName,
			params : args || []
		};
		if (callback != null)
			this.responseCallbackMap[jsonRpcReq.id] = callback;
		var request = new NLXMLHttpRequest();
		if (callback != null)
			request.setResponseHandler(this.handleResponseAsync.bindAsEventListener(this));

		var url = this.serverURL;
		var postData = null;
		if ("GET" == httpMethod)
		{
		 	url += "&jrid=" + jsonRpcReq.id;
		 	url += "&jrmethod=" + jsonRpcReq.method;
		 	if (jsonRpcReq.params.length > 0)
		 		url += "&jrparams=" + encodeURIComponent(toJSON(jsonRpcReq.params));
		 	if (url.length > 2083) // 2083 is max url length in IE
		    {
		    	httpMethod = "POST";
		    	url = this.serverURL + "&jrq=T";
		    }
		}
		if ("POST" == httpMethod)
		{
			postData = toJSON(jsonRpcReq);
		}
       	var response = request.requestURL(url, postData, null, callback != null ? true : false);
		if (callback == null)
		{
			var jsonRpcResp = this.getJsonRpcResponse(response);
			if (jsonRpcResp.error)
				throw new NLXMLResponseError(jsonRpcResp.error.code, jsonRpcResp.error.trace, jsonRpcResp.error.msg);
			response = jsonRpcResp.result;
		}
		return response;
	},

	getJsonRpcResponse : function (nlXMLResponseObj)
	{
		var jsonRpcResp = nlXMLResponseObj.getBody();
		if (jsonRpcResp != null)
			jsonRpcResp = jsonRpcResp.replace(/^\s*<!--[\s\S]*?-->\s*$/gm, '');
		eval("jsonRpcResp = " + jsonRpcResp + ";");
		return jsonRpcResp;
	},

	handleResponseAsync : function (nlXMLResponseObj)
	{
		var jsonRpcResp = this.getJsonRpcResponse(nlXMLResponseObj);
		var callback = this.responseCallbackMap[jsonRpcResp.id];
		this.responseCallbackMap[jsonRpcResp.id] = null;
		callback(jsonRpcResp.result, jsonRpcResp.error);
	}
};

if (typeof Function.prototype.bind !== 'function') {
    Function.prototype.bind = function(object) {
        var __method = this;
        return function() {
            __method.apply(object, arguments);
        }
    }
}

Function.prototype.bindAsEventListener = function(object) {
  var __method = this;
  return function(event) {
    __method.call(object, event || window.event);
  }
};

function clone(srcobj)
{
	if(typeof(srcobj) != 'object') return srcobj;
	if(srcobj == null) return srcobj;

	var newObj = {};

	for(var i in srcobj)
		newObj[i] = clone(srcobj[i]);

	return newObj;
}

/**
 * Returns the input with 'pad' prepended.  If that goes
 * longer than cols avail, it gets a newline (also padded)
 */
function leftPadWithWrapping(input, pad, colsAvail)
{
    // safety-inits, and check for edge cases
    if(pad==null) pad = '';
    if(input==null)
        input = '';
    else
        input = trim(input);

    // if colsAvail not longer than pad, we will never get through input.
    // input just gets truncated in this case and we return one line of pad
    if( colsAvail <= pad.length )
        return pad.substring(0,colsAvail);


    var newlen =  pad.length+input.length;  // len after padding
    if( newlen <= colsAvail ) { // we need not wrap
        return pad+input;
    }
    else{                       // we must wrap
        var i = input.length- (newlen-colsAvail);
        return (pad+input.substring(0,i)) + '\n' + leftPadWithWrapping(input.substring(i), pad, colsAvail);
    }
}

function nlFireEvent(element,event) {
	if (document.createEvent){
		// dispatch for standard browsers
		var eventType = 'HTMLEvents';
		if (event == 'click' || event.indexOf('mouse') == 0) {
			eventType = 'MouseEvents';
		}
		var evt = document.createEvent(eventType);
		evt.initEvent(event, true, true );
		return !element.dispatchEvent(evt);
	} else {
		// dispatch for old/quirk IE
		var evt = document.createEventObject();
		return element.fireEvent('on' + event, evt);
	}
}

function getOuterHTML(object)
{
    var element;
    if (!object) return null;

    if (object.outerHTML)
        return object.outerHTML;
    element = document.createElement("div");
    element.appendChild(object.cloneNode(true));
    return element.innerHTML;
}

function NLNumberToString(number, win)
{
    if (typeof win == 'undefined'){
        win = window;
    }

    var str = number + '';
    if(win.groupseparator == '')
        return str;
    var lastComma = str.lastIndexOf(",");
    var lastDot = str.lastIndexOf(".");
    var separator = '.';
    if (lastComma > lastDot)
        separator = ',';
    var parts = str.split(separator);
    var integerPart = parts[0];
    var decimalPart = parts.length > 1 ? win.decimalseparator + parts[1] : '';
    var regex = /(\d+)(\d{3})/;
    while (regex.test(integerPart))
    {
        integerPart = integerPart.replace(regex, '$1' + win.groupseparator + '$2');
    }

    if(number < 0 && win.negativeprefix != '-')
        return win.negativeprefix + integerPart.replace('-', '') + decimalPart + win.negativesuffix;
    else
        return integerPart + decimalPart;
}

function NLStringToNumber(str, addZeroPadding)
{
    if(isValEmpty(str))
        return "";
    // handle percentage string
    if(str.indexOf('%') >= 0)
        return NLStringToNumber(str.replace('%',''),addZeroPadding) + '%';
    if(window.groupseparator && window.groupseparator != '')
        str = str.replace(new RegExp( '\\' + window.groupseparator, 'g'), '');
    if(window.negativeprefix != '-' && str.indexOf(window.negativeprefix) == 0)
        str = '-' + str.replace(window.negativeprefix, '').replace(window.negativesuffix, '');
    if(window.decimalseparator == ',')
        str = str.replace(',', '.');

    var number = parseFloat(str);
    if (isNaN(number))
    {
        return NaN;
    }

    if (addZeroPadding)
    {
        var paddingLength = 0;
        var decimalSeperatorIndex = str.indexOf(".");
        if (decimalSeperatorIndex != -1)
            paddingLength = str.length - decimalSeperatorIndex - 1;
        number = number.toFixed(paddingLength);
    }
    return number;
}

// first convert string to number, then pad trailing 0's to match the original string's trailing 0's
function NLStringToNormalizedNumberString(str)
{
    var decimalSeperatorIndex = str.indexOf(window.decimalseparator);
    return NLStringToNumber(str, decimalSeperatorIndex != -1) + "";
}

// Hide the div element
function NLHideDiv(divName)
{
	var divEle = document.getElementById(divName);
	divEle.style.display = "none";
}

function NLCreateCookie(name,value,days)
{
    var expires = "";
    if (days)
    {
        var date = new Date();
        date.setTime(date.getTime()+(days*24*60*60*1000));
        expires = "; expires="+date.toGMTString();
    }

    document.cookie = name+"="+value+expires+"; path=/";
}

function escapeJSChars (content)
{
    var returnStr = '';
    for (var i = 0; i < content.length; i++)
    {
        var c = content.substr(i, 1);
        if (c == "\'" || c== "\"" || c== "\\")
            returnStr += "\\";

        returnStr += c;
    }
    return returnStr;
}

function expandOrCollapseRows(machine, rownum, shouldCollapse)
{
    var EXPAND_ICON_URL = '/images/forms/plus.svg';
    var COLLAPSE_ICON_URL = '/images/forms/minus.svg';

    var expandOrCollapseIcon = document.getElementById(machine + 'row' + rownum + 'collapse');
    if (!expandOrCollapseIcon)
        return;

    if (typeof shouldCollapse == 'undefined')
        shouldCollapse = (expandOrCollapseIcon.src.indexOf(COLLAPSE_ICON_URL) != -1);

    for (var i = rownum + 1; !document.getElementById(machine + 'row' + i + 'collapse'); i++)
    {
        var currentRow = document.getElementById(machine + 'row' + i);
        if (!currentRow)
            break;

        currentRow.style.display = shouldCollapse ? 'none' : '';
    }

    expandOrCollapseIcon.src = shouldCollapse ? EXPAND_ICON_URL : COLLAPSE_ICON_URL;
}

function expandOrCollapseAllRows(machine, shouldCollapse)
{
    for (var i = 0; document.getElementById(machine + 'row' + i); i++)
        expandOrCollapseRows(machine, i, shouldCollapse);
}

function setLabel( spanId, label)
{
    if (!isBackend)
    {
        var spanLabel = document.getElementById( spanId + "_lbl" );
        if (spanLabel == null)
        return;

        // span may contain inner anchor element
        var labelElement = spanLabel;
        var anchors = labelElement.getElementsByTagName("A");
        if (anchors.length > 0)
    	{
            labelElement = anchors[0];
    	}

        labelElement.innerHTML = label;

        var uirLabel = document.getElementById( spanId + "_lbl_uir_label" );
        if (uirLabel)
        {
            NS.jQuery(uirLabel).toggleClass("uir-label-empty", label.length === 0);
        }
    }
}

function globalFunctionOrDummy(name, defaultResult) {
    return (name in window) ? window[name] : function () { return defaultResult; };
}

if (!isBackend)
{
    // in FF, alert/confirm can be suppressed via GUI and results in exception. we don't really care about these cases.
    var alert_inner = alert;
    window.alert = function(text)
    {
        try
        {
            alert_inner(text);
        }
        catch(e)
        {
        }
    };

    var confirm_inner = confirm;
    window.confirm = function (text)
    {
        try
        {
            return confirm_inner(text);
        }
        catch (e)
        {
            // we assume user clicked "OK"
            return true;
        }
    };
}
