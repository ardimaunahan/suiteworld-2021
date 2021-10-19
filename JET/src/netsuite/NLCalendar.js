











        

         if ( window.dateformat == null )
             window.dateformat = "MM/DD/YYYY";

         if (!NS.CalendarPreference){

             NS.CalendarPreference = (function ()
             {
                 var FIRST_DAY_OF_WEEK_OFFSET=0;

                 return {
                     setFirstDayOfWeekOffset: function (value) {
                         FIRST_DAY_OF_WEEK_OFFSET = value;
                     },
                     getFirstDayOfWeekOffset: function () {
                         return FIRST_DAY_OF_WEEK_OFFSET;
                     }
                 }
             }());
         }

         // initialize target synching parameters if we're using Calendar as a date picker for NLFields
         

function getTargetFieldJScript_inline(form, targetstring, bInExtremeList, ref)
{
    var targets = targetstring.split(":");
    var fld = null;
    if (bInExtremeList)
        fld = getExtremeCalendarField();
    else if (targets.length == 1)
    {
        if ((form == null)||(form == ''))
            form = '0';
        fld = document.forms[form].elements[targets[0]];
        if( !fld )
            fld = document.getElementById(targets[0]);
    }
    else
    {
        var formobj = document.forms[targets[0]+"_form"];
        if (formobj && (typeof formobj.elements == 'undefined' || document.getElementsByName(targets[0]+"_form").length > 1))
        	formobj = getParentElementByTag('form', ref)
        if (formobj == null)
            formobj = document.forms[targets[0]];
        if (formobj != null)
            fld = formobj.elements[targets[1]];
        if( fld == null )
            fld = document.getElementById(targets[1]);
    }
    return fld;
}

function pickdate_inline(s)
{
    var caldiv = NLCalender_getCalendarDIV(true);
    var fld = caldiv.datefield;
    var d = parseMMDDYYYY(s);

    if (fld.getAttribute("datefldtype") == 'mmyydate')
    {
        fld.value = getmmyydatestring(d, NLDate_short_months)
    }
    else
    {
        fld.value = getdatestring(d);
    }

    // Extreme List fields do not have their event handlers defined since it is handled internally
    if (fld.onchange != null)
        fld.onchange();

	if (isFocusable(fld))
        fld.focus();

    hideCalendarDIV();
}

function pickdate(dateString)
{
	pickview(dateString, 'day');
}

function pickdateinweek(dateString)
{
	pickview(dateString, 'week');
}

function pickmonth(dateString)
{
	pickview(dateString, 'month');
}

function pickview(dateString, view)
{
	var div = NLCalender_getCalendarDIV();
    if (div!=null)
	    div.selecteddate = parseMMDDYYYY(dateString);
	SetView(view, false, parseMMDDYYYY(dateString));
}


function getNow()
{

  var d = new Date();
  return new Date(d.getTime() + (480 + d.getTimezoneOffset()) * 60000);

}


function getCalendarDetailPortletId()
{
	if ( window.calendarDetailPortletId != null )
		return window.calendarDetailPortletId;
	return 'nl_calendar';
}

function refreshEventBasedPortlets()
{
	if ( window.calendarDetailPortletId )
	{
		changeday(0); 
	}

	if ( window.eventPortletQueryId )
	{
		refreshPortlet(window.eventPortletQueryId,'EVENTS',false,'-29');
	}
}

function goView(dateString, view, cal)
{
    NS.Dashboard.getInstance().triggerActionOnAllPortlets("updateView", { "viewtype": view, "date": dateString });
}

function goWeek(s)  { goView(s,'week'); }
function goMonth(s) { goView(s,'month'); }
function goDay(s)   { goView(s,'day'); }

function getCalendar()
{
	var returnMe = null;
	if ( document.getElementById('ccal') != null )
		returnMe = getSelectValue(document.getElementById('ccal'));
	else if ( document.getElementById('ccal_fs') != null )
		returnMe = getSelectValue(document.getElementById('ccal_fs'));
	return returnMe
}

function editEvent(id,sdate,instance,anchor,whenceBehavior,eventUrl)
{
    if (window.eventUrl != null) {
        var url = buildEventUrl(window.eventUrl, getCalendar(), getView(), sdate, null);
        url += '&id='+id + '&e=T'+ (instance ? '&_instance=T' : '');
        url = addWhenceParamToUrl(url, whenceBehavior, sdate, getView());
        anchor.href = url;
    }
}
function viewEvent(id,sdate,anchor,eventUrl)
{
    if (window.eventUrl != null) {
        var url = buildEventUrl(window.eventUrl, getCalendar(), getView(), sdate, null);
        url += '&id='+id;
        anchor.href = url;
    }
}
function editCall(id,sdate,instance,anchor,whenceBehavior)
{
	navigateToEventSubtype('edit', 'call', id, anchor, whenceBehavior);
}
function viewCall(id,sdate,anchor)
{
	navigateToEventSubtype('view', 'call', id, anchor);
}
function editTask(id,sdate,instance,anchor,whenceBehavior)
{
	navigateToEventSubtype('edit', 'task', id, anchor, whenceBehavior);
}
function viewTask(id,sdate,anchor)
{
	navigateToEventSubtype('view', 'task', id, anchor);
}

function navigateToEventSubtype(action, type, id, anchor, whenceBehavior)
{
	var url = '/app/crm/calendar/' + type + '.nl?id='+id + (action == 'edit' ? '&e=T' : '');
	url = addWhenceParamToUrl(url, whenceBehavior, null, getView());
	anchor.href = url;
}

function addWhenceParamToUrl(url,whenceBehavior,sdate,viewFilter)
{
	if (whenceBehavior == 'standalone')
	{
		var whence = buildEventUrl('/app/crm/calendar/calendar.nl', getCalendar(), viewFilter || getView(), sdate, null);
		url = addParamToURL(url, 'whence', encodeURIComponent(whence), true);
	}
	else if (whenceBehavior == 'card')
	{
		var whenceData = getCalendar() + '_' + (viewFilter || getView());
		url = addParamToURL(url, 'nav', whenceData);
	}
	return url;
}

function newEvent(sdate,stime,anchor,whenceBehavior,viewFilter)
{
	newEventRecord(sdate,stime,anchor,viewFilter,whenceBehavior,'event',window.eventUrl);
}
function newCall(sdate,stime,anchor,whenceBehavior,viewFilter)
{
	newEventRecord(sdate,stime,anchor,viewFilter,whenceBehavior,'call','/app/crm/calendar/call.nl');
}
function newTask(sdate,stime,anchor,whenceBehavior,viewFilter)
{
	newEventRecord(sdate,stime,anchor,viewFilter,whenceBehavior,'task','/app/crm/calendar/task.nl');
}
function newEventRecord(sdate,stime,anchor,viewFilter,whenceBehavior,sRecordType,sURL)
{
	var url = buildEventUrl(sURL, getCalendar(), viewFilter, sdate, stime);
	url = addWhenceParamToUrl(url,whenceBehavior,sdate,viewFilter);
	if (anchor)
		anchor.href = url;
	else
		document.location = url;
}
function buildEventUrl(baseUrl, calendarId, viewFilter, dateString, timeString)
{
	var url = baseUrl;
	if (calendarId)
		url = addParamToURL(url, 'ccal', calendarId, true);
	if (viewFilter)
		url = addParamToURL(url, '_viewFilter', viewFilter, true);
	if (!isValEmpty(dateString))
		url = addParamToURL(url, 'date', encodeURIComponent(dateString), true);
	if (!isValEmpty(timeString))
		url = addParamToURL(url, 'time', timeString, true);
	return url;
}
function changemonth(delta, bSetView, bInline)
{
	var div = NLCalender_getCalendarDIV( bInline );

	if (bInline)
        div.view = 'day';
    else if (bSetView || !div.view)
		div.view = 'month';

    if (div.currdate == null)
        div.currdate = getNow();

    var tempdate = cloneDateWithoutTime(div.currdate);
    addmonths(tempdate, delta);

    var tempstring = formatMMDDYYYY(tempdate);
    div.selecteddate = tempdate;

    WriteCalendar(tempdate, bInline);

    if (!bInline)
        goView(tempstring, getView(bInline));
}

function prevmonth(bSetView,bInline)
{
    changemonth(-1, bSetView, bInline);
}
function nextmonth(bSetView,bInline)
{
    changemonth(1, bSetView, bInline);
}

function changeweek( delta, bSetView )
{
    var div = NLCalender_getCalendarDIV();

	if (bSetView || !div.view)
		div.view = 'week';
    if (div.currdate == null)
        div.currdate = getNow();

    var tempdate = cloneDateWithoutTime(div.currdate);
    adddays(tempdate,delta);

    var tempstring = formatMMDDYYYY(tempdate);
    div.selecteddate = tempdate;
    WriteCalendar(tempdate);
    goView(tempstring, getView());
}

function prevweek(bSetView)
{
    changeweek(-7, bSetView);
}

function nextweek(bSetView)
{
    changeweek(7, bSetView);
}

function changeday( delta, bSetView )
{
    var div = NLCalender_getCalendarDIV();

	if (bSetView || !div.view)
		div.view = 'day';
    if (div.currdate == null)
        div.currdate = getNow();

    var tempdate = cloneDateWithoutTime(div.currdate);
    adddays(tempdate,delta);

    var tempstring = formatMMDDYYYY(tempdate);
    div.selecteddate = tempdate;
    WriteCalendar(tempdate);

    goView(tempstring, getView());
}

function prevday(bSetView)
{
    changeday(-1, bSetView);
}

function nextday(bSetView)
{
    changeday(1, bSetView);
}

function gotoToday()
{
	document.location = "/app/crm/calendar/calendar.nl?date="+ getTodayShortDate();
}

