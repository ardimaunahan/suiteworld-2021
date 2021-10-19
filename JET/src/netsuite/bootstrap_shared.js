(function ()
{
    /* NetSuite Javascript Object Marker */
    function NetSuiteObject() {}

    Object.freeze(NetSuiteObject);

    //inheritance
    var debuggable = new NetSuiteObject();
    var error = Object.create(Error.prototype);
    debuggable.prototype = error;
    SuiteScriptModuleLoaderError.prototype = debuggable;
    SuiteScriptModuleLoaderError.prototype.constructor = SuiteScriptModuleLoaderError;

    /**
     *
     * We can't use RJS / Module Loader to import SuiteScriptError (or anything else) when we're handling a module loading error,
     * because this causes recursion. We need a custom error class that can be used without importing any other dependecies.
     *
     * @param delegate
     * @constructor
     */
    function SuiteScriptModuleLoaderError(delegate)
    {
        var that = this;
        that.TYPE = 'error.SuiteScriptModuleLoaderError';

        var createError = function createError(origError)
        {
            if (typeof apiBridge !== 'undefined' && apiBridge != null && apiBridge.theImpl != null)
                return apiBridge.theImpl.nlapiCreateError(origError);
            else
                return nlapiCreateError(origError);
        };

        function javaArrayToJsArray(javaArray)
        {
        	var toRet = [];
        	for(var i = 0; javaArray && i < javaArray.length; i++)
        		toRet[i] = javaArray[i];

        	return toRet;
        }

        /**
         * @name SuiteScriptModuleLoaderError#id
         * @type string
         * @readonly
         * @since 2015.2
         */
        Object.defineProperty(that, 'id', {
            get: function ()
            {
                return (delegate.getId) ? delegate.getId() : null;
            },
            set: function (val)
            {
                throw new SuiteScriptModuleLoaderError(createError('READ_ONLY_PROPERTY', 'Read-only property: id.', false));
            },
            enumerable: true,
            configurable: false,
            writeable: false
        });

        /**
         * @name SuiteScriptModuleLoaderError#name
         * @type string
         * @readonly
         * @since 2015.2
         */
        Object.defineProperty(that, 'name', {
            get: function ()
            {
                return delegate.name || delegate.getCode() || '';
            },
            set: function (val)
            {
                throw new SuiteScriptModuleLoaderError(createError('READ_ONLY_PROPERTY', 'Read-only property: name.', false));
            },
            enumerable: true,
            configurable: false,
            writeable: false
        });

        /**
         * @name SuiteScriptModuleLoaderError#message
         * @type string
         * @readonly
         * @since 2015.2
         */
        Object.defineProperty(that, 'message', {
            get: function ()
            {
                return delegate.message || delegate.getDetails() || '';
            },
            set: function (val)
            {
                throw new SuiteScriptModuleLoaderError(createError('READ_ONLY_PROPERTY', 'Read-only property: message.', false));
            },
            enumerable: true,
            configurable: false,
            writeable: false
        });

        /**
         * @name SuiteScriptModuleLoaderError#stack
         * @type string[]
         * @readonly
         * @since 2015.2
         */
        Object.defineProperty(that, 'stack', {
            get: function ()
            {
                return (delegate.stack) ? delegate.stack.slice(0) : (delegate.getStackTrace) ? javaArrayToJsArray(delegate.getStackTrace()) : [];
            },
            //'stack' must be settable in order to wrap a JS error with a SuiteScript error
            enumerable: true,
            configurable: false,
            writeable: false
        });

        // Functions for debugger
        this.toJSON = function toJSON()
        {
            return {
                type: 'error.SuiteScriptModuleLoaderError',
                name: that.name,
                message: that.message,
                stack: that.stack
            };
        };

        this.toString = function toString()
        {
            return JSON.stringify(that);
        };

    }

    /**
     * @memberof util
     * @name util.each
     *
     * @param {Object|Array} iterable
     * @param {Function} callback
     * @returns {Object|Array} iterable - original collection
     */
    function each(obj, callback)
    {
        if (!obj)
            return obj;

        var length = obj.length;
        //is object has a length, treat it as an Array, allows for iterating array-like objects like "arguments"
        if (length === +length)
            for (var i = 0; i < length; i++)
                callback(obj[i], i, obj);
        // Treat as an object/map, allows plain or custom objects to be iterated
        else
            for (var k in obj)
                if (obj.hasOwnProperty(k))
                    callback(obj[k], k, obj);

        return obj;
    };

	function getGlobalScope()
	{
		return (function () {return this;}());
	}

    /**
     * @memberof util
     * @name util.extend
     *
     * @param {Object} receiver
     * @param {Object} contributor
     * @returns {Object} receiver
     */
	function extend(receiver, contributor)
	{
		for (var key in contributor)
			if (contributor.hasOwnProperty(key))
				receiver[key] = contributor[key];
		return receiver;
	}

	function deepFreeze(obj)
	{
		Object.freeze(obj);
		for (var p in obj)
		{
			//noinspection JSUnfilteredForInLoop
			if (!obj.hasOwnProperty(p) || !(typeof obj[p] === "object") || Object.isFrozen(obj[p]))
				continue;
			//noinspection JSUnfilteredForInLoop
			deepFreeze(obj[p]);
		}
	}


    /* adapted from jQuery isPlainObject */
    var plainObjectInstance = {};

    /**
     * Determines if a variable refers to an instance of Object.prototype (aka "Plain Object" aka {})
     *
     * @memberof util
     * @name util.isObject
     *
     * @param {*} obj
     * @returns {boolean}
     */
    function isObject(obj)
    {
        // Not plain objects:
        // - Any object or value whose internal [[Class]] property is not "[object Object]"
        // - window
        if (type(obj) !== "object" || isWindow(obj))
        {
            return false;
        }

        if (obj.constructor && !plainObjectInstance.hasOwnProperty.call(obj.constructor.prototype, "isPrototypeOf"))
        {
            return false;
        }

        // If the function hasn't returned already, we're confident that
        // |obj| is a plain object, created by {} or constructed with new Object
        return true;
    }

    function isWindow(obj)
    {
        return obj != null && obj.hasOwnProperty('window') && obj === obj.window;
    }

    function type(obj)
    {
        if (obj == null)
        {
            return obj + "";
        }
        // Support: Android<4.0, iOS<6 (functionish RegExp)
        return typeof obj === "object" || typeof obj === "function" ?
               plainObjectInstance[Object.prototype.toString.call(obj)] || "object" :
               typeof obj;
    }

    /**
     * Determines if a variable refers to a Function
     *
     * @memberof util
     * @name util.isFunction
     *
     * @param {*} obj
     * @returns {boolean}
     */
    function isFunction(obj)
	{
		return Object.prototype.toString.call(obj) === '[object Function]';
	}

    /**
     *  Determines if a variable refers to an Array
     *
     * @memberof util
     * @name util.isArray
     *
     * @param {*} obj
     * @returns {boolean}
     */
	var isArray = Array.isArray; //native in ECMAScript 1.5

    /**
     * Determines if a variable refers to a boolean
     *
     * @memberof util
     * @name util.isBoolean
     *
     * @param {*} obj
     * @returns {boolean}
     */
    function isBoolean(obj)
	{
		return obj === true || obj === false || Object.prototype.toString.call(obj) === '[object Boolean]';
	}

    /**
     * Determines if a variable refers to a string
     *
     * @memberof util
     * @name util.isString
     *
     * @param {*} obj
     * @returns {boolean}
     */
	function isString(obj)
	{
		return Object.prototype.toString.call(obj) === '[object String]';
	}

    /**
     * Determines if a variable refers to a number
     *
     * @memberof util
     * @name util.isNumber
     *
     * @param obj
     * @returns {boolean}
     */
	function isNumber(obj)
	{
		return Object.prototype.toString.call(obj) === '[object Number]';
	}

    /**
     *
     * Determines if a variable refers to a Date
     *
     * @memberof util
     * @name util.isDate
     *
     * @param obj
     * @returns {boolean}
     */
	function isDate(obj)
	{
		return Object.prototype.toString.call(obj) === '[object Date]';
	}

    /**
     * Determines if a variable refers to a RegExp
     *
     * @memberof util
     * @name util.isRegExp
     *
     * @param obj
     * @returns {boolean}
     */
	function isRegExp(obj)
	{
		return Object.prototype.toString.call(obj) === '[object RegExp]';
	}

	/**
     * Determines if a variable refers to an Error
     *
     * @memberof util
     * @name util.isError
     *
     * @param obj
     * @returns {boolean}
     */
	function isError(obj)
	{
		return Object.prototype.toString.call(obj) === '[object Error]';
	}

	function returnEmptyIfNull(str)
	{
		return str != null ? str : "";
	}

	/* String Util */
	/**
	 * check if the value is empty
	 * @param val String being tested for whether it is empty (null or "")
	 * @originalFrom NLRecordUtil.js
	 */
	function isValEmpty(val)
	{
		if (val === null || val === undefined)
			return true;

		val = String(val);
		return (val.length === 0) || !/\S/.test(val);
	}

	/**
	 * Remove leading and trailing whitespace from a string
     *
     * @memberof util
     * @name util.trim
     *
     * @param {string} str String to have leading/trailing whitespace extracted
	 */
	function trim(str)
	{
        str = '' + str;
        return str.replace(/^\s+/, "").replace(/\s+$/, "");
	}

	//TODO rename everywhere should be areArrayElements, does not assert (i.e. throw exception)
	/**
	 * @alias nsapiEveryElementIs
	 */
	/*----- Check if array argument is asserted true by 'func' -----*/
	function assertArrayElement(array, func)
	{
		if (!isArray(array))
			return false;
		for (var i = 0; i < array.length; ++i)
		{
			if (!func(array[i]))
				return false;
		}
		return true;
	}

	/*----- Check if array argument is all same instance type -----*/
	function areArrayElementsOfSameType(array, type)
	{
		if (!isArray(array))
			return false;
		for (var i = 0; i < array.length; i++)
			if (!isElementSameType(array[i], type))
				return false;
		return true;
	}

	/*----- Check if array argument is all same instance type -----*/
	function assertArrayElementsOfSameType(array, type, argName, errorCode)
	{
		if (!isArray(array))
			return;
		for (var i = 0; i < array.length; i++)
			assertTrue(isElementSameType(array[i], type), errorCode || 'SSS_INVALID_ARRAY_ARGUMENT', argName + '[' + i + ']');

	}

	function isElementSameType(element, type)
	{
		return (element || element === 0) &&
			   ((type === Object(type) && element instanceof type) ||
				typeof element === type ||
				(element.constructor && element.constructor.name && element.constructor.name === type));
	}

	/* Array utilities */
	function arrayIndexOf(array, val, ignorecase)
	{
		for (var i = 0; array && i < array.length; i++)
			if (val === array[i] || (ignorecase && val && array[i] && val.toLowerCase() === array[i].toLowerCase()))
				return i;
		return -1;
	}

	function arrayContains(array, val)
	{
		return arrayIndexOf(array, val) >= 0;
	}

	function arrayAdd(array, val)
	{
		if (!arrayContains(array, val))
			array.push(val);
	}

	function arrayRemove(array, val)
	{
		var newarray = [];
		for (var i = 0; i < array.length; i++)
			if (val !== array[i])
				newarray.push(array[i]);
		return newarray;
	}

	function arrayRemoveEmptyAndNull(array)
	{
		var newarray = [];
		for (var i = 0; i < array.length; i++)
			if (!isValEmpty(array[i]))
				newarray.push(array[i]);
		return newarray;
	}

	function arrayRemoveDuplcate(array)
	{
		var newarray = [];
		for (var i = 0; i < array.length; i++)
			if (newarray.indexOf(array[i]) == -1)
				newarray.push(array[i]);
		return newarray;
	}

	/**
	 * @alias nsapiMap
	 */
	function arrayToMap(array, func)
	{
		var result = [];
		for (var i = 0; i < array.length; ++i)
		{
			result.push(func(array[i]));
		}
		return result;
	}

	/**
	 * @alias nsapiInstanceOf
	 */
	function instanceOf(obj, typeName)
	{
		if (typeof obj === 'undefined' || obj === null)
			return false;
		var rep = Object.prototype.toString.call(obj);
		if (rep.slice(8, -1) === typeName)
			return true;
		if (typeof obj.constructor === 'undefined')
			return false;
		if (typeof obj.constructor.name !== 'undefined')
			return obj.constructor.name === typeName;
		var m = /^function ([^( ]+)/.exec(obj.constructor.toString());
		return !!(m && m[1] == typeName);
	}

	function addParameterToMap(map, params)
	{
        if (!map)
			map = {};

        for (var key in params)
		{
            if (params.hasOwnProperty(key))
				map[key] = params[key];
		}

		return map;
	}

	/**
	 * Search Util
	 */
	function unmarshalArray(payloadMap, prefix, unmarshalFunction)
	{
		var array = [];
		var count = payloadMap[prefix + 'count']; // TODO : investigate if count is used elsewhere
		for (var i = 0; i < count; ++i)
		{
			var attributeMap = payloadMap[prefix + i];
			var obj = unmarshalFunction(attributeMap);
			array.push(obj);
		}
		return array;
	}

	function assertTrue(expression, errorCode, errorMessage)
	{
		if (!expression)
			throw nlapi.createError(errorCode, errorMessage);
	}

	function checkArgs(funcArgs, funcArgNames, funcName)
	{
		for (var i = 0; i < funcArgs.length; i++)
			if (!funcArgs[i] && funcArgs[i] !== 0)
				throw nlapiCreateError('SSS_MISSING_REQD_ARGUMENT', (funcName ? funcName + ': ' : '') + 'Missing a required argument: ' + funcArgNames[i]);
	}

	/*----- return stacktrace as a string, e.g. debugAlert(stacktrace()) -----*/
	function printStacktrace()
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
			if (typeof a.arguments[i] === "undefined")
				s += '\'undefined\'';
			else if (typeof a.arguments[i] === "string")
				s += "'" + a.arguments[i].toString() + "'";
			else if (!a.arguments[i])
				s += "null";
			else
				s += a.arguments[i].toString();
			if (i < a.arguments.length - 1)
				s += ",";
		}
		s += "}";
		return s;
	}

	function	getFuncName(f)
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
			s = s.match(/function[^{]*/)[0];

		if (!s || s.length === 0)
			return "anonymous \n";
		return s;
	}

	/* shallow clone */
	function cloneObject(obj)
	{
		if (!isObject(obj))
			return obj;
		if (isArray(obj))
			return obj.slice();
		return extend({}, obj);
	}

	function extractDelegates(array, type)
	{
		return (array && array.map)
				? array.map(function (el, idx, arr)
							{
								return (el instanceof type) ? el.getDelegate() : el;
							})
				: null;
	}

	function normalizeArrayOrSingularObjectArg(arg)
	{
		return isArray(arg) ? arg : arg != undefined ? [arg] : null;
	}

	/* leak nlapi to global scope */
	var global = getGlobalScope();
	global.nlapi = global.nlapi || {};
	var nlapi = global.nlapi;

	/* declare nlapi namespace */
	nlapi.obj = nlapi.obj || {};
    nlapi.obj.SuiteScriptModuleLoaderError = nlapi.obj.SuiteScriptModuleLoaderError || SuiteScriptModuleLoaderError;

	/* export nlapi module to CommonJS environment if available */
	if (typeof exports !== 'undefined')
	{
		//noinspection JSUnresolvedVariable
		if (typeof module !== 'undefined' && module.exports)
		{
			//noinspection JSUnresolvedVariable
			exports = module.exports = nlapi;
		}
		exports.nlapi = nlapi;
	}

    var namesOfDefinedModules = [];

    function addModuleNameToDefineModuleList(name)
    {
        namesOfDefinedModules.push(name);
    }
    function isModuleNameAlreadyDefined(name)
    {
        return namesOfDefinedModules.indexOf(name) >= 0;
    }

    // No op version of doing the log execution
    // This will be ovewritten in the client
    // and server bootstrap files.
    function doLogExecution(levelIdx, title, details)
    {

    }

    /**
     * SuiteScript 2.0 util global object
     *
     * @namespace
     * @global
     * @name util
     * @type {Object}
     *
     * TODO giveBack()
     */
    var globalUtilPkg = {

        each: each,
        extend: extend,
        isObject: isObject,
        isFunction: isFunction,
        isArray: isArray,
        isBoolean: isBoolean,
        isString: isString,
        isNumber: isNumber,
        isDate: isDate,
        isRegExp: isRegExp,
	    isError : isError,
        trim: trim
    };

    global.util = globalUtilPkg;

	var globalLogPkg = (function ()
	{

		var LOG_LEVELS = ['DEBUG', 'AUDIT', 'ERROR', 'EMERGENCY'];
		var logFunction = function(levelIdx, title, details){};

		function setLogFunction(fn)
		{
			logFunction = fn;
			delete logUtil.setLogFunction;
		}

		function shouldSerialize(value)
		{
			return (value || value === false || value === 0)
				   && !util.isString(value)
				   && (!(value instanceof Error)
					   || (value instanceof Error && (value.toString() === 'error.SuiteScriptError')
					   || value.toString() === 'error.UserEventError'));
		}

		function logExecution(levelIdx, title, details)
		{

			// If the details are not a string, then serialze them
			if (shouldSerialize(title))
				title = JSON.stringify(title);
			if (shouldSerialize(details))
				details = JSON.stringify(details);
			logFunction(levelIdx, title, details);

		}

		function getFlatArgs(title, details) {
			var theTitle;
			var theDetails;
			if (title !== undefined && title !== null && title.hasOwnProperty('title')) {
				theTitle = title.title;
				theDetails = title.details;
			}
			else {
				theTitle = title;
				theDetails = details;

			}
			return {'title' : theTitle, 'details' : theDetails };
		}

		function debug(title, details)
		{
			var args = getFlatArgs(title, details);
			logExecution(0, args.title, args.details);
		}

		function audit(title, details)
		{
			var args = getFlatArgs(title, details);
			logExecution(1, args.title, args.details);
		}


		function error(title, details)
		{
			var args = getFlatArgs(title, details);
			logExecution(2, args.title, args.details);
		}


		function emergency(title, details)
		{
			var args = getFlatArgs(title, details);
			logExecution(3, args.title, args.details);
		}

		/**
		 * SuiteScript log global object
		 * @namespace
		 * @global
		 * @name log
		 * @type {Object}
		 */
		var logUtil = {
						 /**
						  * Log a debug statement into the Script Execution Log
						  *
						  * @memberof log
						  * @name log.debug
						  * @param {string} title
						  * @param details
						  */
						 debug: debug,

						 /**
						  * Log an audit statement into the Script Execution Log
						  *
						  * @memberof log
						  * @name log.audit
						  * @param {string} title
						  * @param details
						  */
						 audit: audit,
						 /**
						  * Log an error statement into the Script Execution Log
						  *
						  * @memberof log
						  * @name log.error
						  * @param {string} title
						  * @param details
						  */
						 error: error,
						 /**
						  * Log an emergency statement into the Script Execution Log
						  *
						  * @memberof log
						  * @name log.emergency
						  * @param {string} title
						  * @param details
						  */
						 emergency: emergency,
						 setLogFunction: setLogFunction,
						 LOG_LEVELS : LOG_LEVELS
					 };

		return logUtil;
	})();

	global.log = globalLogPkg;
}());
