var nameBundle = require("../lib/bundle/name");

describe("Bundle names", function(){
	
	it("It should include package name", function(){
		var name = nameBundle({
			bundles: ["project@1.0.0#main"]
		});

		assert.equal(name, "bundles/project/main");
	});

	it("Without package name", function(){
		var name = nameBundle({
			bundles: ["main"]
		});

		assert.equal(name, "bundles/main");
	});

});
