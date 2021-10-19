








var template;
function getBasicTemplate()
{
    Ext.onReady(function ()
    {
        if (template === undefined)
        {
            template = new Ext.XTemplate(
            '<div id="inner{targetId}HoverTable" class="uir-quickview-container" >',
            '<table border=0 id="title{targetId}Table" class="uir-quickview-content-table" >',
            '<tr class="subtabblock"><td colspan="{numColumns}"><h1 class="pt_title uir-quickview-h1">{titleImgSrc}{title}</h1></td></tr>',
            '<tr align="{colAlign}">',
            '<td id="img{targetId}Field0" class="uir-quickview-column" style="display:{displayImageOnTitle}">{fieldImgSrc0}</td>',
            '<td class="uir-quickview-column">',

            '<table id="field{targetId}Table" >',
            '<tpl for="fields">',
                '<tr>',
                    '<td class="smallgraytext uir-quickview-field-label" nowrap="nowrap">{fieldName}</td>',
                    '<td class="inputreadonly uir-quickview-field-value">{fieldValue}</td>',
                '</tr> ',
            '</tpl>',
            '</table>',
            '</td></tr>',
            '<tpl for="outsideFields">',
                '<tr><td colspan="{parent.numColumns}" class="uir-quickview-outside-field-container">',
                    '<div class="smallgraytext uir-quickview-outside-field-sep>',
                    '<div class="uir-quickview-outside-field-label">{fieldName}</div> </div></td></tr>',
                '<tr><td class="inputreadonly uir-quickview-outside-field-value" colspan="{parent.numColumns}">{fieldValue}</td></tr>',
            '</tpl>',
                '<tr><td class="uir-quickview-buttons-container">',
                '<table><tr>',
                '<td style="display:{viewDisplay};">',
                '{[this.getTemplate({targetId: "viewBtn_" + values.targetId, label: "View", onClickHandler:"location.href=\'" + values.viewURL + "\'"})]}',
                '</td>',
                '<td style="display:{editDisplay};">',
                '{[this.getTemplate({targetId: "editBtn_" + values.targetId, label: "Edit", onClickHandler:"location.href=\'" + values.editURL + "\'"})]}',
                '</td>',
            '</tr></table>',
            '</td></tr>',
            '</table>',
            '</div>',
            {
                compiled: true,
                getTemplate: function (data)
                {
                    return parent.getButtonTemplate().apply(data);
                }
            }
            );
        }
    });
    return template;
}

var eventTemplate;

