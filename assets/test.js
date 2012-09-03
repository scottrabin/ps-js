test('ps.create', function() {
	// verify the returned object has the right signature
	var obj = ps.create();
	equal( typeof obj, 'object', "ps.create() should return an object" );
	equal( typeof obj.get, 'function', "that object should have a `get` function" );
	equal( typeof obj.set, 'function', "that object should have a `set` function" );
});

module( 'ps.observable (primitive)' );
test('[ ps.create(primitive) ]', function() {
	// verify that the default value on the object is the one set in the constructor
	var num = ps.create(5),
		str = ps.create('test'),
		bool = ps.create(true);

	deepEqual(num.get(), 5, "works with numbers");
	deepEqual(str.get(), 'test', "works with strings");
	deepEqual(bool.get(), true, "works with booleans");
});

test('observable.get', function() {
	var num = ps.create(5),
		str = ps.create('test'),
		bool = ps.create(true);

	equal(num.get(), 5, "observable.get returns the right number");
	equal(str.get(), 'test', "observable.get returns the right value for a string");
	equal(bool.get(), true, "observable.get returns the right value for a boolean");
});

test('observable.set', function() {
	var num = ps.create(5),
		str = ps.create('test'),
		bool = ps.create(true);

	num.set(10);
	str.set('a different test');
	bool.set(false);

	equal(num.get(), 10, "observable.set changes the number value returned by get");
	equal(str.get(), 'a different test', "observable.set changes the string value returned by get");
	equal(bool.get(), false, "observable.set changes the boolean returned by get");
});

test('observable.trigger', function() {
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

test('observable.on / observable.off / observable.trigger', function() {
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

test('observable.on', function() {
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

test('observable.set (prevented)', function() {
	var value = 5,
		obs   = ps.create(value),
		calls = 0;

	obs.on('change', function() {
		calls += 1;
	});

	obs.set(value);

	equal(calls, 0, "Calls to observable.set should not trigger a `change` event when the value doesn't change" );
});

module( "ps.observable (object)" );
test('observable.set (object) : set via hash', function() {
	var values = [5, 10, 15, 20],
		obs    = ps.create({
			propOne : values[0],
			propTwo : values[1]
		});

	equal( obs.get('propOne'), values[0], 'Verify initial value is correct' );
	equal( obs.get('propTwo'), values[1], 'Verify initial value is correct' );

	// set via hash
	obs.set({
		propOne: values[2],
		propTwo: values[3]
	});

	// verify change
	equal( obs.get('propOne'), values[2], 'Property one changed correctly' );
	equal( obs.get('propTwo'), values[3], 'Property two changed correctly' );

});

test('observable.set : callbacks', function() {
	var values = [5, 10, 15, 20],
		obs    = ps.create({property: values[0]}),
		callOrder = [],
		calls  = {
			'before:change:property' : 0,
			'change:property': 0,
			'before:change': 0,
			'change': 0
		};

	obs.on('before:change:property', function(oldVal, newVal, ctx) {
		equal(oldVal, values[0], 'Argument 1 [before:change:property]: old value of property' );
		equal(newVal, values[1], 'Argument 2 [before:change:property]: new value of property' );
		equal(ctx, obs, 'Argument 3 [before:change:property]: observable object' );

		calls['before:change:property'] += 1;
		callOrder.push( 'before:change:property' );
	});
	obs.on('change:property', function(newVal, oldVal, ctx) {
		equal(newVal, values[1], 'Argument 1 [change:property]: new value of property' );
		equal(oldVal, values[0], 'Argument 2 [change:property]: old value of property' );
		equal(ctx, obs, 'Argument 3 [change:property]: observable object' );

		calls['change:property'] += 1;
		callOrder.push( 'change:property' );
	});
	obs.on('before:change', function(oldObj, newObj, ctx) {
		deepEqual( oldObj, {property: values[0]}, 'Argument 1 [before:change]: previous value of hash' );
		deepEqual( newObj, {property: values[1]}, 'Argument 2 [before:change]: new value of hash' );
		equal(ctx, obs, 'Argument 3 [before:change]: observable object' );

		calls['before:change'] += 1;
		callOrder.push( 'before:change' );
	});
	obs.on('change', function(newObj, oldObj, ctx) {
		deepEqual(newObj, {property: values[1]}, 'Argument 1 [change]: new value of hash' );
		deepEqual(oldObj, {property: values[0]}, 'Argument 2 [change]: previous value of hash' );
		equal(ctx, obs, 'Argument 3 [change]: observable object' );

		calls['change'] += 1;
		callOrder.push( 'change' );
	});

	obs.set('property', values[1]);

	deepEqual( callOrder, ['before:change:property', 'before:change', 'change:property', 'change'], 'Callbacks invoked in the proper order' );
	equal( calls['before:change:property'], 1, '[before:change:property] called once' );
	equal( calls['before:change'], 1, '[before:change] called once' );
	equal( calls['change:property'], 1, '[change:property] called once' );
	equal( calls['change'], 1, '[change] called once' );

});

test('observable.set (object) : `before` validation', function() {
	var values = [5, 10, 15, 20],
		obs1   = ps.create({property: values[0]}),
		obs2   = ps.create({property: values[0]});

	// prevent both objects from changing
	obs1.on('before:change:property', function(){ return false; });
	obs2.on('before:change', function(){ return false; });

	// attempt to change both objects
	obs1.set('property', values[1]);
	obs2.set('property', values[1]);

	equal( obs1.get('property'), values[0], '[before:change:property] can prevent a property from changing' );
	equal( obs2.get('property'), values[0], '[before:change] can prevent an object from changing' );

});
