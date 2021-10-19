


















var BGBUTTON = "3B89D8";

var isNetscape = true;
var isFirefox = true;
var isChrome = false;
var isSafari = false;
var isIPHONE = false;
var isSAFARI = false;
var isMAC = false;
var isSuitePhone = false;

var isCustomerFacingEnvironment = true;

// Do this once to make sure the zoom factor is set for the default value, in case it isn't called.
var ZOOM_FACTOR = 1.0;
var ADMI_HEADING = "ADMI_HEADING";


var portletMaxControlImgUrl = "/images/icons/dashboard/portletelements/chiles/maximize.gif";
var portletMaxControlHighLightImgUrl = "/images/icons/dashboard/portletelements/chiles/maximize_hl.gif";
var portletMinControlImgUrl = "/images/icons/dashboard/portletelements/chiles/minimize.gif";
var portletMinControlHighLightImgUrl = "/images/icons/dashboard/portletelements/chiles/minimize_hl.gif";

var NLField_MANDATORY = 128;
var NLField_DEFAULT = 0;
var NLFieldConstants_DISABLED = 2048;
var NLFieldConstants_TYPEAHEAD = 2147483648;
var NLFieldConstants_NOARROW = 1073741824;
var NLFieldConstants_EXTREME = 256;

// -- initialize editor fonts
var fontNames =	{
    "Font" : "",
					"Verdana" : "Verdana",
					"Arial"	: "Arial",
					"Courier New" : "Courier New",
					"Times New Roman" : "Times New Roman",
					"Comic Sans" : "Comic Sans MS",
					"Georgia" : "Georgia",
					"Tahoma" : "Tahoma",
					"Trebuchet" : "Trebuchet MS"
				};

// -- initialize editor font colors
var fontColors = {
    "Color"          : "",
    "Black"         : "#000000",
    "Red"	        : "#FF0000",
    "Blue"          : "#0000FF",
    "Dark Blue"     : "#00008B",
    "Navy Blue"     : "#000080",
    "Brown"         : "#A52A2A",
    "Green"         : "#008000",
    "Orange"        : "#FFA500",
    "Light Grey"    : "#D3D3D3",
    "Silver"        : "#C0C0C0"
};

// -- initialize editor font sizes
var fontSizes =	{
    "Size" : "",
    "8"  :  "1",
    "10" : "2",
    "12" : "3",
    "14" : "4",
    "18" : "5",
    "24" : "6",
    "36" : "7"
};

// translated RTE labels and helper text
var NLHTMLEDITOR_FORMATTED_LABEL = "Formatted Text";
var NLHTMLEDITOR_SOURCECODE_LABEL = "HTML Source Code";
var NLHTMLEDITOR_FORMATTED_HELPER_TEXT = "Type text and format it using the toolbar.";
var NLHTMLEDITOR_FORMATTED_HELPER_TEXT_WITH_STYLE = "<font color=\"#666666\">"+NLHTMLEDITOR_FORMATTED_HELPER_TEXT+"</font>";
var NLHTMLEDITOR_SOURCECODE_HELPER_TEXT = "<!-- Type or paste HTML code -->";
var NLHTMLEDITOR_STYLE_SMALL_TEXT = "smalltext";

var iMAX_SUGGESTIONS = 25;

var NLHEADING_NO_RESULTS_FOUND = "No results found";
var PAGE_LOADING = "Loading";
var PAGE_NO_SELECTIONS_MADE = "No Selections Made";
var HEADING_MORE_OPTIONS = "More Options";
var PAGE_REFRESHING = "Refreshing";
var HEADING_PLEASE_ENTER_MORE_CHARACTERS_OR_CLICK_GO = "Please enter more characters or click Go";
var BUTTON_VIEW_DASHBOARD = "View Dashboard";
var PAGE_EDIT = "Edit";
var PAGE_MORE = "More...";

// Help strings for NLPopupSelect widgets
var _popup_help = '<Enter first few letters then tab>';
var _short_popup_help = '<Type then tab>';
var _mult_popup_help = '<Type & tab for single value>';
var _popup_help_search = 'Type & tab...';

var FIELD_DATA = "_mdata";
var FIELD_LABEL = "_mlabels";

function NLHtmlEditor_buildToolBar()
{
	this.toolbar = document.createElement("DIV");
	this.toolbar.id = this.name+'_toolbar';
	this.toolbar.style.padding = '4px 4px 2px 4px';
	this.toolbar.style.height = '22px';
	this.toolbar.unselectable = 'on';
	this.toolbar.style.backgroundColor = "#ECEFF6";
	this.toolbar.style.borderWidth='0px';
	this.main.appendChild( this.toolbar );

	// -- now add toolbar icons
	this.buildToolBarIcon('fontname', 'Font', 'FontName');
	this.buildToolBarIcon('fontsize', 'Size', 'FontSize');
	this.buildToolBarIcon('fontcolor', 'Color', 'ForeColor');
	if ( isNaN(this.width) || parseInt(this.width) > 425 )
		this.buildToolBarLiner();
	else
		this.buildToolBarLineBreak();
	this.buildToolBarIcon('bold', 'Bold', 'Bold');
	this.buildToolBarIcon('italic', 'Italic', 'Italic');
	this.buildToolBarIcon('underline', 'Underline', 'Underline');
	this.buildToolBarLiner();
	this.buildToolBarIcon('justifyleft', 'Justify Left', 'JustifyLeft');
	this.buildToolBarIcon('justifycenter', 'Justify Center', 'JustifyCenter');
	this.buildToolBarIcon('justifyright', 'Justify Right', 'JustifyRight');
    if (!isSafari) { // the 4 commands below are not supported by safari 2%>
    this.buildToolBarLiner();
	this.buildToolBarIcon('insertorderedlist', 'Ordered\x20List', 'InsertOrderedList');
	this.buildToolBarIcon('insertunorderedlist', 'Unordered\x20List', 'InsertUnorderedList');
	this.buildToolBarIcon('outdent', 'Outdent', 'Outdent');
	this.buildToolBarIcon('indent', 'Indent', 'Indent');
   }
}