function getMultiColumnTemplate()
{
    Ext.onReady(function ()
    {
        if (eventTemplate === undefined)
        {
            eventTemplate = new Ext.XTemplate(
            '<div id="inner{targetId}HoverTable" class="uir-quickview-container">',
            '<table id="title{targetId}Table" class="uir-quickview-content-table">',
            '<tr class="subtabblock"><td colspan="{numColumns}"><h1 class="pt_title uir-quickview-h1">{titleImgSrc}{title}</h1></td></tr>',
            '<tr>',
            '<tpl for="columns">',
                '<td class="uir-quickview-column">',
                    '<table id="field{parent.targetId}Table{#}" >',
                        '<tpl for="fields">',
                            '<tr>',
                            '<td class="smallgraytext uir-quickview-field-label"  nowrap="nowrap">{fieldName}</td>',
                            '<td class="inputreadonly uir-quickview-field-value">{fieldValue}</td>',
                            '</tr> ',
                        '</tpl>',
                    '</table>',
                '</td>',
            '</tpl>',
            '</tr>',
            '<tpl for="outsideFields">',
            '<tr><td colspan="{parent.numColumns}" class="uir-quickview-outside-field-container">',
            '<div class="smallgraytext uir-quickview-outside-field-sep">',
            '<div class="uir-quickview-outside-field-label">{fieldName}</div> </div></td></tr>',
            '<tr><td class="inputreadonly uir-quickview-outside-field-value" colspan="{parent.numColumns}">{fieldValue}</td></tr>',
            '</tpl>',
            '<tr>',
            '<td colspan="{numColumns}" class="uir-quickview-buttons-container">',
            '<table><tr>',
            '<td style="display:{eventBtnsDisplay};">',
            '{[this.getTemplate({targetId: "quickacceptBtn_" + values.targetId, label: "Quick Accept", onClickHandler:"NLExtTooltipSendEventResponse("+ values.acceptURL +",\'"+ values.targetId +"\',\'"+ values.addtlParam +"\');"})]}',
            '</td>',

            '<td style="display:{eventBtnsDisplay};">',
            '{[this.getTemplate({targetId: "quickdeclineBtn_" + values.targetId, label: "Quick Decline", onClickHandler:"NLExtTooltipSendEventResponse("+ values.declineURL +",\'"+ values.targetId +"\',\'"+ values.addtlParam +"\');"})]}',
            '</td>',

            '<td style="display:{eventBtnsDisplay};">',
            '{[this.getTemplate({targetId: "acceptBtn_" + values.targetId, label: "Accept", onClickHandler:"nlOpenWindow(\'/app/crm/calendar/eventresponse.nl?l=T&response=accepted&eventId=" + values.recordId + "&istimed=T\',\'responsepopup\',700,500,null,true);"})]}',
            '</td>',

            '<td style="display:{eventBtnsDisplay};">',
            '{[this.getTemplate({targetId: "declineBtn_" + values.targetId, label: "Decline", onClickHandler:"nlOpenWindow(\'/app/crm/calendar/eventresponse.nl?l=T&response=declined&eventId=" + values.recordId + "&istimed=T\',\'responsepopup\',700,500,null,true);"})]}',
            ' </td>',

            '<td style="display:{viewDisplay};">',
            '{[this.getTemplate({targetId: "viewBtn_" + values.targetId, label: "View", onClickHandler:"location.href=\'" + values.viewURL + "\'"})]}',
            '</td>',
            '<td style="display:{editDisplay};">',
            '{[this.getTemplate({targetId: "editBtn_" + values.targetId, label: "Edit", onClickHandler:"location.href=\'" + values.editURL + "\'"})]}',
            '</td>',

            '</tr></table>',
            '</td></tr>',
            '</table>',
            '</div>',
            {
                compiled: true,
                getTemplate: function (data)
                {
                    return parent.getButtonTemplate().apply(data);
                }
            }
            );
        }
    });
    return eventTemplate;
}

function NLExtTooltipSendEventResponse(responseURL, targetId, portletId)
{
    var tooltip = document.getElementById("singleTipextTooltip");
    tooltip.style.cursor = 'wait';
    <!-- get relative path -->
    var idx = responseURL.indexOf("netsuite.com") + "netsuite.com".length;
    responseURL = responseURL.substring(idx);
    var req = new XMLHttpRequest();
    req.open("GET", responseURL, false);
    try
    {
        req.send(null);
    }
    catch (e)
    {
    }

    var resp = req.status;
    Ext.ComponentMgr.get("singleTipextTooltip").hide();

    if (resp == 200)
    {
        tooltip.style.cursor = 'default';
        if (targetId.indexOf("CALENDAREVENT") == 0 || targetId.indexOf("EVENT") == 0)
        {
            if (window.top.NS.Dashboard) {
                window.top.NS.Dashboard.getInstance().getPortlet(portletId).triggerAction('refresh');
            }
        }
        else
        {
            location.reload(true);
        }
    }
}

function cleanupTooltips(preface)
{
    Ext.onReady(function ()
    {
        idx = 0;
        if (singleTip != undefined)
        {
            //remove from jsonstore cache
            if (jsonStore != undefined)
            {
                if ((preface == undefined) || (preface == null))
                {
                    jsonStore.removeAll();
                }
                else
                {
                    var list = jsonStore.query("tooltipPrefix", preface, false);
                    if ((list != undefined) && (list != null))
                    {
                        for (var i = 0; i < list.length; ++i)
                        {
                            var rec = list.get(i);
                            jsonStore.remove(rec);
                        }
                    }
                }
            }
        }
    });
}

