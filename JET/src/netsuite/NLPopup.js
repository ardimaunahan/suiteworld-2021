





/**
 * adjust the layout of the popup and display
 * @param style The style of the popup, none - no style, default - square angle/blue background
 * @param block Show the gray layer or not behind the popup
 */
nlPopupLite.prototype.adjustPopupSize = function nlPopupLite_adjustPopupSize(bDynamic, style, bPosition)
{
    if (typeof style == "undefined")
        style = this.style;

    var width = Math.max(this.nativeContentObject.body.scrollWidth, this.width);
    if (width == 0)
    {
        width = this.defaultWidth;
    }

    var height = Math.max(this.nativeContentObject.body.scrollHeight, this.height);
    if (height == 0)
    {
        height = this.defaultHeight;
    }

    if (style == POPUP_LAYOUT_STYLE_DEFAULT)
    {
        this.nativeTopObject.style.border = "0";
        this.nativeContentObject.body.style.border = "0";
    }

    if(this.dynamicSize)
    {
        while (height/width > .75)
        {
            width += 50;
            this.nativeTopObject.style.width = width + 'px';
            if (height == this.nativeContentObject.body.scrollHeight)
                break;
            width = this.nativeContentObject.body.scrollWidth;
            height = this.nativeContentObject.body.scrollHeight;
        }
    }

    if (document.all)
    {
        this.nativeTopObject.style.width = (width + getRuntimeSize(this.nativeTopObject, "borderLeftWidth") + getRuntimeSize(this.nativeTopObject, "borderRightWidth") + 2) + 'px';
        this.nativeTopObject.style.height = (height + getRuntimeSize(this.nativeTopObject, "borderTopWidth") + getRuntimeSize(this.nativeTopObject, "borderBottomWidth") + 2) + 'px';
    }
    else
    {
        width += getRuntimeSize(this.nativeContentObject.body, "borderLeftWidth") +  getRuntimeSize(this.nativeContentObject.body, "borderLeftWidth") + getRuntimeSize(this.nativeContentObject.body, "marginLeft") +  getRuntimeSize(this.nativeContentObject.body, "marginRight");
        
        height += getRuntimeSize(this.nativeContentObject.body, "borderTopWidth") +  getRuntimeSize(this.nativeContentObject.body, "borderBottomWidth") + + getRuntimeSize(this.nativeContentObject.body, "marginTop") +  getRuntimeSize(this.nativeContentObject.body, "marginBottom") + 10;
        this.nativeTopObject.style.width = (width - getRuntimeSize(this.nativeTopObject, "paddingLeft") - getRuntimeSize(this.nativeTopObject, "paddingRight")) + 'px';
        this.nativeTopObject.style.height = (height - getRuntimeSize(this.nativeTopObject, "paddingTop") - getRuntimeSize(this.nativeTopObject, "paddingBottom")) + 'px';

    }

    if (bPosition != false)
        this.setPosition();

    
    setTimeout(function(){this.nativeTopObject.style.visibility = "visible";}.bind(this), 0);
    
};

nlMessageContent.prototype.getContent = function(contentTemplate)
{
    var content = contentTemplate;
    if (!content)
        content = MSG_POPUP_SHELL;

    if (typeof this.message != "undefined" && this.message != null)
        content = content.replace("<messagecontent/>", this.message);
    if (typeof this.title != "undefined" && this.title != null)
        content = content.replace("<messagetitle/>", this.title);
    if (typeof this.style != "undefined" && this.style != null)
    {
        var img = "<img src=\"" + msgPopupIcons[this.style] + "\" />";
        content = content.replace("<messageicon/>", img);
    }

    return content;
};

nlConfirmContent.prototype = new nlMessageContent;
nlConfirmContent.prototype.getContent = function()
{
    var content = this.constructor.prototype.getContent.call(this,CONFIRM_POPUP_SHELL);
    if (!this.okAction)
        this.okAction = "";
    content = content.replace("<okaction/>", this.okAction);
    if (!this.cancelAction)
        this.cancelAction = "";
    content = content.replace("<cancelaction/>", this.cancelAction);

    return content;
};

