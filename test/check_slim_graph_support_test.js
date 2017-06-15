var assert = require("assert");
var check = require("../lib/graph/check_slim_support");

describe("checkSlimGraphSupport", function() {
	it("throws if @loader is in the graph", function() {
		var graph = {
			main: {
				dependencies: ["@loader"]
			},
			"stealconfig.js": {}
		};

		assert.throws(
			function() {
				check("stealconfig.js", graph);
			},
			function(err) {
				return /"@loader" module is not supported/.test(err.message);
			}
		);
	});

	it("throws if @steal is in the graph", function() {
		var graph = {
			main: {
				dependencies: ["@steal"]
			},
			"stealconfig.js": {}
		};

		assert.throws(
			function() {
				check("stealconfig.js", graph);
			},
			function(err) {
				return /"@steal" module is not supported/.test(err.message);
			}
		);
	});

	it("throws if steal-conditional is in the graph", function() {
		var graph = {
			"package.json!npm": {
				dependencies: ["node_modules/steal-conditional/conditional"]
			}
		};

		assert.throws(
			function() {
				check("package.json!npm", graph);
			},
			function(err) {
				return /"steal-conditional" is not supported/.test(err.message);
			}
		);
	});
});
