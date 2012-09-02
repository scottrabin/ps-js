test('ps.create', function() {
	// verify the returned object has the right signature
	var obj = ps.create();
	ok( typeof obj === 'object', "ps.create() should return an object" );
	ok( typeof obj.get === 'function', "that object should have a `get` function" );
	ok( typeof obj.set === 'function', "that object should have a `set` function" );
});

test('ps.create(primitive)', function() {
	// verify that the default value on the object is the one set in the constructor
	var num = ps.create(5),
	str = ps.create('test'),
	bool = ps.create(true),
	obj = ps.create({test: true}),
	arr = ps.create([1,2,3]);

	deepEqual(num._value, 5, "works with numbers");
	deepEqual(str._value, 'test', "works with strings");
	deepEqual(bool._value, true, "works with booleans");
	deepEqual(obj._value, {test: true}, "works with objects");
	deepEqual(arr._value, [1,2,3], "works with arrays");
});

test('ps.get (primitive)', function() {
	var num = ps.create(5),
	str = ps.create('test'),
	bool = ps.create(true);

	equal(num.get(), 5, "obj.get returns the right number");
	equal(str.get(), 'test', "obj.get returns the right value for a string");
	equal(bool.get(), true, "obj.get returns the right value for a boolean");
});

test('ps.set', function() {
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
