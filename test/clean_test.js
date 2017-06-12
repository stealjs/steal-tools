var assert = require("assert");
var clean = require("../lib/build/clean");

describe("build/clean", function() {
	var source = "123\n//!steal-remove-start\n456\n//!steal-remove-end\n789";
	var source2 = "123\n//! steal-remove-start\n456\n//! steal-remove-end\n789";
	
	it("removes blocks surrounded with steal-remove-start and -end", function() {
		assert.equal(clean(source, {}), "123\n789");
	});

	it("allows an extra space before steal-remove-start for standard linting", function() {
		assert.equal(clean(source2, {}), "123\n789");
	});
});