var jsonStore;
var currentRequest = new Array();
var idx = 0;
var hasChanged = false;

function getExtTooltip(target, entityType, templateType, id, addtlParams)
{
    var tip = getSingleToolTip();
    if (target != tip.targetId)
    {
        if (currentRequest.length > 0)
        {
            for (var i = 0; i < currentRequest.length; ++i)
            {
                if (currentRequest[i] != 'undefined')
                {
                    currentRequest[i].abort();
                }
            }
            currentRequest.splice(0, currentRequest.length);
            idx = 0;
        }
        tip.entityType = entityType;
        tip.recordId = id;
        tip.templateType = templateType;
        tip.addtlParams = addtlParams;
        tip.checking = false;

        tip.targetId = target;
        tip.initTarget(target);
    }
    else
    {
        if (tip.target.getRegion()[0] == 0 && tip.target.getRegion()[1] == 0)
        {
            tip.initTarget(target);
        }
    }
    return tip;
}

var singleTip;
function getSingleToolTip()
{

    if (singleTip === undefined)
    {
        Ext.QuickTips.init();
        singleTip = new Ext.ToolTip({
        id: "singleTip" + TOOLTIP_ID_SUFFIX,
        hideDelay: 300,
        showDelay: 2000,
        autoHide: false,
        dismissDelay: 10,
        minWidth: 200,
        maxWidth: 500,
        shadow: 'frame',
        floating: true,
        constrainPosition:true,
        renderTo: Ext.getBody(),

        checkWithin: function (e)
        {
            if (e.within == undefined)
                e = Ext.EventObject.setEvent(e);
            if (this.el && e.within(this.el.dom, true))
            {
                return true;
            }
            if (this.disabled || e.within(this.target.dom, true))
            {
                return true;
            }
            return false;
        },
        onElOver: function (e)
        {
            if (this.checkWithin(e))
            {
                this.clearTimer('hide');
            }
        },
        onTargetOver: function (e)
        {
            if (e.within == undefined)
                e = Ext.EventObject.setEvent(e);

            if (this.disabled || e.within(this.target.dom, true))
            {
                return;
            }
            this.clearTimer('hide');
            this.targetXY = e.getXY();
            this.delayShow(e);
        },
        delayShow: function (e)
        {
            this.showTimer = this.doShow.defer(this.showDelay, this, [e]);
        },
        doShow: function (e)
        {
            var xy = e.getXY();
            var within = this.target.getRegion().contains({left: xy[0], right: xy[0], top: xy[1], bottom: xy[1]});
            if (within)
            {
                this.show();
            }
        },
        onTargetOut: function (e)
        {
            if (this.checkWithin(e))
            {
                this.clearTimer('hide');
            }
            else if (this.hideTimer)
            {
                this.hide();
            }
            else
            {
                this.delayHide();
            }
        },
        onElOut: function (e)
        {
            if (this.checkWithin(e))
            {
                this.clearTimer('hide');
            }
            else
            {
                this.hide();
            }
        },
        listeners: {

            beforeShow: updateTipContent
        }
    });
    }
    return singleTip;
}

function updateTipContent(tip)
{
    tip.el.on('mouseout', tip.onElOut, tip);
    tip.el.on('mouseover', tip.onElOver, tip);

    if (jsonStore === undefined)
    {
        jsonStore = new Ext.data.JsonStore();
    }
    if (jsonStore.getById(getJsonStoreKeyFor(tip)) === undefined)
    {
        if (!tip.checking)
        {
            tip.checking = true;
            var check = checkForHover(tip.targetId, tip);

            if (check == false)
            {
                tip.hide();
                return false;
            }
            else
            {
                getHoverData(tip.targetId, tip);
                tip.body.dom.innerHTML = "<div class='uir-quickview-loading-container'><img style='padding-right:3px;' src='/images/help/animated_loading.gif' alt=''/>Loading...</div>";

                return true;
            }
        }
    }
    else
    {
        var retVal = processHoverData(tip.targetId, tip, false);
        if (!retVal)
        {
            tip.hide();
        }
        return retVal;
    }
}

