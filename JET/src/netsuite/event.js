(function(global)
{
	var getObservers, cleanUp;

	try
	{
		(function()
		{
			var weakmap = new WeakMap();

			getObservers = function getObservers(obj)
			{
				var result = weakmap.get(obj);

				if(!result)
				{
					result = [];
					weakmap.set(obj, result);
				}

				return result;
			};

			cleanUp = function cleanUp(obj)
			{
				// nothing to do
			};
		}());
	}
	catch (e)
	{
		(function()
		{
			var keys = [],
				values = [];

			getObservers = function getObservers(obj)
			{
				var result = values[keys.indexOf(obj)];

				if(!result)
				{
					result = [];
					keys.push(obj);
					values.push(result);
				}

				return result;
			};

			cleanUp = function cleanUp(obj)
			{
				var index = keys.indexOf(obj);

				keys.splice(index, 1);
				values.splice(index, 1);
			};
		}());
	}

	function observe(obj, callback, types)
	{
		// TODO if(bad){throw 'TypeError';}

		var observers = getObservers(obj),
			observer = observers.filter(function(v,i,a){
				return v.callback === callback;
			})[0];

		if(!observer)
		{
			observer = {
				callback: callback,
				types: [],
				notifications: [],
				timeoutID: null
			};
			observers.push(observer);
		}

		if(!Array.isArray(types))
		{
			types = ['' + types];
		}
		else
		{
			types = types.map(function(v,i,a){
				return '' + v;
			});
		}

		observer.types = observer.types.concat(
			types.filter(function(v1,i1,a1){
				return observer.types.every(function(v2,i2,a2){
					return v1 !== v2;
				});
			})
		);
	}

	function unobserve(obj, callback){
		// TODO if(bad){throw 'TypeError';}

		var observers = getObservers(obj),
			observer = observers.filter(function(v,i,a){
				return v.callback === callback;
			})[0];

		if(!!observer)
		{
			observers.splice(observers.indexOf(observer), 1);
			if(observers.length === 0)
			{
				cleanUp(obj);
			}
		}
	}

	function getNotifier(obj){
		return Object.freeze({
			notify : notify.bind(obj)
		});
	}

	function notify(message){
		var observers = getObservers(this).filter(function(v,i,a){
			return v.types.indexOf(message.type) !== -1;
		});

		observers.forEach(function(v,i,a){
			v.notifications.push(Object.freeze(message));
			if(!v.timeoutID){
				v.timeoutID = setTimeout(notifyListeners.bind(v), 0);
			}
		});
	}

	function notifyListeners()
	{
		var currentNotifications = this.notifications;

		this.notifications = [];
		this.timeoutID = null;

		try
		{
			this.callback.call(null, currentNotifications);
		}
		catch(e)
		{
			// ignore
		}
	}

	global.nlapi.AsyncEvent = Object.create(null);
	global.nlapi.AsyncEvent.observe = Object.observe || observe;
	global.nlapi.AsyncEvent.unobserve = Object.unobserve || unobserve;
	global.nlapi.AsyncEvent.getNotifier = Object.getNotifier || getNotifier;

	Object.freeze(global.nlapi.AsyncEvent);
}(window));

;(function(global){
	var getObservers, cleanUp;

	try
	{
		(function()
		{
			var weakmap = new WeakMap();

			getObservers = function getObservers(obj)
			{
				var result = weakmap.get(obj);

				if(!result)
				{
					result = [];
					weakmap.set(obj, result);
				}

				return result;
			};

			cleanUp = function cleanUp(obj)
			{
				// do nothing
			};
		}());
	}
	catch (e)
	{
		(function()
		{
			var keys = [],
				values = [];

			getObservers = function getObservers(obj){
				var result = values[keys.indexOf(obj)];

				if(!result)
				{
					result = [];
					keys.push(obj);
					values.push(result);
				}

				return result;
			};

			cleanUp = function cleanUp(obj)
			{
				var index = keys.indexOf(obj);

				keys.splice(index, 1);
				values.splice(index, 1);
			};
		}());
	}

	function observe(obj, callback, types){
		// TODO if(false){throw 'TypeError';}

		var observers = getObservers(obj),
			observer = observers.filter(function(v,i,a){
				return v.callback === callback;
			})[0];

		if(!observer)
		{
			observer = { callback: callback, types: [], notifications: [] };
			observers.push(observer);
		}

		if(!Array.isArray(types))
		{
			types = ['' + types];
		}
		else
		{
			types = types.map(function(v,i,a){
				return '' + v;
			});
		}

		observer.types = observer.types.concat(
			types.filter(function(v1,i1,a1){
				return observer.types.every(function(v2,i2,a2){
					return v1 !== v2;
				});
			})
		);
	}

	function unobserve(obj, callback)
	{
		// TODO if(false){throw 'TypeError';}

		var observers = getObservers(obj),
			observer = observers.filter(function(v,i,a){
				return v.callback === callback;
			})[0];

		if(!!observer)
		{
			observers.splice(observers.indexOf(observer), 1);
			if(observers.length === 0)
			{
				cleanUp(obj);
			}
		}
	}

	function getNotifier(obj)
	{
		return Object.freeze({
			notify : notify.bind(obj)
		});
	}

	function notify(message)
	{
		var observers = getObservers(this).filter(function(v,i,a){
			return v.types.indexOf(message.type) !== -1;
		});

		observers.forEach(function(v,i,a){
			v.notifications.push(Object.freeze(message));
			notifyListeners.call(v);
		});
	}

	function notifyListeners()
	{
		var currentNotifications = this.notifications;

		this.notifications = [];

		try
		{
			this.callback.call(null, currentNotifications);
		}
		catch(e)
		{
			// ignore
		}
	}

	global.nlapi.SyncEvent = Object.create(null);
	global.nlapi.SyncEvent.observe = observe;
	global.nlapi.SyncEvent.unobserve = unobserve;
	global.nlapi.SyncEvent.getNotifier = getNotifier;

	Object.freeze(global.nlapi.SyncEvent);
}(window));