function getLongDate(date, useTruncatedNames)
{
	var dayVar = useTruncatedNames ? NLDate_short_days[date.getDay(date)] + ' ' : '';
	var dateformat = "Month DD, YYYY";
	if(useTruncatedNames)
		dateformat = dateformat.replace(/month/i, "Mon");
	return dayVar + getdatestring(date, dateformat);
}

function getTodayLongDate()
{
	return getLongDate( getNow() )
}

function getTodayShortDate()
{
	var tempdate = getNow();
	return tempdate.getMonth()+1 +"/" + tempdate.getDate() + "/" + tempdate.getFullYear();
}

function getView(bInline)
{
    if(bInline)
    {
        return 'day';
    }
    else
    {
        var div = NLCalender_getCalendarDIV( bInline);
        var view = div.view;
        return (view != null ? view : 'day');
    }
}

function SetView(view, init, dateString)
{
	var div = NLCalender_getCalendarDIV();
    var tempdate;
    if (div == null)
        tempdate = dateString==null ? getNow() : dateString;
    else
        tempdate = div.selecteddate==null ? getNow() : div.selecteddate;

    var datestring = formatMMDDYYYY(tempdate);

    if ( !init )
    {
		if (view == 'week')
		  goWeek(datestring);
		else if (view == 'month')
		  goMonth(datestring);
		else
		  goDay(datestring);
    }
    if (div!=null)
        div.view = view;
    WriteCalendar(tempdate);
}

function setNavigationStatus(calendarId, view, dateString)
{
	var div = NLCalender_getCalendarDIV();
	div.view = view;
	if (dateString)
		div.currdate = parseMMDDYYYY(dateString);
}

function markToday(today,date)
{
	if (today == date)

		return "<b>"+date+"</b>" ;

	else
		return date;
}

function isDetailCalSync()
{
	return (document.getElementById(getCalendarDetailPortletId()) != null ||
            ((NS.Dashboard) && (NS.Dashboard.getInstance().getType()=="ACTIVITIES" )));
}

function isDetailOrDeferredCalSync()
{
	return isDetailCalSync() ;
}

function isPopupCal()
{
	return false;
}


function getCalendarHTMLHeader( bIsInline, date )
{

    var sTitleClass = "portletlabel";

    if(bIsInline)
    {
        sTitleClass = "smalltextb";
        return "<div class='uir-popup-cal-nav' style='text-align:center; white-space: nowrap;'>  <a class='iArrowLeft' style='margin-left: 5px;' href='javascript:void(0);' onclick='prevmonth(false," + bIsInline + "); return false;'>&nbsp;</a>  <span class='uir-popup-cal-nav-title textbold' style='display:inline-block; width: 110px; vertical-align:top;'>"+getdatestring(date, 'Mon  YYYY')+"</span>  <a class='iArrowRight' style='margin-right: 5px;' href='javascript:void(0);' onclick='nextmonth(false," + bIsInline + "); return false;'>&nbsp;</a></div></td></tr><tr>"; 
    }
    else
    {
        bIsInline = false;
        return "<table width=100% id='table_calendarPortletId' border=0 cellspacing=0 cellpadding=0 style='margin-bottom: 10px;'><tr class='portletlabelDragDrop' id='calendarPortletId'><td width='3' height='20'><img class='portletTitleL' height='100%' width='3' border='0' src='/images/nav/ns_x.gif'></td><td class='portletHeaderBg portletTitleText'><div class='uir-popup-cal-nav' style='text-align:center; white-space: nowrap;'>  <a class='iArrowLeft' style='margin-left: 5px;' href='javascript:void(0);' onclick='prevmonth(false," + bIsInline + "); return false;'>&nbsp;</a>  <span class='uir-popup-cal-nav-title textbold' style='display:inline-block; width: 110px; vertical-align:top;'>"+getdatestring(date, 'Mon  YYYY')+"</span>  <a class='iArrowRight' style='margin-right: 5px;' href='javascript:void(0);' onclick='nextmonth(false," + bIsInline + "); return false;'>&nbsp;</a></div></td><td class='portletHeaderBg portletIcons' id='calendarPortletId_portletIcons' nowrap='true' align='right'></td><td width='3' height='20'><img class='portletTitleR' height='100%' width='3' border='0' src='/images/nav/ns_x.gif'></td></tr><tr class='portletBgColor' id='calendarPortletId_content'><td><img height='1' width='3' vspace='20' src='/images/nav/ns_x.gif'></td><td style='background-color:#FFFFFF;' valign='top' colspan='2'><table width='100%' border='0' cellspacing='0' cellpadding='0' ><tr>";
    }
}

var NLDate_days = new Array("Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday");
var NLDate_short_days = new Array("Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat");
var newToolTip = null;

if ( false )
{
	var id = 0;
	for(id=1-1;id<= 7-1;id++)
	{
		NLDate_short_days[id] = NLDate_short_days[id].substr(2,1);
	}
}

function getCalendarMouseoverScript()
{
    return "onMouseOver=\"this.className='dkBlueSel'\" onMouseOut=\"this.className='textnolink'\"";
}

