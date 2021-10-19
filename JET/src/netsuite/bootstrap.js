(function (nlapi)
{
    var callURL = '/app/common/scripting/ClientScriptHandler.nl?';
    var legacyCallURL = '/app/common/scripting/nlapijsonhandler.nl';
    var nlRequestId = 0;

    function getGlobalScope()
    {
        return (function () {return this;}());
    }

    (function (global)
    {
        var require = global.require;
        var old_define = global.define;
        var requirejs = global.requirejs;
        var log = global.log;
        var util = global.util;
        var SuiteScriptModuleLoaderError = global.nlapi.obj.SuiteScriptModuleLoaderError;
        delete global.nlapi.obj.SuiteScriptModuleLoaderError;
	    var debug = null;
        var toEmptyString = function ()
        {
            return '';
        };

        require.SSModuleLoader = {
            shouldWrapWithProxy: function (url)
            {
                return false;
            },

	        validateModuleAccessPermission: function(importedByModule, modulePath)
			{
				return;
            }

        };

        var namesOfDefinedModules = [];

        function addModuleNameToDefineModuleList(name)
        {
            namesOfDefinedModules.push(name);
        }
        function isModuleNameAlreadyDefined(name)
        {
            return namesOfDefinedModules.indexOf(name) >= 0;
        }

        function isApiPath(path)
        {
            return util.isString(path) && (path === "N" || path === "N.js" || path.indexOf("n/") === 0 || path.indexOf("N/") === 0 || path.indexOf("/.api/") === 0)
        }

        function isMacroModule(modulePath)
        {
            // _macro hold all macros definitions for current record
            var metadata = typeof global._macro !== 'undefined' && global._macro.macroMetadata || [];
            return metadata.some(function(v){ return v.modulePath === modulePath; });
        };

        function isFilePathLike(path)
        {
            return util.isString(path) && ( path.indexOf("/") >=0  || path ==="N" || path ==="N.js")
        }

        function stripApiPath(path)
        {
            if (path.length > 3 && path.lastIndexOf(".js") === path.length - 3)
                path = path.substr(0, path.length - 3);
            if (path.indexOf("N/") === 0)
                path = path.substr(2);
            else if (path.indexOf("/.api/") === 0)
                path = path.substr(6);
            return path;
        }

        function dependencyCheck(isDefine, args)
        {
            var allowInternal = isDefine || isApiPath(args[0]) || require.isInternal();
            var deps = Array.isArray(args[0]) ? args[0] : args[1];
            if (Array.isArray(deps))
            {
                for (var idx = 0; idx < deps.length; idx++)
                {
                    var dep = deps[idx];
                    if (!util.isString(dep) || !dep || (require.isDevOnlyModule(dep) && !debug) || (!allowInternal && isApiPath(dep) && require.isInternalModule(stripApiPath(dep)) && !(require.isDevOnlyModule(dep) && debug)))
                    {
	                    throwModuleLoaderError('INVALID_MODULE_DEPENDENCY_1', dep);
	                    return false;
                    }
                }
            }
            return true;
        }

        function throwModuleLoaderError(name, message)
        {
	        var translatedMessage = getModuleFromN('N/restricted/bridge').getErrorMessage(name, message);
	        throw new SuiteScriptModuleLoaderError({name: name, message: translatedMessage});
        }

        //Wrap AMD interfaces with proxies to avoid strict dependecy on RequireJS lib.
        global.require = function (deps, callback, errback, optional)
        {
            if (!dependencyCheck(false, Array.prototype.slice.call(arguments)))
            	return null;
            return require.call(global, deps, callback, errback, optional);
        };
        for (var p in require)
        {
            if (require.hasOwnProperty(p))
                global.require[p] = require[p];
        }

        global.require.toString = toEmptyString;
        var define = function (name, deps, callback)
        {
            if (!dependencyCheck(true, Array.prototype.slice.call(arguments)))
            	return;
            if (util.isString(name) && isModuleNameAlreadyDefined( name ) )
                throwModuleLoaderError('INVALID_DEFINE_CALL_DUPLICATE_MODULE_NAME', name);
            if (util.isString(name) &&  isFilePathLike(name) )
	            throwModuleLoaderError('INVALID_DEFINE_CALL', name);
            if (util.isString(name))
                addModuleNameToDefineModuleList(name) ;
            return old_define.call(global, name, deps, callback);
        };
        // minification will destroy the local overwrite of define. Need to ensure it stays intact.
        eval("var define = " + define);
        eval("define.amd =  old_define.amd");
        global.define.toString = toEmptyString;
        delete global.requirejs;
	    requirejs.config({
		    baseUrl: '',
		    paths: {},
		    map: {},
		    waitSeconds: 7,
		    nodeIdCompat: true // This causes module path with .js or without .js (i.e. /foo.js vs /foo) to be treated as the same
		                       // module.
	    });
        requirejs.onError = function (e)
        {
            throw e;
        };

        global.require.forceSync = function(setOn)
        {
            require.forceSync(setOn);
        };

	    global.require.isSync = function()
	    {
		    return require.isSync();
	    };

        global.require.setInternal = function(allow)
        {
            require.setInternal(allow);
        };

        global.require.isInternal = function()
        {
            return require.isInternal();
        };

        global.require.initDebug = function(isDebug)
        {
            if (debug == null && isDebug != null)
                debug = isDebug;
        };

        function checkAllLoaded()
        {
            var allModulesPresent = true;
            if (typeof(global._clientScriptContext) === 'undefined')
                return true;

            // Only check if done if the lengths of arrays match
            if (global.moduleKeeper.length === global._clientScriptContext.superScriptList.length)
            {
                for (var i = 0; i < global._clientScriptContext.superScriptList.length; i++)
                {
                    if (global.moduleKeeper[i] === undefined)
                    {
                        allModulesPresent = false;
                        break;
                    }
                }
                // freeze the moduleKeepr when all modules loaded
                if(Object.freeze && allModulesPresent)
                    Object.freeze(global.moduleKeeper);
            }
            else
            {
                allModulesPresent = false;
            }
            return allModulesPresent;
        }

	    var requireLoadDefaultImpl = require.load;

	    require.load = function (context, moduleName, url, predefinedApiModules)
	    {

		    function getParentPath(moduleName)
		    {
			    var path = null;
			    if(parentMap)
				    path = parentMap.url;

			    if(!checkAllLoaded() && global._clientScriptContext)
			    {
				    var modules = global._clientScriptContext.superScriptList;
				    for (var i = 0; i < modules.length; i++)
				    {
					    var clientModule = modules[i];
					    if(clientModule.scriptInfo === moduleName && clientModule.parentModulePath)
					    {
						    path = clientModule.parentModulePath;
						    break;
					    }
				    }
			    }

			    return path;
		    }

		    function loadCallback(responseObj)
		    {
			    var error;
			    //noinspection JSUnresolvedVariable
			    if (responseObj.hasOwnProperty("nlError") && responseObj.nlError)
			    {
				    error = Error(responseObj.details);
				    error.name = responseObj.code;
				    throw error;
			    }
			    else
			    {
				    var scriptInfo = (typeof responseObj === "string") ? JSON.parse(responseObj) : JSON.parse(responseObj.result);
				    if ((scriptInfo != null) && (scriptInfo.status === "OK"))
				    {
					    eval(scriptInfo.payload);
					    context.completeLoad(moduleName);
				    }
				    else
				    {
					    var parent = (!!parentMap) ? parentMap.id : "";
					    throwModuleLoaderError('INVALID_DEFINE_CALL', parent + ": " + scriptInfo.payload);
				    }
			    }
		    }

		    var DYNAMICALLY_GENERATED_2_0_MODULE_PATH_PREFIXES = Object.freeze(['N/FieldValidationHelper', 'N/environment']);

		    var parentMap = context.registry[moduleName].map.parentMap || null;
		    var method = "loadMedia";
		    var parentPath = getParentPath(moduleName);
		    var recordType = global.nlapiGetRecordType ? global.nlapiGetRecordType() : null;
		    var pageMode = (global._clientScriptContext) ? global._clientScriptContext.pageInitMode : null;
		    var argList = [url, parentPath, recordType, pageMode];

		    if(isApiPath(moduleName))
		    {
			    if (predefinedApiModules[moduleName])
			    {
				    //Satify the load request with a predefined module from N.js
				    define(predefinedApiModules[moduleName]);
				    context.completeLoad(moduleName);
				    return;
			    }
			    else if(DYNAMICALLY_GENERATED_2_0_MODULE_PATH_PREFIXES.indexOf(moduleName.split("/")
					    .slice(0, 2)
					    .join("/")) === -1
				    && console
				    && console.warn)
			    {
			    	if (!isMacroModule(moduleName)) // ignore warning for macros
				    {
					    // This would indicate a missing module from N.js or a new dynamic module (performance antipattern)
					    console.warn('Predefined API module cache miss for ' + moduleName, predefinedApiModules);
				    }
			    }
		    }

	        if ( (moduleName && moduleName.indexOf('n/') === 0) || (url && url.indexOf('n/') === 0))
		        requireLoadDefaultImpl(context, moduleName, url.indexOf('n/') === 0?url.substring(1):url);
	        else if (require.forceSync)
		        loadCallback(serverCallSync(callURL, method, argList));
	        else
		        serverCallAsync(callURL, method, argList, loadCallback);
        };

        /// --- server call functions

        function serverCallSync(url, remoteMethodName, args)
        {
            var useRemoteMethod = url === callURL || url === legacyCallURL || !!remoteMethodName && Array.isArray(args);

            return makeServerCall({
                url: url,
                method: useRemoteMethod ? 'POST' : 'GET',
                remoteMethodName: remoteMethodName,
                args: args,
                async: false
            });
        }

        function serverCallAsync(url, remoteMethodName, args, callback)
        {
            var useRemoteMethod = url === callURL || url === legacyCallURL || !!remoteMethodName && Array.isArray(args);

            makeServerCall({
                url: url,
                method: useRemoteMethod ? 'POST' : 'GET',
                remoteMethodName: remoteMethodName,
                args: args,
                async: true,
                callback: callback
            });
        }

        //only works for modules present in N.js, don't use for others
        function getModuleFromN(module)
        {
	        var rc = null;
	        var internal = global.require.isInternal();
	        var sync = global.require.isSync();
	        try
	        {
		        global.require.setInternal(true);
		        global.require.forceSync(true);
		        global.require([module], function (mod) {
			        rc = mod;
		        });
	        }
	        finally
	        {
		        global.require.setInternal(internal);
		        global.require.forceSync(sync);
	        }
	        return rc;
        }

        function checkResponseForError(responseCode, responseText)
        {
	        if (!responseText)
		        throw Error("empty response");

	        var ajaxHelpers = getModuleFromN('N/restricted/ajaxHelpers');
	        ajaxHelpers.handleServerCallError(responseCode, responseText);

	        if (!ajaxHelpers.isJson(responseText))
		        throw Error("invalid response");
        }

        function makeServerCall(options)
        {
            var url = options.url,
                method = options.method || 'POST',
                remoteMethodName = options.remoteMethodName,
                args = options.args,
                async = options.async,
                callback = options.callback;

            var useRemoteMethod = url === callURL || url === legacyCallURL || !!remoteMethodName && Array.isArray(args);

            function processResponse(responseText, responseCode, resultOnly){
                var result;

	            checkResponseForError(responseCode, responseText);

                result = JSON.parse(responseText);

                if(useRemoteMethod)
                {
                    var responseObj = result || {
                                result: {}
                            };

                    if (responseObj.hasOwnProperty("nlError") && responseObj.nlError)
                    {
                        var error = Error(responseObj.details);
                        error.name = responseObj.code;
                        throw error;
                    }

                    result = !resultOnly ? responseObj : responseObj.result;
                }

                return result;
            }

            url = url || callURL;

            var params;
            if(useRemoteMethod)
            {
                args = args || [];
                params = 'jrid=' + encodeURIComponent(nlRequestId++);
	            if (typeof nsDefaultContextObj !== 'undefined' && nsDefaultContextObj !== null)
	            {
		            params += "&c=" + nsDefaultContextObj.company;
		            params += "&isExternal=T";
	            }
	            params += '&jrmethod=' + encodeURIComponent('remoteObject.' + remoteMethodName) +
		            '&jrparams=' + encodeURIComponent(JSON.stringify(args));
            }
            else
            {
                args = args || {};
                params = Object.keys(args).map(function(v, i, a){return encodeURIComponent(v) + '=' + encodeURIComponent(args[v]);}).join('&');
            }

            var xhr = new XMLHttpRequest();
            xhr.open(method, method === 'GET' ? url + '?' + params : url, async);
            if (async)
            {
                xhr.onload = function () {
                    var response;

                    if (this.readyState === 4)
                    {
                        try
                        {
                            response = processResponse(this.responseText, this.status);
                        }
                        catch (e)
                        {
                            response = e;
                        }
                        callback(response);
                    }
                }
            }
            xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
	        xhr.setRequestHeader("NSXMLHttpRequest", "NSXMLHttpRequest");
            xhr.send(params);
            if (!async)
            {
                return processResponse(xhr.responseText, xhr.status, true);
            }
        }

        function doLogExecution (levelIdx, title, details)
        {
	        if (!!window.NLScriptIdForLogging && !!window.NLDeploymentIdForLogging)
		        serverCallSync(callURL, "logExecutionWithDeployment", [window.NLScriptIdForLogging, window.NLDeploymentIdForLogging, log.LOG_LEVELS[levelIdx], title, details])
	        else
                serverCallSync(callURL, "logExecution", [window.NLScriptId, nlapiGetRecordType(), log.LOG_LEVELS[levelIdx], title, details])
        }
        global.log.setLogFunction(doLogExecution);
        global.log = Object.freeze ? Object.freeze(global.log) : global.log;

        global.util = Object.freeze ? Object.freeze(global.util) : global.util;

        // ---- misc defines

        global.require.config = (function(){
	        var cache = {};

	        return function(configObj)
	        {
		        if (util.isObject(configObj)) {
			        if ( configObj.context && isFilePathLike(configObj.context)) {
				        var myNewRequire = cache[configObj.context];
				        if (!myNewRequire) {
					        myNewRequire = requirejs.config(util.extend({'isSystem': false}, configObj));
					        cache[configObj.context] = myNewRequire;
				        }

				        return myNewRequire;
			        }
			        else
				        return requirejs.config( util.extend( {'isSystem':false},configObj ) );
		        }
	        }
        })();
        global.moduleKeeper = []; // only necessary for the connection with 1.0-2.0 SS world. Once we switch over we can remove this. ^o^
        global.serverCallSync = serverCallSync;
        global.serverCallAsync = serverCallAsync;
    })(getGlobalScope());

})(nlapi);

