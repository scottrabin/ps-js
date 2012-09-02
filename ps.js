(function(root, factory) {
	if (typeof define === 'function' && define.amd) {
		// AMD; don't export to window globals
		define(['is'], factory);
	} else {
		root.ps = factory(root.is);
	}
}(this, function() {

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
	 * Basic observable set - sets the current value of the observable
	 */
	Observable.prototype.set = function(v) {
		// store the old value
		var oldValue = this.get();

		// trigger the "change:before" event
		this.trigger('change:before', oldValue, v, this);

		// set the value
		this._value = v;

		// trigger the "change" event
		this.trigger('change', v, oldValue, this);

		// chain
		return this;
	};
	/**
	 * Basic observable get - gets the current value of the observable
	 */
	Observable.prototype.get = function() {
		return this._value;
	};

	/**
	 * Bind a callback to a given event
	 */
	Observable.prototype.on = function(event, callback) {
		// verify the listener array exists
		var listeners = (is.array(this._listeners[event]) ?
						 this._listeners[event] :
						 this._listeners[event] = []
						);

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
		if ( is.fn(callback) ) {
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
		// verify there are listeners for this event
		if ( this._listeners[event] ) {
			var args = Array.prototype.slice.call( arguments, 1 ),
				i;
			for (i = 0, l = this._listeners[event].length ; i < l ; i++) {
				this._listeners[event][i].apply(this, args);
			}
		}
	};
		

	return {
		create: function(v) {
			return new Observable(v);
		}
	};
}));