function WriteCalendar( d, bIsInline)
{
	if ((bIsInline == undefined || !bIsInline)&&NS.Dashboard)
    {
        return writeDashboardPortletCalendar(d);
    }

    var calendarDiv = NLCalender_getCalendarDIV(bIsInline);

	
	if ( !bIsInline && document.getElementById('calendarDetailPortletId') != null && window.calendarDetailPortletId != null )
	{
		document.getElementById('calendarDetailPortletId').id = window.calendarDetailPortletId;
    }

    calendarDiv.currdate = d;
    var months = new Array("January","February","March",
        "April","May","June","July",
        "August","September","October","November","December");
    var curmonth=d.getMonth()+1;
    var curyear = d.getFullYear();
    var d0 = new Date(curyear,curmonth-1,1);
    var firstdofw = getFirstDayOfWeekOffSet( d0 );
    d0.setDate(0);
    var lastmonthday = d0.getDate() - firstdofw+1;
    d0 = new Date(curyear,curmonth-1,1);
    if (d0.getMonth() == 11)
    {
        d0.setMonth(0);
        d0.setFullYear(d0.getFullYear()+1);
    }
    else
        d0.setMonth(d0.getMonth()+1);
    d0.setDate(0);
    var lastday = d0.getDate();
    var week;
    var dofw;
    var day;
    var nextmonthday = 1;

    var now = getNow();
    var selectedDay = 0;
    var today;

    if (now.getFullYear() == d.getFullYear() && now.getMonth() == d.getMonth())
        today = now.getDate();
    else
        today = 0;

    if (calendarDiv != null && calendarDiv.datefield != null)
    {
        var inputDate = calendarDiv.datefield.value;
        if (inputDate != null && inputDate.length > 0)
        {
            inputDate = parseDateOrTodayOnFail(inputDate);
            if (inputDate.getFullYear() == d.getFullYear() && inputDate.getMonth() == d.getMonth())
                selectedDay = inputDate.getDate();
        }
    }

    if (calendarDiv.selecteddate == null)
        calendarDiv.selecteddate = getNow();

 
		var tabletext = "<table id='calendar' border='0' cellspacing='0' cellpadding='0' "+ (bIsInline ? "" : "width='100%'" ) +">\n";
        tabletext += "    <tr>\n";
        tabletext += "      <td valign='top'>";

        tabletext += getCalendarHTMLHeader(bIsInline, d);

 		tabletext += "<td align='center'><table><tr>";

	    
        
        if(!bIsInline)
        {
            var todayhref = !isDetailOrDeferredCalSync() && !isPopupCal() ? "javascript:gotoToday()" : "javascript:pickdate(getTodayShortDate())";
            tabletext += "                        <td colspan='3' class='smalltext' align='center' nowrap><a class='dottedlink' href='"+todayhref+"'>"+'Today'+"</a>: \n";
            tabletext += "                          "+getTodayLongDate()+"</td>\n";
            tabletext += "                      </tr>\n";
            tabletext += "                      <tr> \n";
        }

        tabletext += "                        <td colspan='3'> \n";


	    
        
        tabletext += "<table border='0' cellspacing='0' cellpadding='2' width='100%' class='uir-popup-cal'>\n";
        tabletext += "<tr class='uir-popup-cal-header-row'> \n";

        var view = getView(bIsInline);

        
        if ( view == 'month' )
        {
            var i = 0, style;
            for (i=1; i<=12; i++)
            {
                style = (i == calendarDiv.selecteddate.getMonth()+1) ? 'smalltextlt nowrap' : 'smalltext';
                tabletext += "  <td class='"+style+"' align='center'><a class='dottedlink' href='javascript:pickmonth(\""+i+"/1/"+curyear+"\");'>"+NLDate_short_months[i-1]+"</a></td>\n";
                if (i%3==0)
                    tabletext += "</tr>\n";
            }
        }
        else
        {
            
            for (var i=0; i<=6; i++)
            {
                // offset 0: SUN start, offset 1: MON start, offset -1: SAT start
                var dayOfWeek = (i + 7 + NS.CalendarPreference.getFirstDayOfWeekOffset() ) % 7;
                tabletext += "\n<td class='smalltext' style='white-space:nowrap; text-align:center'>"+NLDate_short_days[dayOfWeek]+"</td>\n";
            }

            tabletext += "</tr>\n<!-- start calendar-->\n";


            var dayofthemonth = calendarDiv.selecteddate.getDate();
            var sMouseOver = getCalendarMouseoverScript();

			var startOfSelectedWeekOffset = (calendarDiv.selecteddate.getDay() - NS.CalendarPreference.getFirstDayOfWeekOffset() + 7) % 7;
            var sundaybeforeselectedday = dayofthemonth - startOfSelectedWeekOffset;
            var satafterselectedday = sundaybeforeselectedday + 6;

            for (week=1,dofw=1,day=1;day<=lastday || dofw <= 7;)
            {
                if (dofw == 1)
                    tabletext += "<tr class='uir-popup-cal-row'>\n";
                if (week==1 && dofw < firstdofw + 1)
                {
                    var sPrevDate = (curmonth>1 ? curmonth-1 : 12) +"/"+lastmonthday+"/"+(curmonth>1 ? curyear : curyear-1);

                    var lastmonthdayhref = !isDetailOrDeferredCalSync() && !isPopupCal() ? "/app/crm/calendar/calendar.nl?date=" + sPrevDate:
                                                                                 "javascript:"+(view == 'week' ? 'pickdateinweek' : 'pickdate')+"(\""+ sPrevDate +"\");";
                    var clickhandle = "";

                    if(bIsInline)
                    {
                        lastmonthdayhref = "#";
                        clickhandle = "onclick='pickdate_inline(\"" + sPrevDate + "\");'";
                    }
                    tabletext += "<td class='uir-popup-cal-cell' style='text-align:center;'" + sMouseOver + ">";
                    tabletext += "<a class='uir-popup-cal-cell-text-light smalltextnolink' style='color:#666666' " + clickhandle + " href='"+lastmonthdayhref+"'>"+lastmonthday+"</a>";
                    tabletext += "</td>";
                    lastmonthday++;
                    dofw++;
                }
                else if (day > lastday)
                {
                    var sNextDate = (curmonth<12 ? curmonth+1 : 1) +"/"+nextmonthday+"/"+(curmonth<12 ? curyear : curyear+1);
                    var nextmonthdayhref = !isDetailOrDeferredCalSync() && !isPopupCal() ? "/app/crm/calendar/calendar.nl?date=" + sNextDate :
                                                                                 "javascript:"+(view == 'week' ? 'pickdateinweek' : 'pickdate')+"(\"" + sNextDate +"\");";
                    var clickhandle = "";

                    if(bIsInline)
                    {
                        nextmonthdayhref = "#";
                        clickhandle = "onclick='pickdate_inline(\"" + sNextDate + "\");'";
                    }
                    tabletext += "<td class='uir-popup-cal-cell' style='text-align:center;'" + sMouseOver + ">";
                    tabletext += "<a class='uir-popup-cal-cell-text-light smalltextnolink' style='color:#666666' " + clickhandle + " href='"+nextmonthdayhref+"'>"+nextmonthday+"</a>";
                    tabletext += "</td>";
                    nextmonthday++;
                    dofw++;
                }
                else
                {
                    var classname, style, hiLiteCondition;
                    if ( isDetailOrDeferredCalSync() || isPopupCal() )
                        hiLiteCondition = (view=='week' && sundaybeforeselectedday <= day && day <= satafterselectedday) || (view=='day' && day == dayofthemonth);
                    else
                        hiLiteCondition = view=='day' && now.getDate() == day && now.getMonth()+1 == curmonth && now.getFullYear() == curyear;

                    if ( hiLiteCondition )
						style = 'smalltextlt nowrap ';
                    else
                        style = 'smalltext';

                    var uirStyle = (day == selectedDay) ? "uir-popup-cal-cell-selected" : "uir-popup-cal-cell";

                    if ( view == 'week' )
                    {
                      tabletext += "<td style='text-align: center;' class='"+style+uirStyle+"' ><a href='javascript:pickdateinweek(\""+curmonth+"/"+day+"/"+curyear+"\");' class='textnolink uir-popup-cal-cell-text'" + sMouseOver + ">"+markToday(today,day)+"</a></td>\n";
                    }
                    else
                    {
                        var sDate = curmonth+"/"+day+"/"+curyear;
                        var dayhref = !isDetailOrDeferredCalSync() && !isPopupCal() ? "/app/crm/calendar/calendar.nl?date=" +  sDate :
                                                                                          "javascript:pickdate(\"" + sDate + "\");";
                        var clickhandle = "";

                        if(bIsInline)
                        {
                            dayhref = "#";
                            clickhandle = "onclick='pickdate_inline(\"" + sDate +"\");'";
                        }
                        tabletext += "<td style='text-align: center;' class='" + uirStyle + "' " + sMouseOver + ">";
                        tabletext += "<a " + clickhandle + " href='"+dayhref+"' class='textnolink uir-popup-cal-cell-text' " + sMouseOver + ">"+markToday(today,day)+"</a></td>\n";
                    }
                    day++;
                    if (dofw == 7)
                    {
                        tabletext += "\n</tr>\n";
                        week++;
                        dofw = 1;
                    }
                    else
                        dofw++;
                }
            }
            if ( dofw != 0 )
                tabletext += "</tr>";
                tabletext += "\n<!-- end calendar-->\n";
        }

        tabletext += "              </table>\n";
        <!--  end of calendar core (dates)-->

        tabletext += "                        </td>\n";
        tabletext += "                      </tr>\n";

		if ( !bIsInline && isDetailOrDeferredCalSync() )
		{
			tabletext += "                      <tr> \n";
			tabletext += "                        <td colspan='3' align='center'><img src='/images/nav/ns_x.gif'  style='background-color:#CCCCCC; margin-bottom: 5px;' width='150' height='1'></td>\n";
			tabletext += "                      </tr>\n";
			tabletext += "                      <tr> \n";

			style = view == 'day' ? 'textboldnolink' : 'text dottedlink';
			tabletext += "<td align='center'><a class='"+style+"' href='javascript:SetView(\"day\");'>"+'Day'+"</a></td>\n";

			style = view == 'week' ? 'textboldnolink' : 'text dottedlink';
			tabletext += "<td align='center'><a class='"+style+"' href='javascript:SetView(\"week\");'>"+'Week'+"</a></td>\n";

			style = view == 'month' ? 'textboldnolink' : 'text dottedlink';
			tabletext += "<td align='center'><a class='"+style+"' href='javascript:SetView(\"month\");'>"+'Month'+"</a></td>\n";
			tabletext += "                      </tr>\n";
        }
    	tabletext += "                    </table>\n";
       	tabletext += "                  </td>\n";
        

        
        tabletext += bIsInline ? "" : "</tr></table></td><td><img height='1' width='3' vspace='20' src='/images/nav/ns_x.gif'></td></tr><tr class='portletBgColor'><td class='uir-chiles-dash-bkgd'></td><td colspan='2' style='height: 2px;'></td><td class='uir-chiles-dash-bkgd'></td></tr></table>";

     

        tabletext += "      </td>\n";
        tabletext += "    </tr>\n";
        tabletext += "</table>"
        

	calendarDiv.innerHTML = tabletext;

    
    if ( !bIsInline && document.getElementById('calendarPortletId') != null && window.calendarPortletId != null)
    {
        var titleTr = document.getElementById('calendarPortletId');
        titleTr.id = window.calendarPortletId;
        
        var iconDiv =  document.getElementById("calendarPortletId_portletIcons");
		var label = "Hide";		
        if (iconDiv != null)
        {
            var tdContent = "<a class='portletIconHide' href='javascript:void(0);' title='" + label + "' onclick=\"javascript:hidePortlet(" + "null" + "," + window.calendarPortletId.split("_")[1] + ",'" + window.calendarPortletId + "');\"></a>";
            iconDiv.innerHTML = tdContent;
        }
    }
}


