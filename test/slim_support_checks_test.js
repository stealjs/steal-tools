var assert = require("assert");

describe("slim support checks", function() {
	describe("checkSteal", function() {
		var checkSteal = require("../lib/slim/checks/steal");

		it("throws if @steal is in the graph", function() {
			assert.throws(
				function() {
					checkSteal("stealconfig.js", {
						main: {
							dependencies: ["@steal"]
						},
						"stealconfig.js": {}
					});
				},
				function(err) {
					return /"@steal" module is not supported/.test(err.message);
				}
			);
		});

		it("does not throw if @steal missing from graph", function() {
			assert.equal(checkSteal({}), undefined);
		});
	});

	describe("checkStealConditional", function() {
		var checkStealConditional = require("../lib/slim/checks/steal_conditional");

		it("throws if steal-conditional is in the graph", function() {
			assert.throws(
				function() {
					checkStealConditional({
						dependencies: ["node_modules/steal-conditional/conditional"]
					});
				},
				function(err) {
					return /"steal-conditional" is not supported/.test(err.message);
				}
			);
		});

		it("does not throw if steal-conditional missing from graph", function() {
			assert.equal(checkStealConditional({}), undefined);
		});
	});
});