nlPetContent.prototype.getContent = function(contentTemplate)
{
	var content = contentTemplate;
    if (!content)
        content = PET_POPUP_SHELL;

	if (!this.okAction)
        this.okAction = "";

	 content = content.replace("<okaction/>", this.okAction);

	if (!this.submitAsCaseAction)
        this.submitAsCaseAction = "";

	content = content.replace("<submitascaseaction/>", this.submitAsCaseAction);

	if (!this.petDataHtml)
        this.petDataHtml = "";

	content = content.replace("<petdata/>", this.petDataHtml);

	if(!this.petDataNonHtml)
		this.petDataNonHtml = "";

	return content;
};

nlPetContent.prototype.submitAsCase = function nlPetContent_submitAsCase()
{
	
    return false;
};

nlProgressContent.prototype.getContent = function()
{
    var content = PROGRESS_POPUP_SHELL;
    if (typeof this.message != "undefined" && this.message != null)
        content = content.replace("<messagecontent/>", this.message);
    if (typeof this.title != "undefined" && this.title != null)
        content = content.replace("<messagetitle/>", this.title);

    var img = "<img src=\"/images/icons/progress/progress_waitBar.gif\" />";
    content = content.replace("<messageicon/>", img);

    if (typeof this.action != "undefined" && this.action != null)
        content = content.replace("<cancelaction/>", this.action);

    return content;
};

nlSaveContent.prototype = new nlMessageContent;
nlSaveContent.prototype.getContent = function()
{
    var content = this.constructor.prototype.getContent.call(this,SAVE_POPUP_SHELL);
    if (!this.okAction)
        this.okAction = "";
    content = content.replace("<okaction/>", this.okAction);

    return content;
};