// TODO move this whole function (and related functionality) into CalendarPortlet.js
function writeDashboardPortletCalendar(d)
{
    // .. ugly hack - this property should be defined on server-side
    var CONTROLLER_DASHBOARDS = ["ACTIVITIES", "STATIC_CALENDAR", "STATIC_CAMPAIGN_CALENDAR", "STATIC_SCRIPT_CALENDAR"];
    var dashboardType = NS.Dashboard.getInstance().getType();
    var calendarDetailsController = jQuery.inArray(dashboardType, CONTROLLER_DASHBOARDS) != -1;

    var calendarDiv = NLCalender_getCalendarDIV(false);
    calendarDiv.innerHTML="";
    var view = getView(false);

    
    if ( document.getElementById('calendarDetailPortletId') != null && window.calendarDetailPortletId != null )
    {
        document.getElementById('calendarDetailPortletId').id = window.calendarDetailPortletId;
    }

    // add today's date.
    if (calendarDetailsController) {
    var showToday = document.createElement('div');
    showToday.setAttribute('id', 'ns-calendar-today-date');
    showToday.setAttribute('class', 'ns-calendar-today-date');
    var todayLink = document.createElement('a');
    var todayhref = !calendarDetailsController ? "javascript:gotoToday()" : "javascript:pickdate(getTodayShortDate())";
    todayLink.setAttribute('href', todayhref);
    todayLink.innerHTML = 'Today';
    showToday.appendChild(todayLink);
    calendarDiv.appendChild(showToday);
    }

    // add perv/next month arrows and header for the calendar
    var calendarHeader = document.createElement('div');
    calendarHeader.setAttribute('class', 'ns-calendar-header');

    var navigationContainer = document.createElement('div');
    navigationContainer.setAttribute('class', 'ns-calendar-navigation');

    // left arrow
    var leftArrow = document.createElement('a');
    leftArrow.setAttribute('class' , 'ns-calendar-navigation-icon left-arrow');
    leftArrow.setAttribute('href' , 'javascript:void(0)');
    leftArrow.setAttribute('onclick' , 'prevmonth(false, false); return false');
    navigationContainer.appendChild(leftArrow);

    // right arrow
    var rightArrow = document.createElement('a');
    rightArrow.setAttribute('class' , 'ns-calendar-navigation-icon right-arrow');
    rightArrow.setAttribute('href' , 'javascript:void(0)');
    rightArrow.setAttribute('onclick' , 'nextmonth(false, false); return false')
    navigationContainer.appendChild(rightArrow);

    calendarHeader.appendChild(navigationContainer);

    // title
    var header = document.createElement('div');
    header.setAttribute('class' , 'ns-calendar-title');
    
    var titleDateFormatInJs = "Month  YYYY";
    header.innerHTML=getdatestring(d, titleDateFormatInJs);
    calendarHeader.appendChild(header);

    // add the header div to the calendar.
    calendarDiv.appendChild(calendarHeader);

    // generate the actual calendar
    calendarDiv.currdate = d;
    var curmonth=d.getMonth()+1;
    var curyear = d.getFullYear();
    var d0 = new Date(curyear,curmonth-1,1);
    var firstdofw = getFirstDayOfWeekOffSet( d0 );
    d0.setDate(0);
    var lastmonthday = d0.getDate() - firstdofw+1;
    d0 = new Date(curyear,curmonth-1,1);
    if (d0.getMonth() == 11)
    {
        d0.setMonth(0);
        d0.setFullYear(d0.getFullYear()+1);
    }
    else
        d0.setMonth(d0.getMonth()+1);

    d0.setDate(0);
    var lastday = d0.getDate();
    var week;
    var dofw;
    var day;
    var nextmonthday = 1;

    var now = getNow();
    var today;
    if (now.getFullYear() == d.getFullYear() && now.getMonth() == d.getMonth())
        today = now.getDate();
    else
        today = 0;

    if (calendarDiv.selecteddate == null)
        calendarDiv.selecteddate = getNow();

    var calendarTable = document.createElement('table');
    calendarTable.setAttribute('class', 'ns-calendar-table');

    var dateOfWeekHeaderRow = calendarTable.insertRow(0);
    dateOfWeekHeaderRow.setAttribute('class', 'ns-calendar-week-title');

    // month view;
    if (view == 'month' )
    {
        var dummyHeader = document.createElement('th');
        dummyHeader.setAttribute('colspan', 3);
        dateOfWeekHeaderRow.appendChild(dummyHeader);

        for (var i=0; i<4; i++)
        {
            var monthViewRow = document.createElement('tr');
            for (var j=1; j<=3; j++)
            {
                var k = i*3 + j;
                var markCurMonthStyle = (k == calendarDiv.selecteddate.getMonth()+1? " "+"ns-current-month": "");

                var monthViewCell = document.createElement('td');
                monthViewCell.setAttribute('class', 'ns-calendar-monthview-cell '+markCurMonthStyle);
                monthViewCell.setAttribute('align', 'center');
                var monthViewCellLink = document.createElement('a');
                monthViewCellLink.setAttribute('href', 'javascript:pickmonth(\"'+k+"/1/"+curyear+'\");');
                monthViewCellLink.innerHTML = NLDate_short_months[k-1];
                monthViewCell.appendChild(monthViewCellLink);
                monthViewRow.appendChild(monthViewCell);
            }
            calendarTable.appendChild(monthViewRow);
        }
        calendarDiv.appendChild(calendarTable);
    }
    else
    {
        for (i=0;i<7;i++) {
            var dateOfWeekHeaderCell = document.createElement('th');
            var  dayOfWeek = (i + 7 + NS.CalendarPreference.getFirstDayOfWeekOffset() ) % 7;
            dateOfWeekHeaderCell.innerHTML = NLDate_short_days[dayOfWeek].substr(0,1);
            dateOfWeekHeaderRow.appendChild(dateOfWeekHeaderCell);
        }

        // Done with the zerothRow that shows M, T, W, T, F, S, S...
        // Now begin building the numbers.
        var dayofthemonth = calendarDiv.selecteddate.getDate();

        var startOfSelectedWeekOffset = (calendarDiv.selecteddate.getDay() - NS.CalendarPreference.getFirstDayOfWeekOffset() + 7) % 7;
        var sundaybeforeselectedday = dayofthemonth - startOfSelectedWeekOffset;
        var satafterselectedday = sundaybeforeselectedday + 6;
        var hiLiteCurrentWeekCondition;
        var markThisWeekStyle;

        dofw=1;// day=sundaybeforeselectedday;
        var tableRowIndex=0;
        if (dofw<firstdofw+1)
        {
            var rowFirst = calendarTable.insertRow(++tableRowIndex);
            while (dofw<firstdofw+1) {

                hiLiteCurrentWeekCondition =(sundaybeforeselectedday <= 0) && (view == 'week');
                markThisWeekStyle = (hiLiteCurrentWeekCondition ? " " + "ns-current-week" : "");

                var lastMonthDayCell = document.createElement('td');
                lastMonthDayCell.setAttribute('align', 'center');
                lastMonthDayCell.setAttribute('class' , 'ns-calendar-cell'+' ns-prev-month-cell '+markThisWeekStyle);

                var sPrevDate = (curmonth>1 ? curmonth-1 : 12) +"/"+lastmonthday+"/"+(curmonth>1 ? curyear : curyear-1);
                var lastmonthdayhref = !calendarDetailsController ? "/app/crm/calendar/calendar.nl?date=" + sPrevDate:
                        "javascript:"+(view == 'week' ? 'pickdateinweek' : 'pickdate')+"(\""+ sPrevDate +"\");";

                var lastMonthDayLink = document.createElement('a');
                lastMonthDayLink.setAttribute('href',lastmonthdayhref);
                var lastMonthDayCellDiv=document.createElement('div');
                lastMonthDayCellDiv.innerHTML = lastmonthday;
                lastMonthDayCellDiv.setAttribute('class', 'ns-calendar-cell-innerdiv');
                lastMonthDayLink.appendChild(lastMonthDayCellDiv);
                lastMonthDayCell.appendChild(lastMonthDayLink);

                rowFirst.appendChild(lastMonthDayCell);
                dofw++;
                day++;
                lastmonthday++;
            }
        }

        // now dofs==firstdofw, deal with this month;
        day=1;
        var row;
        while (day<=lastday){
            dofw=dofw>7?dofw-7:dofw;
            if (dofw==1)
                row= calendarTable.insertRow(++tableRowIndex);
            else
                row= calendarTable.rows[tableRowIndex];

            while(dofw<=7&&day<=lastday)
            {
                var thisMonthDayCell=document.createElement('td');

                var selectedDay = calendarDiv.selecteddate.getDate();
                var selectedDayCondition = (selectedDay == day) ? true : false;
                var selectedDayStyle = selectedDayCondition ? " "+"ns-selected-day" : "";

                if ( view == 'week' )
                {
                    hiLiteCurrentWeekCondition =(sundaybeforeselectedday <= day && day <= satafterselectedday);
                    markThisWeekStyle = (hiLiteCurrentWeekCondition ? " " + "ns-current-week" : "");
                    thisMonthDayCell.setAttribute('class', 'ns-calendar-cell'+ markThisWeekStyle);

                    var thisMonthDayCellLink=document.createElement('a');
                    var thisMonthDayCellDiv=document.createElement('div');
                    var markTodayInWeekViewStyle = (today==day? " "+"ns-today": "");
                    thisMonthDayCellDiv.setAttribute('class', 'ns-calendar-cell-innerdiv'+markTodayInWeekViewStyle + selectedDayStyle);
                    thisMonthDayCellDiv.appendChild(thisMonthDayCellLink);

                    var pickweekString = "javascript:pickdateinweek(\""+curmonth+"/"+day+"/"+curyear+"\");";

                    thisMonthDayCellLink.setAttribute('href',pickweekString);
                    thisMonthDayCellLink.innerHTML=day;

                    thisMonthDayCell.appendChild(thisMonthDayCellDiv);
                }
                else
                {
                    var markTodayStyle = (today==day? " "+"ns-today": "");
                    thisMonthDayCell.setAttribute('class', 'ns-calendar-cell ' + selectedDayStyle);

                    var thisMonthDayCellLink=document.createElement('a');
                    var thisMonthDayCellDiv=document.createElement('div');
                    var sDate = curmonth+"/"+day+"/"+curyear;
                    var dayhref = !calendarDetailsController ? "/app/crm/calendar/calendar.nl?date=" +  sDate :
                            "javascript:pickdate(\"" + sDate + "\");";

                    thisMonthDayCellLink.setAttribute('href' , dayhref);
                    thisMonthDayCellDiv.innerHTML=day;
                    thisMonthDayCellDiv.setAttribute('class', 'ns-calendar-cell-innerdiv'+markTodayStyle+ selectedDayStyle);
                    thisMonthDayCellLink.appendChild(thisMonthDayCellDiv);
                    thisMonthDayCell.appendChild(thisMonthDayCellLink);
                }
                row.appendChild(thisMonthDayCell);
                dofw++;
                day++;
            }
        }

        // look at dofw. if dofw is mid of the week. Extend the calendar to include days of next month to fill up the calendar.
        while (dofw<=7){
            // still need the parameter "day" to determine if current selected week include the days in the next month.
            hiLiteCurrentWeekCondition =(sundaybeforeselectedday <= day && day <= satafterselectedday) && (view == 'week');
            markThisWeekStyle = (hiLiteCurrentWeekCondition ? " " + "ns-current-week" : "");

            var nextMonthDayCell = document.createElement('td');
            nextMonthDayCell.setAttribute('class', 'ns-calendar-cell' +' ns-next-month-cell' + markThisWeekStyle);

            var sNextDate = (curmonth<12 ? curmonth+1 : 1) +"/"+nextmonthday+"/"+(curmonth<12 ? curyear : curyear+1);
            var nextmonthdayhref = !calendarDetailsController ? "/app/crm/calendar/calendar.nl?date=" + sNextDate :
                    "javascript:"+(view == 'week' ? 'pickdateinweek' : 'pickdate')+"(\"" + sNextDate +"\");";

            var nextMonthDayLink = document.createElement('a');
            nextMonthDayLink.setAttribute('href',nextmonthdayhref);
            var nextMonthDayCellDiv=document.createElement('div');
            nextMonthDayCellDiv.innerHTML = nextmonthday;
            nextMonthDayCellDiv.setAttribute('class', 'ns-calendar-cell-innerdiv');
            nextMonthDayLink.appendChild(nextMonthDayCellDiv);
            nextMonthDayCell.appendChild(nextMonthDayLink);

            var lastRow = calendarTable.rows[tableRowIndex]
            lastRow.appendChild(nextMonthDayCell)
            dofw++;
            nextmonthday++;
            day++;
        }

        calendarDiv.appendChild(calendarTable);
    }

    /** calendar switching has been moved to the Calendar Detail portlet
    if (calendarDetailsController)
    {
        var $viewSwitchContainer = jQuery('<div></div>');
        $viewSwitchContainer.addClass('ns-calendar-switch-view-container');

        $viewSwitchContainer.append(createViewSwitch("day", view == "day"));
        $viewSwitchContainer.append(createViewSwitch("week", view == "week"));
        $viewSwitchContainer.append(createViewSwitch("month", view == "month"));

        calendarDiv.appendChild($viewSwitchContainer.get(0));
    }
     **/
}

