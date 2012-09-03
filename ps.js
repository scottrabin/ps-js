(function(root, factory) {
	if (typeof define === 'function' && define.amd) {
		// AMD; don't export to window globals
		define(factory);
	} else {
		root.ps = factory();
	}
}(this, function(is) {

	// convenience
	var __slice = Array.prototype.slice,
		__isFunction = function(f) { return 'function' === typeof f; },

	// internal use only

		__getValue = function() { return this._value; },
		__setValue = function(v) { this._value = v; },

		/**
		 * Runs through an arbitrary list of functions
		 */
		__serialInvoke = function(callbacks, args, context) {
			for (var i = 0, l = (callbacks && callbacks.length) ; i < l ; i++) {
				if ( callbacks[i].apply(context, args) === false ) {
					return false;
				}
			}
			return true;
		},

		/**
		 * Performs an arbitrary action on an object, including the before/after "triggering",
		 * as well as the preventing of default behavior
		 */
		__performAction = function(observable, event, action, beforeArgs, actionArgs, afterArgs) {
			// if none of the `before:event` callbacks return false, carry through the default action
			if (__serialInvoke(observable._listeners['before:' + event], beforeArgs, observable)) {
				action.apply(observable, actionArgs);
			}

			// invoke the `event` callbacks
			__serialInvoke(observable._listeners[event], afterArgs, observable);
		};

	/**
	 * Basic observable object type
	 */
	function Observable(val) {
		// create an empty hash for function listeners
		this._listeners = {};

		// set the initial value
		this.set(val);
	}
	/**
	 * INTERNAL USE ONLY
	 * Gets the current value of the observable item
	 * @private
	 */
	Observable.prototype._get = __getValue;
	/**
	 * INTERNAL USE ONLY
	 * Sets the current value of the observable item
	 * @private
	 */
	Observable.prototype._set = function(v) {
		return v;
	};

	/**
	 * Basic observable set - sets the current value of the observable
	 */
	Observable.prototype.set = function() {
		var args     = __slice.call(arguments, 0),
			// store the old value
			oldValue = this._get.apply(this, args)
			// determine the actual new value
			newValue = this._set.apply(this, args);

		// only perform the set action if the value actually changes
		if (oldValue !== newValue) {
			__performAction(
				this,                       // observable
				'change',                   // event
				__setValue,                 // action
				[oldValue, newValue, this], // arguments to `before` callbacks
				[newValue],                 // arguments to action
				[newValue, oldValue, this]  // arguments to "after" callbacks
			);
		}

		// chain
		return this;
	};
	/**
	 * Basic observable get - gets the current value of the observable
	 */
	Observable.prototype.get = __getValue;

	/**
	 * Bind a callback to a given event
	 */
	Observable.prototype.on = function(event, callback) {
		var listeners = this._listeners[event];

		// verify the listener array exists
		if (!listeners) {
			listeners = this._listeners[event] = [];
		}

		// add the callback to the list
		listeners.push(callback);

		// chain
		return this;
	};

	/**
	 * Remove a callback from a given event
	 */
	Observable.prototype.off = function(event, callback) {
		// if callback is a function, then remove it from the callback list
		if ( __isFunction(callback) ) {
			for (var i = 0 ; i < this._listeners[event].length ; i++) {
				if (this._listeners[event][i] === callback) {
					this._listeners[event].splice(i--, 1);
				}
			}

			// if there are no more items, wipe the listener array
			if (this._listeners[event].length === 0) {
				callback = null;
			}
		}

		if ( !callback ) {
			delete this._listeners[event];
		}
	};

	/**
	 * Trigger an event on the observable object
	 */
	Observable.prototype.trigger = function(event) {

		// invoke the appropriate set of callbacks
		__serialInvoke(
			this._listeners[event],       // callback series
			__slice.call( arguments, 1 ), // arguments for the callback
			this                          // context
		);

		// chain
		return this;
	};
		

	return {
		create: function(v) {
			return new Observable(v);
		}
	};
}));
