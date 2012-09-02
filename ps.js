(function(root, factory) {
	if (typeof define === 'function' && define.amd) {
		// AMD; don't export to window globals
		define(factory);
	} else {
		root.ps = factory();
	}
}(this, function() {

	/**
	 * Basic observable object type
	 */
	function Observable(val) {
		this.set(val);
	}
	/**
	 * Basic observable set - sets the current value of the observable
	 */
	Observable.prototype.set = function(v) {
		this._value = v;
		return this;
	};
	/**
	 * Basic observable get - gets the current value of the observable
	 */
	Observable.prototype.get = function() {
		return this._value;
	};

	return {
		create: function(v) {
			return new Observable(v);
		}
	};
}));