function createViewSwitch(type, selected) {
    var $viewSwitch = jQuery("<a></a>");
    $viewSwitch.text(type.charAt(0).toUpperCase() + type.slice(1));
    $viewSwitch.attr("href", "javascript:SetView('" + type + "');");
    $viewSwitch.addClass("ns-calendar-view-switch ns-calendar-view-switch-" + type);

    if (selected) {
        $viewSwitch.addClass('ns-selected');
    }

    return $viewSwitch;
}


function NLCalender_getCalendarDIV( bIsInline )
{
    if(!bIsInline)
    {
        
        return document.getElementById('calendar_div');
    }

    var calendarDiv = document.getElementById('CalendarInlineDIV');

    if( calendarDiv == null )
    {
        var outerDiv = document.createElement('div');
        outerDiv.style.zIndex = 1000;

        outerDiv.id               = 'calendar_outerdiv';
        outerDiv.className        = 'calendarouter';
        outerDiv.style.padding    = '0px';
        outerDiv.onclick          = function () { return false; };
        outerDiv.onmousedown      = function () { return false; };
        outerDiv.onmouseup        = function () { return false; };

        calendarDiv = document.createElement('div');
        calendarDiv.style.zIndex = 1000;

        
        calendarDiv.id               = 'CalendarInlineDIV';
        calendarDiv.style.border     = '0px';
        calendarDiv.style.background = '#FFFFFF';
        calendarDiv.onclick          = function () { return false; };
        calendarDiv.onmousedown      = function () { return false; };
        calendarDiv.onmouseup        = function () { return false; };
        calendarDiv.outerdiv         = outerDiv;

        outerDiv.appendChild(calendarDiv);
        document.body.appendChild(outerDiv);
    }
    return calendarDiv;
}


function NLCalender_popup( src, form, target, bIsExtreme)
{
    var fldDate = getTargetFieldJScript_inline(form, target, bIsExtreme, src);

    window.NLCalendar_onMouseUp = NLCalendar_onMouseUp;

    if ( fldDate )
    {
        var calendarDiv = NLCalender_getCalendarDIV(true);
        
        var launchbtn = src;

        
        launchbtn.className = launchbtn.className + '_focus';

        calendarDiv.launchbutton = launchbtn;
        calendarDiv.datefield = fldDate;

        window.calendarDIV = calendarDiv.outerdiv;
        calendarDiv.outerdiv.launchbutton = launchbtn;

        var d;
        if (fldDate.datefldtype == 'mmyydate')
        {
            
            d = stringtodate(fldDate.value);
            
            if( !d || isNaN(d) )
            {
                d = new Date();
            }
        }
        else
            d = parseDateOrTodayOnFail(fldDate.value);

        WriteCalendar( d, true);

        window.calendarDIV.style.display = 'block';
        NLCalender_positionDIV(calendarDiv);
    }
}


function NLCalender_positionDIV(div)
{
    var btn = div.launchbutton;
    var x = findPosX(btn);
    var y = findPosY(btn);
    var fx = x - getScrollLeftOffset(btn);
    var fy = y + 16 - getScrollTopOffset(btn);
    var iDocHeight = getDocumentHeight();
    var iDocWidth  = getDocumentWidth();
    var iDivWidth  = parseInt(div.outerdiv.offsetWidth);
    var iDivHeight = parseInt(div.outerdiv.offsetHeight);

	if ( (fx + iDivWidth) > iDocWidth )
    {
		fx = getDocumentWidth() - iDivWidth;
    }

	if ( fy + iDivHeight > iDocHeight )
    {
        if ( (y - iDivHeight ) > 0 ) 
        {
    		fy = y - iDivHeight + 1;
        }
        else
        {
            
            fy = parseInt(( iDocHeight - iDivHeight ) / 2);
            fx = x + 16;

            
            if ( fx + iDivWidth > iDocWidth )
            {
                fx = getDocumentWidth() - iDivWidth - 16;
            }

            
            if ( fx < 0 )
            {
               fx = 0;
            }
        }
    }

    var outerdiv = div.outerdiv;
    outerdiv.style.left = fx + "px";
	outerdiv.style.top = fy + "px";
}


function NLCalendar_onMouseUp(evnt)
{
    var caldiv = window.calendarDIV
    if(  caldiv != null )
    {
        var target = getEventTarget(evnt);
        var div = findClassUp(target,'calendarouter');

        if ( div != caldiv)
        {
            hideCalendarDIV();
        }
    }
}


function hideCalendarDIV()
{
    var caldiv = window.calendarDIV
    if(caldiv)
    {
        caldiv.launchbutton.className = caldiv.launchbutton.className.replace('_focus', '');
        caldiv.style.display = 'none';
        window.calendarDIV = null;
    }
}

function getFirstDayOfWeekOffSet( date ) { return (date.getDay() - NS.CalendarPreference.getFirstDayOfWeekOffset() + 7) % 7; }

function getLastDayOfWeekOffSet( date ) { return 6 - getFirstDayOfWeekOffSet( date ); }

function NLDate_cloneDate( date ) {	return new Date(date.getTime()); }
function cloneDateWithoutTime(date) { return new Date(date.getFullYear(), date.getMonth(), date.getDate()); }
function formatMMDDYYYY(date)
{
	return (date.getMonth()+1) + '/' + date.getDate() + '/' + date.getFullYear();
}
function parseMMDDYYYY(dateString)
{
	var a = dateString.split('/');
	return new Date(a[2], a[0]-1, a[1]);
}

function NLDateField_onKeyPress(element, evnt)
{
    var sDateFormat = window.dateformat;
    var dResult = null;
    var rtnValue = true;

    
    var bNoMinus   = sDateFormat ? (sDateFormat.indexOf("-") != -1 ) : false;
    var bNoLetters = bNoMinus;

    var datestr = element.value;

	var key = getEventKeypress(evnt);

    
    var charCode = evnt.charCode;
    if (charCode == undefined) charCode = key;  

    

	switch (key)
	{
        case 61:  
		case 43:  
        dResult = parseDateOrTodayOnFail(datestr);
        adddays(dResult,1);
        break;

		case 45:  
		if(bNoMinus) break;
        case 95: 
        dResult = parseDateOrTodayOnFail(datestr);
        adddays(dResult,-1);
        break;

		case 84:  
        dResult = new Date();
        adddays(dResult,1);
        break;

		case 116:  
        if(bNoLetters) break;
    	dResult = new Date();
        break;

		case 121:  
        if(bNoLetters) break;
        dResult = new Date();
        adddays(dResult, -1);
        break;

		case 109:  
        
        if( (charCode != 109) || bNoLetters) break;
        dResult = new Date();
        dResult.setDate(NLDate_getLastDayOfMonth(dResult));
        break;

        case 108:  
        if( (charCode != 108) || bNoLetters) break;
        dResult = new Date();
        dResult.setDate(NLDate_getLastDayOfMonth(addmonths(dResult,-1)));
        break;

        case 112:  
        if(bNoLetters) break;
        if(window.pp_es)
        {
            var sel = document.forms['main_form'].elements['postingperiod'];
            var value = getSelectValue(sel);
            var elementValue = ((value.length != 0 && pp_es.length > value) ? pp_es[value] : '');
            dResult = NLDate_parseString(elementValue); 
        }
        break;
    }

    
    if( dResult )
    {
        var sNewValue = getdatestring(dResult);

        
        if( datestr != sNewValue )
        {
            element.value = sNewValue;
            NS.form.setChanged(true);
            element.checkvalid = true;

            
            if(element.onchange)
            {
                element.onchange();
            }
        }

        setEventCancelBubble(evnt);
        return false;
    }

    return true;
}


function parseDateOrTodayOnFail(sDate)
{
    var d = stringtodate(sDate);
    if(d == null)
        d = new Date();
    return d;
}

function NLEvent(id, type, startdate, title, status)
{
    
	this.id = id;
	this.type = type;
	this.startDate = startdate;
    this.endDate = this.startDate;
	this.title = title;
	this.status = status;
    this.message = null;
	this.location = null;
    this.timezone = null;
    this.startTime = null;
    this.endTime = null;
    this.isTimed = true;

    
	this.period = null;
	this.frequency = "NONE";
	this.recurrenceDOW = this.recurrenceDOWIM = this.recurrenceDOWMask = null;
	this.endByDate = null;
	this.exclusionDates = null;

    
    this.response = "accepted";

    
    this.isEventOnDate = NLCalendar_isEventOnDate;
    this.isExclusionDate = NLCalendar_isExclusionDate;
    this.isEventStartInPeriod = NLCalendar_isEventStartInPeriod;
    this.isEventInPeriod = NLCalendar_isEventInPeriod;

    
    this.getTitleLink = NLCalendar_getTitleLink;
    this.getPeriodSize = NLCalendar_getPeriodSize;
    this.getResponseIcon = NLCalendar_getResponseIcon;
    this.getRecurringIcon = NLCalendar_getRecurringIcon;
    this.getDailyCalendarCell = NLCalendar_getDailyCalendarCell;
    this.getWeeklyCalendarCell = NLCalendar_getWeeklyCalendarCell;
    this.getMonthlyCalendarCell = NLCalendar_getMonthlyCalendarCell;
}

