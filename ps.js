(function(root, factory) {
	if (typeof define === 'function' && define.amd) {
		// AMD; don't export to window globals
		define(['is'], factory);
	} else {
		root.ps = factory(root.is);
	}
}(this, function(is) {

	// convenience
	var __slice = Array.prototype.slice,
		__hasOwn = Object.prototype.hasOwnProperty,

		// internal use only
		__getValue = function() { return this._value; },
		__setValue = function(v) { this._value = v; },

		__extend = function(target) {
			for(var i = 1, p ; i < arguments.length ; i++) {
				for(p in arguments[i]) {
					if (__hasOwn.call(arguments[i], p)) {
						target[p] = arguments[i][p];
					}
				}
			}

			return target;
		},

		/**
		 * Creates a valid subclass of a given parent class
		 * http://ejohn.org/blog/simple-javascript-inheritance/
		 */
		__subclass = function(parent, properties) {
			// create the new class
			var newClass    = function(){
					var args = __slice.call(arguments, 0);
					parent.apply(this, args);

					if (is.fn(properties.init)) {
						properties.init.apply(this, args);
					}
				},
				// basic prototype
				parentProto = new parent();

			// copy all the properties in the given properties object to the prototype
			for(var property in properties) {
				parentProto[property] = properties[property];
			}

			// set the prototype of the new class
			newClass.prototype = parentProto;

			// reset the constructor
			newClass.prototype.constructor = newClass;

			// return the new class
			return newClass;
		},
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
	 * Base observable object type
	 */
	function ObservableBase() {
		// create an empty hash for function listeners
		this._listeners = {};
	}

	/**
	 * Bind a callback to a given event
	 */
	ObservableBase.prototype.on = function(event, callback) {
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
	ObservableBase.prototype.off = function(event, callback) {
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
	ObservableBase.prototype.trigger = function(event) {

		// invoke the appropriate set of callbacks
		__serialInvoke(
			this._listeners[event],       // callback series
			__slice.call( arguments, 1 ), // arguments for the callback
			this                          // context
		);

		// chain
		return this;
	};

	/**
	 * Primitive observable object type
	 */
	var Observable = __subclass(ObservableBase, {
		init: function(initialValue) {
			// set the initial value
			this.set(initialValue);
		},
		/**
		 * INTERNAL USE ONLY
		 * Sets the current value of the observable item
		 * @private
		 */
		_set: function(v) {
			return v;
		},
		/**
		 * Basic observable set - sets the current value of the observable
		 */
		set : function(v) {
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
		},
		/**
		 * INTERNAL USE ONLY
		 * Gets the current value of the observable item
		 * @private
		 */
		_get: __getValue,
		/**
		 * Basic observable get - gets the current value of the observable
		 */
		get : __getValue
	});

	/**********************/
	/* Observable objects */
	/**********************/

	var ObservableObject = __subclass(ObservableBase, {
		init: function(hash) {
			// set initial value
			this._value = {};

			// copy properties
			__extend(this._value, hash);

			// temporary store of previous values for attributes
			this._previous = __extend({}, this._value);
		},
		get : function(prop) {
			return (prop ? this._value[prop] : this._value);
		},
		set : function(prop, value) {
			var willChange = false,
				changeTo   = __extend({}, this._value),
				p;

			// two signatures: as a hash, or as [key, value]
			// transform the key,value into a hash to use the same code path
			if (arguments.length === 2) {
				p = {};
				p[prop] = value;
				prop = p;
			}

			// as hash
			for(p in prop) {
				if (__hasOwn.call(prop, p)) {
					// if there would be a change
					if (this._value[p] !== prop[p]) {
						// copy property if OK, break early otherwise
						// break early if it's invalid
						if( __serialInvoke(
							this._listeners['before:change:' + p],
								[this._value[p], prop[p], this],
							this
						)) {
							changeTo[p] = prop[p];
						} else {
							return this;
						}
					}
				}
			}

			// all [before:change:property] listeners have passed, run overall [before:change] validator
			if ( !__serialInvoke(
				this._listeners['before:change'],
					[this._value, changeTo, this],
				this
			)) {
				return this;
			}

			// all [before:change...] validation passed, commit the values
			this._previous = this._value;
			this._value    = changeTo;

			// run after change events for attributes
			for(p in prop) {
				if (__hasOwn.call(prop, p)) {
					__serialInvoke(
						this._listeners['change:' + p],
						[this._value[p], this._previous[p], this],
						this
					);
				}
			}
			__serialInvoke(
				this._listeners['change'],
				[this._value, this._previous, this],
				this
			);

			return this;
		}
	});

	// Exports
	return {
		create: function(v) {
			// dispatch on type
			if ( !v || is.string(v) || is.number(v) || is.bool(v) || is.array(v) ) {
				return new Observable(v);
			} else {
				return new ObservableObject(v);
			}
		}
	};
}));
