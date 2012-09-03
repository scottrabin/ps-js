test('ps.create', function() {
	// verify the returned object has the right signature
	var obj = ps.create();
	equal( typeof obj, 'object', "ps.create() should return an object" );
	equal( typeof obj.get, 'function', "that object should have a `get` function" );
	equal( typeof obj.set, 'function', "that object should have a `set` function" );
});

test('ps.create(primitive)', function() {
	// verify that the default value on the object is the one set in the constructor
	var num = ps.create(5),
		str = ps.create('test'),
		bool = ps.create(true),
		obj = ps.create({test: true}),
		arr = ps.create([1,2,3]);

	deepEqual(num.get(), 5, "works with numbers");
	deepEqual(str.get(), 'test', "works with strings");
	deepEqual(bool.get(), true, "works with booleans");
	deepEqual(obj.get(), {test: true}, "works with objects");
	deepEqual(arr.get(), [1,2,3], "works with arrays");
});

test('ps.get (primitive)', function() {
	var num = ps.create(5),
		str = ps.create('test'),
		bool = ps.create(true);

	equal(num.get(), 5, "obj.get returns the right number");
	equal(str.get(), 'test', "obj.get returns the right value for a string");
	equal(bool.get(), true, "obj.get returns the right value for a boolean");
});

test('ps.set (primitive)', function() {
	var num = ps.create(5),
		str = ps.create('test'),
		bool = ps.create(true);

	num.set(10);
	str.set('a different test');
	bool.set(false);

	equal(num.get(), 10, "obj.set changes the number value returned by get");
	equal(str.get(), 'a different test', "obj.set changes the string value returned by get");
	equal(bool.get(), false, "obj.set changes the boolean returned by get");
});

test('ps.observable.trigger', function() {
	var obs    = ps.create(0),
		args   = ['a', 'b', 3, true],
		called = {
			'arbitrary' : 0
		};

	obs.on('arbitrary', function() {
		deepEqual( Array.prototype.slice.call(arguments, 0), args );

		called['arbitrary'] += 1;
	});

	obs.trigger('arbitrary', args[0], args[1], args[2], args[3] );

	equal( called['arbitrary'], 1, 'Arbitrary event called once' );
});

test('ps.observable.on / ps.observable.off / ps.observable.trigger', function() {
	var vals   = [5, 10, 15],
		obs    = ps.create(vals[0]),
		called = {
			'arbitrary': 0,
			'two' : 0
		},
		callback = function() {
			called['arbitrary'] += 1;
		},
		callbackTwo = function() {
			called['two'] += 1;
		};

	// attach the callbacks to the object
	obs.on('arbitrary', callback);
	obs.on('arbitrary', callbackTwo);

	// trigger one call to verify they are attached
	obs.trigger('arbitrary');

	// remove the first callback
	obs.off('arbitrary', callback);

	// trigger the event again
	obs.trigger('arbitrary');

	// verify that the removed callback was called less than the other
	equal( called['arbitrary'], 1, 'The explicitly removed callback should only fire once' );
	equal( called['two'], 2, 'Other callbacks should not be affected by direct calls' );

	// attempt to remove all callbacks
	obs.off('arbitrary');
	
	// trigger the event
	obs.trigger('arbitrary');

	// verify the remaining callback was not called
	equal( called['two'], 2, 'No more callbacks should trigger when `off` is called without a specific callback' );
});

test('ps.observable.on (primitive)', function() {
	var values  = [5, 10, 15],
		primObs = ps.create(values[0]),
		called  = {
			'before:change' : 0,
			'change': 0
		};

	primObs.on('before:change', function(currentVal, newVal, obs) {
		equal( arguments.length, 3, 'Primitive before:change expects 3 arguments' );
		equal( currentVal, values[0], 'Argument 1: the pre-change value' );
		equal( newVal, values[1], 'Argument 2: the post-change value' );
		equal( obs, primObs, 'Argument 3: the observable object' );

		called['before:change'] += 1;
	});

	primObs.on('change', function(currentVal, oldVal, obs) {
		equal( arguments.length, 3, 'Primitive `change` expects 3 arguments' );
		equal( currentVal, values[1], 'Argument 1: the post-change value' );
		equal( oldVal, values[0], 'Argument 2: the pre-change value' );
		equal( obs, primObs, 'Argument 3: the observable object' );

		called['change'] += 1;
	});

	primObs.set(values[1]);

	equal( called['before:change'], 1, 'Event `before:change` called' );
	equal( called['change'], 1, 'Event `change` called' );

	primObs.off('change');
	primObs.off('before:change');
	// prevent the change from occurring (e.g. validation)
	primObs.on('before:change', function() {
		return false;
	});

	primObs.set(values[2]);

	// verify that the value did not actually change
	equal( primObs.get(), values[1], 'If a `before:change` callback returns false, the change will be aborted' );

});

test('ps.observable.set (primitive)', function() {
	var value = 5,
		obs   = ps.create(value),
		calls = 0;

	obs.on('change', function() {
		calls += 1;
	});

	obs.set(value);

	equal(calls, 0, "Calls to observable.set should not trigger a `change` event when the value doesn't change" );
});