function NLCalendar_isEventOnDate(date)
{
	var dStart = stringtodate(this.startDate);
	var dDate = stringtodate(getdatestring(date));
	if (dDate < dStart || (this.endByDate != null && dDate > stringtodate(this.endByDate)) || this.isExclusionDate(dDate))
		return false;

	var deltaDays = daysBetween(dStart, dDate);
	var nPeriod = parseInt(this.period);

	if (this.frequency == 'NONE')
		return deltaDays == 0;
	if (this.frequency == 'DAY')
		return deltaDays % nPeriod == 0;

	var nDOW = dDate.getDay();
	var weekModulus = daysBetween(adddays(NLDate_cloneDate(dStart), -dStart.getDay()), adddays(NLDate_cloneDate(dDate), -nDOW)) % (7*nPeriod);

	if (this.frequency == 'WEEK')
	{
		if (!this.recurrenceDOWMask || this.recurrenceDOWMask.length != 7)
			return deltaDays % (7*nPeriod) == 0;
		else
			return weekModulus == 0 && this.recurrenceDOWMask.charAt(nDOW) == 'T';
	}
	else if (this.frequency == 'MONTH' || this.frequency == 'YEAR')
   	{
		var monthPeriod = (this.frequency == 'YEAR') ? (12*nPeriod) : nPeriod;
		if (monthsBetween(dStart, dDate) % monthPeriod != 0)
			return false;
		if (!this.recurrenceDOWIM)
			return dDate.getDate() == dStart.getDate();
		else
			return nDOW == this.recurrenceDOW && isDOWIM(dDate, this.recurrenceDOWIM);
	}
	else if (weekModulus == 0)
	{
		if (this.frequency == 'WEEKEND')
			return dDate.getDay() == 0 || dDate.getDay() == 6;
		else if (this.frequency == 'WEEKDAY')
			return dDate.getDay() > 0 && dDate.getDay() < 6;
		else if (this.frequency == 'MWF')
			return dDate.getDay() == 1 || dDate.getDay() == 3 || dDate.getDay() == 5;
		else if (this.frequency == 'TTH')
			return dDate.getDay() == 2 || dDate.getDay() == 4;
	}
	return false;
}

function NLCalendar_isExclusionDate( date )
{
    var excludeEvent = false, i = 0;
    if ( this.frequency != 'NONE' && this.exclusionDates != null && this.exclusionDates.length > 0 )
    {
        while ( !excludeEvent && i < this.exclusionDates.length )
            excludeEvent = date == this.exclusionDates[ i ];
    }
    return excludeEvent;
}

function NLCalendar_isEventStartInPeriod( time, periodSize )
{
    var startTime = stringtotime( null, this.startTime );
    var timeMinutes = parseInt( time.getHours()*60 + time.getMinutes() );
    var startTimeMinutes = parseInt( startTime.getHours()*60 + startTime.getMinutes() );

    return startTimeMinutes >= timeMinutes && startTimeMinutes < (timeMinutes + (periodSize ? periodSize : 30) );
}

function NLCalendar_isEventInPeriod( time, periodSize )
{
    var endTime = stringtotime( null, this.endTime );
    var startTime = stringtotime( null, this.startTime );

    var timeMinutes = parseInt( time.getHours()*60 + time.getMinutes() );
    var endTimeMinutes = parseInt( endTime.getHours()*60 + endTime.getMinutes() );
    var startTimeMinutes = parseInt( startTime.getHours()*60 + startTime.getMinutes() );

    return  ( startTimeMinutes >= timeMinutes && startTimeMinutes < timeMinutes+(periodSize ? periodSize : 30) ) ||
            ( endTimeMinutes > timeMinutes && endTimeMinutes <= timeMinutes+(periodSize ? periodSize : 30) ) ||
            ( startTimeMinutes < timeMinutes && endTimeMinutes > timeMinutes+(periodSize ? periodSize : 30) );
}

function NLCalendar_getPeriodSize( periodSize )
{
    var endTime = stringtotime( null, this.endTime );
    var startTime = stringtotime( null, this.startTime );

    var endTimeMinutes = parseInt( endTime.getHours()*60 + endTime.getMinutes() );
    var startTimeMinutes = parseInt( startTime.getHours()*60 + startTime.getMinutes() );

    return Math.ceil((endTimeMinutes - startTimeMinutes)/(periodSize ? periodSize : 30));
}

function NLCalendar_getMaxEventsInPeriod( eventList, date, periodSize )
{
    var maxEventsInPeriod = 0;
    var workingDate = NLDate_cloneDate( date );
    workingDate.setHours( 0 );
    var dateEndOfDay = NLDate_cloneDate( workingDate );
    dateEndOfDay.setHours( 23 );
    while ( workingDate < dateEndOfDay )
    {
        var eventsInPeriod = NLCalendar_getEventsInPeriod( eventList, workingDate, periodSize );
        if ( maxEventsInPeriod < eventsInPeriod.length )
            maxEventsInPeriod = eventsInPeriod.length;
        
        workingDate.setMinutes( workingDate.getMinutes() + periodSize );
    }
    return maxEventsInPeriod;
}

function NLCalendar_getDailyCalendarCell( colspan )
{
    var cell =  "<td class='texttable' style='VERTICAL-ALIGN: top; TEXT-ALIGN: left' "+(colspan != null ? "colspan='"+colspan+"'" : "")+" rowspan='"+this.getPeriodSize()+"'>";
        cell +=     "<p>"+this.getResponseIcon()+"&nbsp;";
		if ( this.isTimed )
			cell += this.startTime+"-"+this.endTime+"&nbsp;";
        cell +=     this.getTitleLink();
        cell +=     this.getRecurringIcon();
        cell +=     "</p>";
        cell += "</td>";
    return cell;
}

function NLCalendar_getWeeklyCalendarCell(  )
{
    var cell =  "<td colspan='2' class='bglttext'>";
        cell +=     "<p>"+this.getResponseIcon()+"&nbsp;";
		if ( this.isTimed )
			cell += this.startTime+"-"+this.endTime+"&nbsp;";
        cell +=     this.getTitleLink();
        cell +=     this.getRecurringIcon();
        cell +=     "</p>";
        cell += "</td>";
    return cell;
}

function NLCalendar_getMonthlyCalendarCell(  )
{
    var cell =  this.getTitleLink();
    return cell;
}

function NLCalendar_getTitleLink(  )
{
    var sStatus = getRecordValue( this.type+"status", this.status, "name" );
    var sTitle = this.title + ' (' + sStatus + ')';
	var sBottomLine = this.isTimed ? ( this.startTime + ' - ' + this.endTime ) : '';
    sBottomLine += isValEmpty( this.location ) ? '' : (this.isTimed ? ' - ' : '') + this.location;
	sTitle += isValEmpty( sBottomLine ) ? '' : '<BR>' + sBottomLine;
	var sMessage = emptyIfNull( this.message ).replace(/\n/g,'<BR>');

    var onMouseout = "if (NS.form.isInited()) hideToolTip()";
    var onMouseover = "if (NS.form.isInited()) showToolTip('"+sTitle.replace( /\'/g ,"\\'")+"', '"+sMessage.replace( /\'/g ,"\\'")+"')";
    var onClick = "viewEvent('"+this.id+"','"+this.startDate+"', this); return true";
    return "<a href='#' onMouseOut=\""+onMouseout+"\" onClick=\""+onClick+"\" onMouseOver=\""+onMouseover+"\">"+this.title+"</a>";
}

function NLCalendar_getResponseIcon(  )
{
    var imgClass = this.response;
	if ( this.type == 'task' || this.type == 'call' )
		imgClass = this.type;
	else if ( this.response == 'tentative' || this.response == 'noresponse' )
        imgClass = "tentative";
    else if ( this.status.toLowerCase() == 'cancelled' )
        imgClass = "cancelled";

    imgClass = imgClass+"Icon";
    var img = "<img class='"+imgClass+"' src='/images/nav/ns_x.gif' border='0' height='15' width='15' align='absmiddle' alt='"+this.response+"'/>";

    return img;
}

function NLCalendar_getRecurringIcon(  )
{
    var icon = '';
    if ( this.frequency != 'NONE' )
        icon += "&nbsp;<img src='/images/nav/ns_x.gif' class='iRecurring' alt='Recurring Event' border='0' width='17' align='absmiddle' height='15'>";
    return icon;
}

function NLCalendar_getEventsOnDate( eventList, date, showTimed )
{
    var eventsOnDateList = new Array();
    for ( var i = 0; i < eventList.length; i++ )
	{
		var obj = eventList[ i ];
		if ( showTimed != null && ( (showTimed == 'timed' && !obj.isTimed) || (showTimed == 'untimed' && obj.isTimed) ) )
			continue;
		if ( eventList[ i ].isEventOnDate( date ) )
            eventsOnDateList[eventsOnDateList.length] = eventList[ i ];
	}

	
    eventsOnDateList.sort( NLCalendar_startTimeComparator );
    return eventsOnDateList;
}

function NLCalendar_getEventsStartInPeriod( eventList, time, period )
{
    var eventsInTimePeriodList = new Array();
    for ( var i = 0; i < eventList.length; i++ )
        if ( eventList[ i ].isEventStartInPeriod( time, period ) )
            eventsInTimePeriodList[eventsInTimePeriodList.length] = eventList[ i ];

    
    eventsInTimePeriodList.sort( NLCalendar_startTimeComparator );
    return eventsInTimePeriodList;
}

function NLCalendar_getEventsInPeriod( eventList, time, period )
{
    var eventsInTimePeriodList = new Array();
    for ( var i = 0; i < eventList.length; i++ )
        if ( eventList[ i ].isEventInPeriod( time, period ) )
            eventsInTimePeriodList[eventsInTimePeriodList.length] = eventList[ i ];

    
    eventsInTimePeriodList.sort( NLCalendar_startTimeComparator );
    return eventsInTimePeriodList;
}
function NLCalendar_startDateComparator(event1, event2)
{
  var date1 = stringtodate(event1.startDate);
  var date2 = stringtodate(event2.startDate);
  return (date1 < date2) ? -1 : (date1 == date2 ? 0 : 1);
}
function NLCalendar_startTimeComparator(event1, event2)
{
  var date1 = stringtotime(null, nvl( event1.startTime, "12:00 a") );
  var date2 = stringtotime(null, nvl( event2.startTime, "12:00 a") );
  return (date1 < date2) ? -1 : (date1 == date2 ? 0 : 1);
}