var MSG_POPUP_SHELL = "<table class=\"uir-popup\" width=\'100%\' cellspacing=\'0\' cellpadding=\'0\' role=\'presentation\'>     <tr class=\"uir-popup-header\">         <td>             <table width=\'100%\' height=\'100%\' cellspacing=\'0\' cellpadding=\'0\' role=\'presentation\'>                 <tr>                     <td valign=\'middle\' nowrap=\'\' style=\'padding-left: 2px;\'>                     </td>                      <td nowrap=\'\' class=\'smalltextb\' style=\'padding-left: 5px; padding-right: 1px;\'>                         <messagetitle/>                     </td>                 </tr>             </table>         </td>     </tr>      <tr class=\"uir-popup-body\"><td><table cellspacing=5 cellpadding=0 class=\"smalltextnolink\"><tr><td style=\"padding-right:20px\" valign=\"top\"><messageicon/></td><td width=\'100%\'><messagecontent/></td></tr><tr><td/></tr><tr><td  align=\"right\" colspan=2><table cellspacing=\'0\' cellpadding=\'0\'><tr><td> <table id=\'tbl_ok\' cellpadding=\'0\' cellspacing=\'0\' border=\'0\' class=\'uir-button\' style=\'margin-right:6px;cursor:hand;\' role=\'presentation\'> <tr id=\'tr_ok\' class=\'pgBntG pgBntB\'> <td id=\'tdleftcap_ok\'><img src=\'/images/nav/ns_x.gif\' class=\'bntLT\' border=\'0\' height=\'50%\' width=\'3\' alt=\'\'/> <img src=\'/images/nav/ns_x.gif\' class=\'bntLB\' border=\'0\' height=\'50%\' width=\'3\' alt=\'\'/> </td> <td id=\'tdbody_ok\' height=\'20\' valign=\'top\' nowrap class=\'bntBgB\'> <input type=\'button\' style=\'width:50px\' class=\'rndbuttoninpt bntBgT\' value=\'OK\' id=\'ok\' name=\'ok\' onclick=\"closePopup(); return false;\" onmousedown=\"this.setAttribute(\'_mousedown\',\'T\'); setButtonDown(true, true, this);\" onmouseup=\"this.setAttribute(\'_mousedown\',\'F\'); setButtonDown(false, true, this);\" onmouseout=\"if(this.getAttribute(\'_mousedown\')==\'T\') setButtonDown(false, true, this);\" onmouseover=\"if(this.getAttribute(\'_mousedown\')==\'T\') setButtonDown(true, true, this);\" ></td> <td id=\'tdrightcap_ok\'> <img src=\'/images/nav/ns_x.gif\' height=\'50%\' class=\'bntRT\' border=\'0\' width=\'3\' alt=\'\'> <img src=\'/images/nav/ns_x.gif\' height=\'50%\' class=\'bntRB\' border=\'0\' width=\'3\' alt=\'\'> </td> </tr> </table> </td></tr></table></td></tr></table></td></tr>     <tr><td></td></tr> </table>";
var CONFIRM_POPUP_SHELL = "<table class=\"uir-popup\" width=\'100%\' cellspacing=\'0\' cellpadding=\'0\' role=\'presentation\'>     <tr class=\"uir-popup-header\">         <td>             <table width=\'100%\' height=\'100%\' cellspacing=\'0\' cellpadding=\'0\' role=\'presentation\'>                 <tr>                     <td valign=\'middle\' nowrap=\'\' style=\'padding-left: 2px;\'>                     </td>                      <td nowrap=\'\' class=\'smalltextb\' style=\'padding-left: 5px; padding-right: 1px;\'>                         <messagetitle/>                     </td>                 </tr>             </table>         </td>     </tr>      <tr class=\"uir-popup-body\"><td><table cellspacing=5 cellpadding=0 class=\"smalltextnolink\"><tr><td style=\"padding-right:20px\" valign=\"top\"><messageicon/></td><td width=\'100%\'><messagecontent/></td></tr><tr><td/></tr><tr><td  align=\"right\" colspan=2><table cellspacing=\'0\' cellpadding=\'0\'><tr><td> <table id=\'tbl_ok\' cellpadding=\'0\' cellspacing=\'0\' border=\'0\' class=\'uir-button\' style=\'margin-right:6px;cursor:hand;\' role=\'presentation\'> <tr id=\'tr_ok\' class=\'pgBntG pgBntB\'> <td id=\'tdleftcap_ok\'><img src=\'/images/nav/ns_x.gif\' class=\'bntLT\' border=\'0\' height=\'50%\' width=\'3\' alt=\'\'/> <img src=\'/images/nav/ns_x.gif\' class=\'bntLB\' border=\'0\' height=\'50%\' width=\'3\' alt=\'\'/> </td> <td id=\'tdbody_ok\' height=\'20\' valign=\'top\' nowrap class=\'bntBgB\'> <input type=\'button\' style=\'width:50px\' class=\'rndbuttoninpt bntBgT\' value=\'OK\' id=\'ok\' name=\'ok\' onclick=\"closePopup();<okaction/>; return false;\" onmousedown=\"this.setAttribute(\'_mousedown\',\'T\'); setButtonDown(true, true, this);\" onmouseup=\"this.setAttribute(\'_mousedown\',\'F\'); setButtonDown(false, true, this);\" onmouseout=\"if(this.getAttribute(\'_mousedown\')==\'T\') setButtonDown(false, true, this);\" onmouseover=\"if(this.getAttribute(\'_mousedown\')==\'T\') setButtonDown(true, true, this);\" ></td> <td id=\'tdrightcap_ok\'> <img src=\'/images/nav/ns_x.gif\' height=\'50%\' class=\'bntRT\' border=\'0\' width=\'3\' alt=\'\'> <img src=\'/images/nav/ns_x.gif\' height=\'50%\' class=\'bntRB\' border=\'0\' width=\'3\' alt=\'\'> </td> </tr> </table> </td><td style=\'width:20px;\'>&nbsp;</td><td> <table id=\'tbl_cancel\' cellpadding=\'0\' cellspacing=\'0\' border=\'0\' class=\'uir-button\' style=\'margin-right:6px;cursor:hand;\' role=\'presentation\'> <tr id=\'tr_cancel\' class=\'pgBntG\'> <td id=\'tdleftcap_cancel\'><img src=\'/images/nav/ns_x.gif\' class=\'bntLT\' border=\'0\' height=\'50%\' width=\'3\' alt=\'\'/> <img src=\'/images/nav/ns_x.gif\' class=\'bntLB\' border=\'0\' height=\'50%\' width=\'3\' alt=\'\'/> </td> <td id=\'tdbody_cancel\' height=\'20\' valign=\'top\' nowrap class=\'bntBgB\'> <input type=\'button\' style=\'width:50px\' class=\'rndbuttoninpt bntBgT\' value=\'Cancel\' id=\'cancel\' name=\'cancel\' onclick=\"<cancelaction/>;closePopup(); return false;\" onmousedown=\"this.setAttribute(\'_mousedown\',\'T\'); setButtonDown(true, true, this);\" onmouseup=\"this.setAttribute(\'_mousedown\',\'F\'); setButtonDown(false, true, this);\" onmouseout=\"if(this.getAttribute(\'_mousedown\')==\'T\') setButtonDown(false, true, this);\" onmouseover=\"if(this.getAttribute(\'_mousedown\')==\'T\') setButtonDown(true, true, this);\" ></td> <td id=\'tdrightcap_cancel\'> <img src=\'/images/nav/ns_x.gif\' height=\'50%\' class=\'bntRT\' border=\'0\' width=\'3\' alt=\'\'> <img src=\'/images/nav/ns_x.gif\' height=\'50%\' class=\'bntRB\' border=\'0\' width=\'3\' alt=\'\'> </td> </tr> </table> </td></tr></table></td></tr></table></td></tr>     <tr><td></td></tr> </table>";
var PROGRESS_POPUP_SHELL = "<table class=\"uir-popup\" width=\'100%\' cellspacing=\'0\' cellpadding=\'0\' role=\'presentation\'>     <tr class=\"uir-popup-header\">         <td>             <table width=\'100%\' height=\'100%\' cellspacing=\'0\' cellpadding=\'0\' role=\'presentation\'>                 <tr>                     <td valign=\'middle\' nowrap=\'\' style=\'padding-left: 2px;\'>                     </td>                      <td nowrap=\'\' class=\'smalltextb\' style=\'padding-left: 5px; padding-right: 1px;\'>                         <messagetitle/>                     </td>                 </tr>             </table>         </td>     </tr>      <tr class=\"uir-popup-body\"><td><table cellspacing=5 cellpadding=0 class=\"smalltextnolink\"><tr><td width=\'100%\'><messagecontent/></td></tr><tr><td><messageicon/></td></tr><tr><td align=\"right\"> <table cellspacing=\'0\' cellpadding=\'0\'><tr><td> <table id=\'tbl_ok\' cellpadding=\'0\' cellspacing=\'0\' border=\'0\' class=\'uir-button\' style=\'margin-right:6px;cursor:hand;\' role=\'presentation\'> <tr id=\'tr_ok\' class=\'pgBntG\'> <td id=\'tdleftcap_ok\'><img src=\'/images/nav/ns_x.gif\' class=\'bntLT\' border=\'0\' height=\'50%\' width=\'3\' alt=\'\'/> <img src=\'/images/nav/ns_x.gif\' class=\'bntLB\' border=\'0\' height=\'50%\' width=\'3\' alt=\'\'/> </td> <td id=\'tdbody_ok\' height=\'20\' valign=\'top\' nowrap class=\'bntBgB\'> <input type=\'button\' style=\'width:50px\' class=\'rndbuttoninpt bntBgT\' value=\'Cancel\' id=\'ok\' name=\'ok\' onclick=\"<cancelaction/>; return false;\" onmousedown=\"this.setAttribute(\'_mousedown\',\'T\'); setButtonDown(true, true, this);\" onmouseup=\"this.setAttribute(\'_mousedown\',\'F\'); setButtonDown(false, true, this);\" onmouseout=\"if(this.getAttribute(\'_mousedown\')==\'T\') setButtonDown(false, true, this);\" onmouseover=\"if(this.getAttribute(\'_mousedown\')==\'T\') setButtonDown(true, true, this);\" ></td> <td id=\'tdrightcap_ok\'> <img src=\'/images/nav/ns_x.gif\' height=\'50%\' class=\'bntRT\' border=\'0\' width=\'3\' alt=\'\'> <img src=\'/images/nav/ns_x.gif\' height=\'50%\' class=\'bntRB\' border=\'0\' width=\'3\' alt=\'\'> </td> </tr> </table> </td></tr></table></td></tr></table></td></tr>     <tr><td></td></tr> </table>";
var TOOLTIP_POPUP_SHELL = "<table cellSpacing=\'0\' cellPadding=\'0\' width=\'125\' border=\'0\' role=\'presentation\'>     <tr>         <td colSpan=\'2\' style=\'font-size:0\'><img height=\'5\' alt=\'\' src=\'/images/icons/popup/balloon/wb_ul.png\' width=\'5\' border=\'0\' /></td>         <td style=\'font-size:0\' width=\'100%\' background=\'/images/icons/popup/balloon/wb_t.png\'><img height=\'5\' alt=\'\' src=\'/images/nav/ns_x.gif\' width=\'1\' /></td>         <td style=\'font-size:0\' colSpan=\'2\'><img height=\'5\' alt=\'\' src=\'/images/icons/popup/balloon/wb_ur.png\' width=\'5\' border=\'0\' /></td>     </tr>     <tr>         <td width=\'3\' background=\'/images/icons/popup/balloon/wb_l.png\'><img height=\'1\' alt=\'\' src=\'/images/nav/ns_x.gif\' width=\'3\' /></td>         <td style=\'background-image: url(/images/icons/popup/balloon/wb_bg.png)\' width=\'2\'><img height=\'1\' alt=\'\' src=\'/images/nav/ns_x.gif\' width=\'2\' /></td>         <td style=\'background-image: url(/images/icons/popup/balloon/wb_bg.png)\' width=\'100%\'>     <table cellSpacing=\'0\' cellPadding=\'3\' border=\'0\' role=\'presentation\'>         <tr>             <td valign=\'top\'>                     <messageicon/>             </td>             <td>                 <div><messagetitle/></div>                 <div>                     <div style=\'background-position: center center; background-image: url(/images/icons/popup/balloon/wb_divider.png); background-REPEAT: repeat-x\'><img height=\'2\' alt=\'\' src=\'/images/nav/ns_x.gif\' width=\'1\' vspace=\'3\' /></div>                     <messagecontent/>                 </div>             </td>         </tr>     </table>  </td> <td style=\'background-image: url(/images/icons/popup/balloon/wb_bg.png)\' width=\'2\'><img height=\'1\' alt=\'\' src=\'/images/nav/ns_x.gif\' width=\'2\' /></td> <td width=\'3\' background=\'/images/icons/popup/balloon/wb_r.png\'><img height=\'1\' alt=\'\' src=\'/images/nav/ns_x.gif\' width=\'3\' /></td> </tr> <tr>     <td style=\'font-size:0\' colSpan=\'2\'><img height=\'5\' alt=\'\' src=\'/images/icons/popup/balloon/wb_ll.png\' width=\'5\' border=\'0\' /></td>     <td style=\'font-size:0\' width=\'100%\' background=\'/images/icons/popup/balloon/wb_b.png\'><img height=\'5\' alt=\'\' src=\'/images/nav/ns_x.gif\' width=\'1\' /></td>     <td style=\'font-size:0\' colSpan=\'2\'><img height=\'5\' alt=\'\' src=\'/images/icons/popup/balloon/wb_lr.png\' width=\'5\' border=\'0\' /></td> </tr> </table>";
var MESSAGE_TOOLTIP_POPUP_SHELL = "<table cellSpacing=\'0\' cellPadding=\'0\' width=\'125\' border=\'0\' role=\'presentation\'>     <tr>         <td colSpan=\'2\' style=\'font-size:0\'><img height=\'5\' alt=\'\' src=\'/images/icons/popup/balloon/wb_ul.png\' width=\'5\' border=\'0\' /></td>         <td style=\'font-size:0\' width=\'100%\' background=\'/images/icons/popup/balloon/wb_t.png\'><img height=\'5\' alt=\'\' src=\'/images/nav/ns_x.gif\' width=\'1\' /></td>         <td style=\'font-size:0\' colSpan=\'2\'><img height=\'5\' alt=\'\' src=\'/images/icons/popup/balloon/wb_ur.png\' width=\'5\' border=\'0\' /></td>     </tr>     <tr>         <td width=\'3\' background=\'/images/icons/popup/balloon/wb_l.png\'><img height=\'1\' alt=\'\' src=\'/images/nav/ns_x.gif\' width=\'3\' /></td>         <td style=\'background-image: url(/images/icons/popup/balloon/wb_bg.png)\' width=\'2\'><img height=\'1\' alt=\'\' src=\'/images/nav/ns_x.gif\' width=\'2\' /></td>         <td style=\'background-image: url(/images/icons/popup/balloon/wb_bg.png)\' width=\'100%\'>     <table cellSpacing=\'0\' cellPadding=\'3\' border=\'0\' role=\'presentation\'>         <tr><td><messagecontent/></td></tr>     </table>  </td> <td style=\'background-image: url(/images/icons/popup/balloon/wb_bg.png)\' width=\'2\'><img height=\'1\' alt=\'\' src=\'/images/nav/ns_x.gif\' width=\'2\' /></td> <td width=\'3\' background=\'/images/icons/popup/balloon/wb_r.png\'><img height=\'1\' alt=\'\' src=\'/images/nav/ns_x.gif\' width=\'3\' /></td> </tr> <tr>     <td style=\'font-size:0\' colSpan=\'2\'><img height=\'5\' alt=\'\' src=\'/images/icons/popup/balloon/wb_ll.png\' width=\'5\' border=\'0\' /></td>     <td style=\'font-size:0\' width=\'100%\' background=\'/images/icons/popup/balloon/wb_b.png\'><img height=\'5\' alt=\'\' src=\'/images/nav/ns_x.gif\' width=\'1\' /></td>     <td style=\'font-size:0\' colSpan=\'2\'><img height=\'5\' alt=\'\' src=\'/images/icons/popup/balloon/wb_lr.png\' width=\'5\' border=\'0\' /></td> </tr> </table>";
var PET_POPUP_SHELL = "<table class=\"uir-popup\" width=\'100%\' cellspacing=\'0\' cellpadding=\'0\' role=\'presentation\'>     <tr class=\"uir-popup-header\">         <td>             <table width=\'100%\' height=\'100%\' cellspacing=\'0\' cellpadding=\'0\' role=\'presentation\'>                 <tr>                     <td valign=\'middle\' nowrap=\'\' style=\'padding-left: 2px;\'>                     </td>                      <td nowrap=\'\' class=\'smalltextb\' style=\'padding-left: 5px; padding-right: 1px;\'>                         Performance Details                     </td>                 </tr>             </table>         </td>     </tr>      <tr class=\"uir-popup-body\"><td><table cellspacing=5 cellpadding=0 class=\"smalltextnolink\">   <tr>     <td/>   </tr>   <tr>     <td><petdata/></td>   </tr>   <tr>     <td> <table cellspacing=5 cellpadding=0>   <tr>  <td> <table id=\'tbl_ok\' cellpadding=\'0\' cellspacing=\'0\' border=\'0\' class=\'uir-button\' style=\'margin-right:6px;cursor:hand;\' role=\'presentation\'> <tr id=\'tr_ok\' class=\'pgBntG pgBntB\'> <td id=\'tdleftcap_ok\'><img src=\'/images/nav/ns_x.gif\' class=\'bntLT\' border=\'0\' height=\'50%\' width=\'3\' alt=\'\'/> <img src=\'/images/nav/ns_x.gif\' class=\'bntLB\' border=\'0\' height=\'50%\' width=\'3\' alt=\'\'/> </td> <td id=\'tdbody_ok\' height=\'20\' valign=\'top\' nowrap class=\'bntBgB\'> <input type=\'button\' style=\'\' class=\'rndbuttoninpt bntBgT\' value=\'OK\' id=\'ok\' name=\'ok\' onclick=\"<okaction/>;closePopup(); return false;\" onmousedown=\"this.setAttribute(\'_mousedown\',\'T\'); setButtonDown(true, true, this);\" onmouseup=\"this.setAttribute(\'_mousedown\',\'F\'); setButtonDown(false, true, this);\" onmouseout=\"if(this.getAttribute(\'_mousedown\')==\'T\') setButtonDown(false, true, this);\" onmouseover=\"if(this.getAttribute(\'_mousedown\')==\'T\') setButtonDown(true, true, this);\" ></td> <td id=\'tdrightcap_ok\'> <img src=\'/images/nav/ns_x.gif\' height=\'50%\' class=\'bntRT\' border=\'0\' width=\'3\' alt=\'\'> <img src=\'/images/nav/ns_x.gif\' height=\'50%\' class=\'bntRB\' border=\'0\' width=\'3\' alt=\'\'> </td> </tr> </table> </td>    <td>&nbsp;</td>    <td>&nbsp;</td>  </tr>  </table>     </td>   </tr> </table> </td></tr>     <tr><td></td></tr> </table>";
var SAVE_POPUP_SHELL = "<table class=\"uir-popup\" width=\'100%\' cellspacing=\'0\' cellpadding=\'0\' role=\'presentation\'>     <tr class=\"uir-popup-header\">         <td>             <table width=\'100%\' height=\'100%\' cellspacing=\'0\' cellpadding=\'0\' role=\'presentation\'>                 <tr>                     <td valign=\'middle\' nowrap=\'\' style=\'padding-left: 2px;\'>                     </td>                      <td nowrap=\'\' class=\'smalltextb\' style=\'padding-left: 5px; padding-right: 1px;\'>                         <messagetitle/>                     </td>                 </tr>             </table>         </td>     </tr>      <tr class=\"uir-popup-body\"><td><table cellspacing=5 cellpadding=0 class=\"smalltextnolink\"><tr><td style=\"padding-right:20px\" valign=\"top\"><messageicon/></td><td width=\'100%\'><messagecontent/></td></tr><tr><td/></tr><tr><td  align=\"right\" colspan=2><span id=\'dontshow_fs\' class=\'checkbox_unck\' onclick=\'NLCheckboxOnClick(this);\'><input type=\'checkbox\' class=\'checkbox\' id=\'dontshow\' name=\'dontshow\'/><img class=\'checkboximage\' src=\'/images/nav/ns_x.gif\' alt=\'\'/></span><label for=\'dontshow\'>Don\'t show this next time </label><br /><table cellspacing=0 cellpadding=0><tr><td> <table id=\'tbl_ok\' cellpadding=\'0\' cellspacing=\'0\' border=\'0\' class=\'uir-button\' style=\'margin-right:6px;cursor:hand;\' role=\'presentation\'> <tr id=\'tr_ok\' class=\'pgBntG pgBntB\'> <td id=\'tdleftcap_ok\'><img src=\'/images/nav/ns_x.gif\' class=\'bntLT\' border=\'0\' height=\'50%\' width=\'3\' alt=\'\'/> <img src=\'/images/nav/ns_x.gif\' class=\'bntLB\' border=\'0\' height=\'50%\' width=\'3\' alt=\'\'/> </td> <td id=\'tdbody_ok\' height=\'20\' valign=\'top\' nowrap class=\'bntBgB\'> <input type=\'button\' style=\'width:50px\' class=\'rndbuttoninpt bntBgT\' value=\'OK\' id=\'ok\' name=\'ok\' onclick=\"if(dontshow.checked) {parent.sendRequestToFrame(\'/app/common/saveconfirmation.nl?unsetpref=T\', \'server_commands\');}if (NS.form.isChanged() && (!document.forms[\'main_form\'].onsubmit || document.forms[\'main_form\'].onsubmit())) {var theForm = document.forms[\'main_form\'];var newOption = document.createElement(\'input\');newOption.id = \'setclientredirecturl\';newOption.name = \'setclientredirecturl\';newOption.type = \'hidden\';newOption.value = \'<okaction/>\'; theForm.appendChild(newOption);document.forms[\'main_form\'].submit();} closePopup(); return false;\" onmousedown=\"this.setAttribute(\'_mousedown\',\'T\'); setButtonDown(true, true, this);\" onmouseup=\"this.setAttribute(\'_mousedown\',\'F\'); setButtonDown(false, true, this);\" onmouseout=\"if(this.getAttribute(\'_mousedown\')==\'T\') setButtonDown(false, true, this);\" onmouseover=\"if(this.getAttribute(\'_mousedown\')==\'T\') setButtonDown(true, true, this);\" ></td> <td id=\'tdrightcap_ok\'> <img src=\'/images/nav/ns_x.gif\' height=\'50%\' class=\'bntRT\' border=\'0\' width=\'3\' alt=\'\'> <img src=\'/images/nav/ns_x.gif\' height=\'50%\' class=\'bntRB\' border=\'0\' width=\'3\' alt=\'\'> </td> </tr> </table> </td><td style=\'width:19px;\'>&nbsp;</td><td> <table id=\'tbl_cancel\' cellpadding=\'0\' cellspacing=\'0\' border=\'0\' class=\'uir-button\' style=\'margin-right:6px;cursor:hand;\' role=\'presentation\'> <tr id=\'tr_cancel\' class=\'pgBntG\'> <td id=\'tdleftcap_cancel\'><img src=\'/images/nav/ns_x.gif\' class=\'bntLT\' border=\'0\' height=\'50%\' width=\'3\' alt=\'\'/> <img src=\'/images/nav/ns_x.gif\' class=\'bntLB\' border=\'0\' height=\'50%\' width=\'3\' alt=\'\'/> </td> <td id=\'tdbody_cancel\' height=\'20\' valign=\'top\' nowrap class=\'bntBgB\'> <input type=\'button\' style=\'width:50px\' class=\'rndbuttoninpt bntBgT\' value=\'Cancel\' id=\'cancel\' name=\'cancel\' onclick=\"closePopup(); return false;\" onmousedown=\"this.setAttribute(\'_mousedown\',\'T\'); setButtonDown(true, true, this);\" onmouseup=\"this.setAttribute(\'_mousedown\',\'F\'); setButtonDown(false, true, this);\" onmouseout=\"if(this.getAttribute(\'_mousedown\')==\'T\') setButtonDown(false, true, this);\" onmouseover=\"if(this.getAttribute(\'_mousedown\')==\'T\') setButtonDown(true, true, this);\" ></td> <td id=\'tdrightcap_cancel\'> <img src=\'/images/nav/ns_x.gif\' height=\'50%\' class=\'bntRT\' border=\'0\' width=\'3\' alt=\'\'> <img src=\'/images/nav/ns_x.gif\' height=\'50%\' class=\'bntRB\' border=\'0\' width=\'3\' alt=\'\'> </td> </tr> </table> </td></tr></table></td></tr></table></td></tr>     <tr><td></td></tr> </table>";

nlTooltipContent.prototype.getContent = function()
{
    var content = TOOLTIP_POPUP_SHELL;
    if (typeof this.title != "undefined" && this.title != null)
        content = content.replace("<messagetitle/>", this.title);
    if (typeof this.detail != "undefined" && this.detail != null)
        content = content.replace("<messagecontent/>", this.detail);
    if (typeof this.icon != "undefined" && this.icon != null)
        content = content.replace("<messageicon/>", this.icon);

    return content;
};

nlMessageTooltipContent.prototype.getContent = function()
{
    var content = MESSAGE_TOOLTIP_POPUP_SHELL;
    if (typeof this.message != "undefined" && this.message != null)
        content = content.replace("<messagecontent/>", this.message);

    return content;
};