function checkForHover(targetId, tip)
{
    var temp = getJsonStoreKeyFor(tip);

    var url = '/app/elements/tooltip/NLTooltipRequestHandler.nl?rectype=' + tip.entityType + '&' + tip.addtlParams +
              '&targetId=' + targetId + '&id=' + tip.recordId + '&recordType=' + tip.entityType + '&templateType=' + tip.templateType + '&quicksummary=T&check=T';
    var req = currentRequest[idx++] = new XMLHttpRequest();
    req.open("GET", url, false);
    try
    {
        req.send(null);
    }
    catch (e)
    {
    }
    var resp = req.status;
    if (resp == 200)
    {
        if (temp != (getJsonStoreKeyFor(tip)))
            return false;

        var jsonData = Ext.util.JSON.decode(req.responseText);

        if (jsonData.HIDE_HOVER)
        {
            var record = new Ext.data.Record(jsonData, getJsonStoreKeyFor(tip));
            var records = new Array();
            records[0] = record;
            jsonStore.add(records);
            return false;
        }
        return true;
    }
    return false;
}


<!-- async call  -->
function getHoverData(targetId, tip)
{
    var temp = getJsonStoreKeyFor(tip);

    var url = '/app/elements/tooltip/NLTooltipRequestHandler.nl?rectype=' + tip.entityType + '&' + tip.addtlParams +
              '&targetId=' + targetId + '&id=' + tip.recordId + '&recordType=' + tip.entityType + '&templateType=' + tip.templateType + '&quicksummary=T&check=F';
    var req = currentRequest[idx++] = new XMLHttpRequest();
    req.onreadystatechange = function ()
    {
        if (req.readyState == 4 && req.status == 200)
        {
            if (temp != (getJsonStoreKeyFor(tip)))
                return false;
            try
            {
                var jsonData = Ext.util.JSON.decode(req.responseText);

                var record = new Ext.data.Record(jsonData, getJsonStoreKeyFor(tip));
                var records = new Array();
                records[0] = record;
                jsonStore.add(records);

                processHoverData(targetId, tip, true);
            }
            catch (exc)
            {
                tip.body.dom.innerHTML = "<div class='uir-quickview-error-container '>QuickView is not available for this record</div>";
            }
        }
    };

    req.open("GET", url, true);
    try
    {
        req.send(null);
    }
    catch (e)
    {
        tip.body.dom.innerHTML = "<div class='uir-quickview-error-container'>QuickView is not available for this record</div>";
    }
    return true;
}

function processHoverData(targetId, tip, firstCall)
{
    var rec = jsonStore.getById(getJsonStoreKeyFor(tip));
    var jsonData = rec.data;
    jsonData.targetId = targetId;

    if (jsonData.HIDE_HOVER)
    {
        return false;
    }

    if (jsonData.success == false)
    {

        if (typeof jsonData.ERROR_MESSAGE != "undefined")
        {
            tip.body.dom.innerHTML = "<div class='uir-quickview-error-container'>" + jsonData.ERROR_MESSAGE + "</div>";
        }
        else
        {
            tip.body.dom.innerHTML = "<div class='uir-quickview-error-container'>QuickView is not available for this record</div>";
        }
        return true;
    }

    var contactTypeArray = ['CONTACT_TEMPLATE','ITEM_TEMPLATE'];
    var twoColTypeArray = ['TWO_COLUMN_TEMPLATE','CALENDAREVENT_TEMPLATE'];
    if (jQuery.inArray(tip.templateType, twoColTypeArray) != -1)
    {
        updateMultiColTooltipContents(tip.body, jsonData);
    }
    else
    {
        updateBasicTooltipContents(tip.body, jsonData);
    }

    tip.doAutoWidth();

    return true;
}