function NLCalendar_getAllEvents()
{
    var recordList = new Array();
	var currentUser = -5;
	var events = getXMLList( getRecordTypeData( "event" ), "/recordType/recordList/record[@perm > 0]" );
    var responses = getRecordTypeData( "evententity" );
    for ( var i = 0; events != null && i < events.length; i++ )
    {
        var node = events[ i ];
        var id = getXMLValue( node, "@id" );
        
        var response = getXMLValue( responses, "/recordType/recordList/record[ activity='"+id+"' and attendee="+currentUser+"]/response");
        if ( response == null || response.toLowerCase() == 'declined' )
            continue;

        var record = new NLEvent( id, 'event', getXMLValue( node, "startdate" ), getXMLValue( node, "title" ), getXMLValue( node, "status" ) );
        record.startTime = getXMLValue( node, "starttime" );
        record.endTime = getXMLValue( node, "endtime" );
        record.endByDate = getXMLValue( node, "endbydate" );        
        record.timezone = getXMLValue( node, "timezone" );
        record.period = getXMLValue( node, "period" );
        record.frequency = getXMLValue( node, "frequency", "NONE" );
		record.recurrenceDOW = parseInt(getXMLValue( node, "recurrencedow" ));
		record.recurrenceDOWIM = parseInt(getXMLValue( node, "recurrencedowim" ));
		record.recurrenceDOWMask = getXMLValue( node, "recurrencedowmask" );
		record.location = getXMLValue( node, "location" );
        record.message = getXMLValue( node, "message" );
        record.isTimed = getXMLBoolean( node, "timedevent" );
        record.response = response.toLowerCase();
        recordList[ recordList.length ] = record;
    }

    var tasks = getXMLList( getRecordTypeData( "task" ), "/recordType/recordList/record[@perm > 0 and assigned="+currentUser+"]" );
    for ( var i = 0; tasks != null && i < tasks.length; i++ )
    {
        var node = tasks[ i ];
        var record = new NLEvent( getXMLValue( node, "@id" ), 'task', getXMLValue( node, "startdate" ), getXMLValue( node, "title" ), getXMLValue( node, "status" ) );
        record.startTime = getXMLValue( node, "starttime" );
        record.endTime = getXMLValue( node, "endtime" );
        record.timezone = getXMLValue( node, "timezone" );
        record.message = getXMLValue( node, "message" );
        record.isTimed = getXMLBoolean( node, "timedevent" );
        record.response = "accepted";
        recordList[ recordList.length ] = record;
    }

	var calls = getXMLList( getRecordTypeData( "call" ), "/recordType/recordList/record[@perm > 0 and assigned="+currentUser+"]" );
    for ( var i = 0; calls != null && i < calls.length; i++ )
    {
        var node = calls[ i ];
        var record = new NLEvent( getXMLValue( node, "@id" ), 'call', getXMLValue( node, "startdate" ), getXMLValue( node, "title" ), getXMLValue( node, "status" ) );
        record.startTime = getXMLValue( node, "starttime" );
        record.endTime = getXMLValue( node, "endtime" );
        record.timezone = getXMLValue( node, "timezone" );
        record.message = getXMLValue( node, "message" );
        record.isTimed = getXMLBoolean( node, "timedevent" );
        record.response = "accepted";
        recordList[ recordList.length ] = record;
    }

    recordList.sort( NLCalendar_startDateComparator );
    return recordList;
}

