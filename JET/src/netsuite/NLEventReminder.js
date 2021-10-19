



// <script type="text/javascript">

var isIE = document.all ? true : false;
var isNS = document.addEventListener ? true : false;
var alreadySeen;  
var snoozers = {};  
var reminderArray = {};

var SEEN_COOKIE = "alreadySeen";
var SNOOZE_COOKIE = "snooze";
var testMode = false;

function getCookie(name)
{
  var dc = document.cookie;
  var prefix = name + "=";
  var begin = dc.indexOf("; " + prefix);
  if (begin == -1) {
    begin = dc.indexOf(prefix);
    if (begin != 0)
      return null;
  } else
    begin += 2 + prefix.length;
  var end = document.cookie.indexOf(";", begin);
  if (end == -1)
    end = dc.length;
  return unescape(dc.substring(begin, end));
}

function setCookie(name, value, expires, path, domain, secure)
{

  if (value == "")
  {
  	value = null;
  	expires = new Date();
  }

  var curCookie = name + "=" + escape(value) +
      ((expires) ? "; expires=" + expires.toGMTString() : "") +
      ((path) ? "; path=" + path : "") +
      ((domain) ? "; domain=" + domain : "") +
      ((secure) ? "; secure" : "");
  document.cookie = curCookie;
}

function getParameter(parameterName)
{
	var queryString = document.location.href;
	var parameterName = parameterName + "=";
	if (!queryString.length)
	  return null;

	var begin = queryString.indexOf("&" + parameterName);
	if (begin == -1)
	  begin = queryString.indexOf("?" + parameterName);
	if ( begin != -1 )
	{
	  begin += parameterName.length;
	  var end = queryString.indexOf ("&", begin);
	  if (end == -1)
	    end = queryString.length;
	  return decodeURIComponent( queryString.substring(begin+1, end));
	}
	else  
	{
	  return null;
	}
}

function loadArraysFromCookies()
{
	alreadySeen = {};
	loadAssocArrayFromCookie(alreadySeen, SEEN_COOKIE);
	snoozers = {};
	loadAssocArrayFromCookie(snoozers, SNOOZE_COOKIE);
}

function loadAssocArrayFromCookie(newArray, cName)
{
	var str = getCookie(cName);
	if (str == null || str.length == 0)
		return;
	var arr = str.split(",");
	for (var i=0; i < arr.length; i++)
	{
		var inner = arr[i].split(":");
		if (inner.length > 1)
		{
			newArray[String(inner[0])] = inner[1];
		}
		else
			newArray[String(arr[i])] = true;
	}
}


function makeNewSeenCookie()
{
	var res = "";
	for (var i in window.reminderArray)
	{
		var id = String(window.reminderArray[i].id);
		if (alreadySeen[id])
		{
			if (res.length > 0)
				res += "," + id;
			else
				res = id;
		}
	}
	setCookieForTomorrow(SEEN_COOKIE, res);
}

function startSnoozers()
{
	var currentTime = (new Date()).getTime();
	for (var i in snoozers)
	{
		var goTime = Number(snoozers[i]);
		var rmdr = reminderArray[i];
		if (rmdr == null)
			continue; 
		if (currentTime > goTime)
			rmdr.displayEvent();
		else
		{
			window.setTimeout("window.reminderArray['"+i+"'].displayEvent();", goTime - currentTime);
		}
	}
}

function addToCookie(cName, val)
{
	var newVal = getCookie(cName);
	if ((newVal == null) || (newVal.length == 0))
		newVal = String(val);
	else
		newVal += "," + val;
	setCookieForTomorrow(cName, newVal);
}

function rebuildSnoozeCookie()
{
	var res = "";
	for (var i in window.snoozers)
	{
		if (reminderArray[i] == null)
			continue;
		var sep = "";
		if (res.length > 0)
			sep = ",";
		res += sep + i + ":" + window.snoozers[i];
	}
	setCookieForTomorrow(SNOOZE_COOKIE, res);
}

function setCookieForTomorrow(cName, newVal)
{
	var now = new Date();
	var tomorrow = new Date(1000 * 60 * 60 * 24 + now.getTime()); 
	setCookie(cName, newVal, tomorrow, "/");
}

function postLoadCallback()
{
	makeNewSeenCookie();
	startSnoozers();

	for (var i in window.reminderArray)
		window.reminderArray[i].go();
}

function NLEventReminder(id, message, time, aheadBoundary, behindBoundary, url)
{
	this.id = id;
	this.message = message;
	this.time = time;
	this.aheadBoundary = aheadBoundary;
	this.behindBoundary = behindBoundary;
	this.url = url;
	window.reminderArray[id] = this;
}

NLEventReminder.prototype.go = function()
{
	if (this.hasAlreadyBeenDisplayed())
		return;

	var d = (new Date()).getTime();
	if ((d > this.time + this.behindBoundary) && (testMode == false))
		return;  

	this.waitAndDisplay(this.time - d - this.aheadBoundary);
};

NLEventReminder.prototype.hasAlreadyBeenDisplayed = function()
{
	if (testMode)
		return false;
	else
		return alreadySeen[String(this.id)];
};

NLEventReminder.prototype.markEventDisplayed = function()
{
	alreadySeen[String(this.id)];
	addToCookie(SEEN_COOKIE, this.id);
	delete window.snoozers[String(this.id)];
	rebuildSnoozeCookie();
};

var popLeft = 30;
var popTop = 20;
NLEventReminder.prototype.displayEvent = function()
{
	var options = "height=200,width=350,resizable=no,toolbar=no,menubar=no,titlebar=no,alwaysRaised=yes,left="+popLeft+",top="+popTop;
	
	popLeft += 20;
	popTop += 20;
	var url = "/pages/crm/calendar/popupReminder.jsp?noload=T&msg="+encodeURIComponent(this.message)+"&id="+this.id+"&locale="+"en_US";
	if (this.url != null)
		url += "&url=" + encodeURIComponent(this.url);
	if (testMode)
		url += "&testMode=T";
	var win = window.open(url, "reminderWindow"+this.id, options);
    if (win != null)
		win.focus();
	this.markEventDisplayed();
};

NLEventReminder.prototype.waitAndDisplay = function(waitTime)
{
	if (waitTime < 0 || testMode)
		this.displayEvent();
	else
		setTimeout("window.reminderArray['"+this.id+"'].displayEvent();",waitTime);
};


function snoozer(win, time)
{
	try
	{
		var test = win.document.location;
	}
	catch (e)
	{
		alert("The reminder cannot snooze because the window that opened it has been closed.");
		return false;
	}

	var id = getParameter("id");
	if (id == null)
	{
		alert("Internal error.  The reminder cannot snooze." + window.document.location);
		return false;
	}

	var waitTime = time * 1000 * 60;
	if (testMode)
		waitTime /= 60; 
	var launchTime = waitTime + (new Date()).getTime();
	win.snoozers[id] = launchTime;
	addToCookie(SNOOZE_COOKIE, id + ":" + launchTime);
	win.setTimeout("window.reminderArray['"+id+"'].displayEvent();",waitTime);
	return true;
}

function init()
{
	if (getParameter("testMode") == "T")
		testMode = true;

	loadArraysFromCookies();
}

init();