if (typeof ES6Promise !== 'undefined')
    ES6Promise.polyfill();

// Array.prototype.find polyfill for IE
// https://tc39.github.io/ecma262/#sec-array.prototype.find
if (!Array.prototype.find) {
	Object.defineProperty(Array.prototype, 'find', {
		value: function(predicate) {
			// 1. Let O be ? ToObject(this value).
			if (this == null) {
				throw new TypeError('"this" is null or not defined');
			}

			var o = Object(this);

			// 2. Let len be ? ToLength(? Get(O, "length")).
			var len = o.length >>> 0;

			// 3. If IsCallable(predicate) is false, throw a TypeError exception.
			if (typeof predicate !== 'function') {
				throw new TypeError('predicate must be a function');
			}

			// 4. If thisArg was supplied, let T be thisArg; else let T be undefined.
			var thisArg = arguments[1];

			// 5. Let k be 0.
			var k = 0;

			// 6. Repeat, while k < len
			while (k < len) {
				// a. Let Pk be ! ToString(k).
				// b. Let kValue be ? Get(O, Pk).
				// c. Let testResult be ToBoolean(? Call(predicate, T, « kValue, k, O »)).
				// d. If testResult is true, return kValue.
				var kValue = o[k];
				if (predicate.call(thisArg, kValue, k, o)) {
					return kValue;
				}
				// e. Increase k by 1.
				k++;
			}

			// 7. Return undefined.
			return undefined;
		}
	});
}