function buildDetailCalendar( date, view )
{

    date = stringtodate(getdatestring(date));

	var titleBar = '';
	var mainCalendar = '';
    var eventList = NLCalendar_getAllEvents();
	var titleFontColor = 'FFFFFF';
	var calendarDom = document.getElementById(getCalendarDetailPortletId());
	if ( view.toLowerCase() == 'week' )
	{
		var dateStartOfWeek = NLDate_cloneDate( date );
		dateStartOfWeek.setDate( date.getDate() - getFirstDayOfWeekOffSet( date ) );
		var dateEndOfWeek = NLDate_cloneDate( date );
		dateEndOfWeek.setDate( date.getDate() + getLastDayOfWeekOffSet( date ) );

		var titleBarDateLabel = NLDate_months[dateStartOfWeek.getMonth()] + " " + dateStartOfWeek.getDate() + " - " + dateEndOfWeek.getDate() + ", "+dateEndOfWeek.getYear();
		if ( dateEndOfWeek.getYear() != dateStartOfWeek.getYear() )
			titleBarDateLabel = NLDate_months[dateStartOfWeek.getMonth()] + " " + dateStartOfWeek.getDate() + ", "+dateStartOfWeek.getYear() + " - "+ NLDate_months[dateEndOfWeek.getMonth()] + " " + dateEndOfWeek.getDate() + ", "+dateEndOfWeek.getYear() ;
		else if ( dateEndOfWeek.getMonth() != dateStartOfWeek.getMonth() )
			titleBarDateLabel = NLDate_months[dateStartOfWeek.getMonth()] + " " + dateStartOfWeek.getDate() + " - "+ NLDate_months[dateEndOfWeek.getMonth()] + " " + dateEndOfWeek.getDate() + ", "+dateEndOfWeek.getYear() ;

		titleBar = "<table cellspacing='0' cellpadding='0' width='100%' style='margin-bottom: 0px;' class='noprint'>"+
						"<tr>"+
							"<td class='smalltextb' width='5%'>&nbsp;</td>"+
							"<td class='smalltextb' style='text-align: center; white-space: nowrap;' width='90%'><a class='iArrowLeft' href='javascript:prevweek()'></a><font color='"+titleFontColor+"'>"+titleBarDateLabel+"</font><a class='iArrowRight' href='javascript:nextweek()'></a></td>"+
							"<td class='smalltextb' width='5%' align='right'>&nbsp;</td>"+
						"</tr>"+
					"</table>";

		mainCalendar += "<table cellspacing='0' cellpadding='1' width='100%' border='0'>";
			mainCalendar += "<tbody>";

		var workingDate = NLDate_cloneDate( dateStartOfWeek );
		for ( var i = 0; i < 7; i++ )
		{
			var newEventScript = "newEvent('"+(workingDate.getMonth()+1)+"/"+workingDate.getDate()+"/"+workingDate.getYear()+"'); return false"
			var pickDateScript = "pickdate('"+(workingDate.getMonth()+1)+"/"+workingDate.getDate()+"/"+workingDate.getYear()+"'); return false";
			mainCalendar +=	"<tr><td class='portlettext portlet' style='padding: 2px 5px'><a href='#' onclick=\""+pickDateScript+"\" class='textbold'><font color='"+titleFontColor+"'>"+getLongDate( workingDate, true )+"</font></a></td><td class='portlettext portlet' align='center' style='padding: 2px 5px' width='1%'> <a href='#' onclick=\""+newEventScript+"\" class='textboldnolink'><img border='0' src='/images/nav/calendar/newevent.gif' alt='New Event' class='noprint'></a></td></tr>";

            var eventsOnDateList = NLCalendar_getEventsOnDate( eventList, workingDate );
            for ( var j = 0; j < eventsOnDateList.length; j++ )
                mainCalendar += "<tr>" + eventsOnDateList[ j ].getWeeklyCalendarCell() + "</tr>";
			workingDate.setDate( workingDate.getDate() + 1 );
		}
			mainCalendar += "</tbody>";
		mainCalendar += "</table>";
	}
	else if ( view.toLowerCase() == 'month' )
	{
		var titleBarDateLabel = NLDate_months[date.getMonth()] + " " +date.getYear();
		titleBar = "<table cellspacing='0' cellpadding='0' width='100%' style='margin-bottom: 0px;' class='noprint'>"+
						"<tbody>"+
							"<tr class='portletlabel'>"+
								"<td class='smalltextb' width='5%'>&nbsp;</td>"+
								"<td class='smalltextb' style='text-align: center; white-space: nowrap;' width='90%'><a class='iArrowLeft' href='javascript:prevmonth()'></a>"+titleBarDateLabel+"<a class='iArrowRight' href='javascript:nextmonth()'></a></td>"+
								"<td class='smalltextb' width='5%' align='right'>&nbsp;</td>"+
							"</tr>"+
						"</tbody>"+
					"</table>";

		var dateStartOfMonth = NLDate_cloneDate( date );
		dateStartOfMonth.setDate( 1 );
		dateStartOfMonth.setDate( dateStartOfMonth.getDate() - getFirstDayOfWeekOffSet( dateStartOfMonth ) );
		var dateEndOfMonth = NLDate_cloneDate( date );
		dateEndOfMonth.setDate( NLDate_getLastDayOfMonth( date ) );
		dateEndOfMonth.setDate( dateEndOfMonth.getDate() + getLastDayOfWeekOffSet( dateEndOfMonth )  );

		var workingDate = NLDate_cloneDate( dateStartOfMonth );
		mainCalendar += "<table cellspacing='0' cellpadding='0' width='100%' border='0'><tbody>";
		mainCalendar +=     "<tr>";
		for ( var i = 0; i < 7; i++ )
		{
			mainCalendar += "<td height='100%' class='smalltextb' style='background-color:#DDDDDD' width='14%' colspan='2'>"+NLDate_short_days[ workingDate.getDay() ]+"</td>";
			mainCalendar += (i == 6) ? "" : "<td bgcolor='#929DAD' width='1'><img height='1' src='/images/nav/calendar/x.gif' width='1'></td>";
			workingDate.setDate( workingDate.getDate() + 1 );
		}
		mainCalendar +=     "</tr>";

		workingDate = NLDate_cloneDate( dateStartOfMonth );
		var dateStartOfWeek = NLDate_cloneDate( workingDate );
		while ( workingDate < dateEndOfMonth )
		{
			mainCalendar +=	"<tr>";
			for ( var j = 0; j < 7; j++ )
			{
				var pickDateScript = "pickdate('"+(workingDate.getMonth()+1)+"/"+workingDate.getDate()+"/"+workingDate.getYear()+"'); return false";
				var newEventScript = "newEvent('"+(workingDate.getMonth()+1)+"/"+workingDate.getDate()+"/"+workingDate.getYear()+"'); return false";
				var datePickerClass = workingDate.getMonth() != date.getMonth() ? "text" : "textbold";
				var cellClass = workingDate.getMonth() != date.getMonth() ? "smalltext portlet" : "smalltext bglt";
				mainCalendar += "<td class='"+cellClass+"' style='text-align=left; font-size: 12pt;'><font style='margin:0 2px'><a href='#' onclick=\""+pickDateScript+"\" class='"+datePickerClass+"'>"+workingDate.getDate()+"</a></font></td>"+
								"<td class='"+cellClass+"' style='text-align=right;' align='right'><font style='margin:0 2px'><a href='#' class=\"iCalNewEvent\" onclick=\""+newEventScript+"\" title=\"New Event\"></a></font></td>"+
								(j < 6 ? "<td bgcolor='#929DAD' width='1'><img height='1' src='/images/nav/calendar/x.gif' width='1'></td>" : "");
				workingDate.setDate( workingDate.getDate() + 1 );
			}
			mainCalendar += "</tr>";

			workingDate = NLDate_cloneDate( dateStartOfWeek );
			mainCalendar +=	"<tr height='50'>";
			for ( var j = 0; j < 7; j++ )
			{
				var cellClass = workingDate.getMonth() != date.getMonth() ? "smalltext portlet" : "smalltext bglt";
                var eventsOnDateList = NLCalendar_getEventsOnDate( eventList, workingDate );
                if ( eventsOnDateList.length == 0 )
				    mainCalendar += "<td class='"+cellClass+"' colspan='2' style='text-align:left; vertical-align:top'>&nbsp;</td>";
                else
                {
				    mainCalendar += "<td class='"+cellClass+"' colspan='2' style='text-align:left; vertical-align:top'><ul style='margin:0 0 0 4px; padding:0 2px 0 14px'>";
                    for ( var k = 0; k < eventsOnDateList.length; k++ )
                        mainCalendar += "<LI style='padding:0;margin:0'>" + eventsOnDateList[ k ].getMonthlyCalendarCell() + "</LI>";
				    mainCalendar += "</ul><BR>&nbsp;</td>";
                }
                mainCalendar +=	(j < 6 ? "<td bgcolor='#929DAD' width='1'><img height='1' src='/images/nav/calendar/x.gif' width='1'></td>" : "");
				workingDate.setDate( workingDate.getDate() + 1 );
			}
			mainCalendar += "</tr>";

			mainCalendar +=	"<tr>";
			for ( var j = 0; j < 20; j++ )
				mainCalendar += "<td bgcolor='#929DAD' width='1'><img height='1' src='/images/nav/calendar/x.gif' width='1'></td>";
			mainCalendar += "</tr>";

			dateStartOfWeek = NLDate_cloneDate( workingDate );
		}
		mainCalendar += "</tbody></table>";
	}
	else
	{
		var workingDate = NLDate_cloneDate( date );
		titleBar = "<table cellspacing='0' cellpadding='0' width='100%' style='margin-bottom: 0px;' class='noprint'>"+
						"<tbody>"+
							"<tr class='portletlabel'>"+
								"<td class='smalltextb' width='5%'>&nbsp;</td>"+
								"<td class='smalltextb' style='text-align: center' width='90%; white-space: nowrap;'><a class='iArrowLeft' href='javascript:prevday()'></a>"+ NLDate_days[ workingDate.getDay() ] + " " +getLongDate( workingDate )+ "<a class='iArrowRight' href='javascript:nextday()'></a></td>"+
								"<td class='smalltextb' width='5%' align='right'>&nbsp;</td>"+
							"</tr>"+
						"</tbody>"+
					"</table>";

        mainCalendar += "<table cellspacing='0' cellpadding='0' width='100%' border=0><tbody>";
		
        var startHour = 8;
        var endHour = 18;
        var periodSize = 30;

		var eventsOnDateList = NLCalendar_getEventsOnDate( eventList, workingDate, 'timed' );
        var maxEventsInPeriod = NLCalendar_getMaxEventsInPeriod( eventsOnDateList, workingDate, periodSize );
		var untimedEventsList = NLCalendar_getEventsOnDate( eventList, workingDate, 'untimed' );
		for ( var j = 0; j < untimedEventsList.length; j++ )
		{
			mainCalendar +=	"<tr>";
				mainCalendar += "<td class='texttablert' hd wrap='true' colspan='1' width='5%'>&nbsp;</td>";
				mainCalendar += untimedEventsList[ j ].getDailyCalendarCell( maxEventsInPeriod );
			mainCalendar += "</tr>";
		}

		workingDate.setHours( startHour );
		var dateEndOfDay = NLDate_cloneDate( workingDate );
		dateEndOfDay.setHours( endHour );
		while ( workingDate < dateEndOfDay )
		{
			var hhmmtime = workingDate.getHours()*100 + workingDate.getMinutes();
			var varTime = (workingDate.getHours()%12 == 0 ? "12" : workingDate.getHours()%12) + ":" + (workingDate.getMinutes() == 0 ? "00" : workingDate.getMinutes());
			var newEventScript = "newEvent('"+(workingDate.getMonth()+1)+"/"+workingDate.getDate()+"/"+workingDate.getYear()+"','"+hhmmtime+"'); return false";
			mainCalendar +=	"<tr>";
			mainCalendar +=     "<td class='texttablert' hd wrap='true' colspan='1' width='5%'><a href='#' onclick=\""+newEventScript+"\" class='text'>"+varTime+"</a></td>";

			if ( maxEventsInPeriod == 0 )
                mainCalendar += "<td class='texttable'>&nbsp;</td>";
			else
			{
                var eventsStartInPeriod = NLCalendar_getEventsStartInPeriod( eventsOnDateList, workingDate, periodSize );
                if ( eventsStartInPeriod.length > 0 )
                    for ( var i = 0; i < eventsStartInPeriod.length; i++ )
                        mainCalendar += eventsStartInPeriod[ i ].getDailyCalendarCell();
                var eventsInPeriod = NLCalendar_getEventsInPeriod( eventsOnDateList, workingDate, periodSize ).length;
                if ( (maxEventsInPeriod-eventsInPeriod) > 0 )
                    mainCalendar +=     "<td class='texttable' colspan='"+(maxEventsInPeriod-eventsInPeriod)+"'>&nbsp;</td>";
            }
			mainCalendar += "</tr>";
			workingDate.setMinutes( workingDate.getMinutes() + periodSize );
		}
		mainCalendar += "</tbody></table>";
	}

	var legendBar = "<tr><td colspan='3' nowrap='true' class='smalltext' align='center'><table style='PADDING-RIGHT: 5px; PADDING-TOP: 5px' cellspacing='0' border='0' cellpadding='0'><tr>"+
						"<td class='smalltext'><img border='0' class='iAccepted' src='/images/nav/ns_x.gif' alt='Event Accepted' width='17' height='15'></td><td class='smalltext'>Accepted&nbsp;</td>"+
						"<td class='smalltext'><img border='0' class='iTentative' src='/images/nav/ns_x.gif' alt='Event Tentative' width='15' height='15'></td><td class='smalltext'>Tentative/ No response&nbsp;</td>"+
						"<td class='smalltext'><img border='0' class='iCancelled' src='/images/nav/ns_x.gif' alt='Event Canceled' width='15' height='15'></td><td class='smalltext'>Cancelled&nbsp;</td>"+
					"</tr></table></td></tr>";
	mainCalendar = "<table width='100%' border='0' cellspacing='0' cellpadding='0'><tr><td colspan='3'>"+mainCalendar+"</td></tr>" + legendBar + "</table>";

	var html = "";
	html += "<table width='100%' border='0' cellspacing='0' cellpadding='0' style='margin-bottom: 10px;'>";
		html += "<tr class='portletlabel'>";
			html += "<td style='border:solid 1px #999999;' colspan='2'>"+titleBar+'</td>';
			html += "<td width='2' style='background-image:url(/images/icons/dashboard/portletelements/right_gradient.gif)'><img height='100%' width='2' border='0' src='/images/icons/dashboard/portletelements/right_gradient.gif'/></td>";
		html += "</tr>";
		html += "<tr>";
			html += "<td colspan='2' style='border-left:solid 1px #B7B7B7; border-right:solid 1px #B7B7B7; background-color:#FFFFFF;'>"+mainCalendar+'</td>';
			html += "<td width='2' style='background-image:url(/images/icons/dashboard/portletelements/right_gradient.gif)'><img height='100%' width='2' border='0' src='/images/icons/dashboard/portletelements/right_gradient.gif'/></td>";
		html += "</tr>";
		html += "<tr><td height='8' colspan='3'><table cellpadding='0' cellspacing='0' border='0' width='100%' height='9'><tr>"+
					"<td><div style='height:9px; width:7px'><img height='9' width='7' border='0' src='/images/icons/dashboard/portletelements/bottom_left.gif'/></div></td>"+
					"<td width='99%' valign='bottom' height='9'><div style='height:9'><img height='9' width='100%' border='0' src='/images/icons/dashboard/portletelements/lower_gradient.gif'/></div></td>"+
					"<td><div style='height:9px; width:9px'><img height='9' width='9' border='0' src='/images/icons/dashboard/portletelements/bottom_right.gif'/></div></td>"+
				"</tr></table></td></tr>";
	html += "</table>";

	calendarDom.innerHTML = html;
}
