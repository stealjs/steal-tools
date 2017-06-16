var assert = require("assert");

describe("slim support checks", function() {
	describe("checkProductionEnvConfig", function() {
		var checkProductionConfig = require("../lib/slim/checks/production_env_config");

		it("throws if 'window-production' config found", function() {
			assert.throws(
				function() {
					checkProductionConfig({
						config: function(prop) {
							if (prop === "envs") {
								return {
									"window-production": {
										paths: {
											foo: "bar"
										}
									}
								};
							}
						}
					});
				},
				function(err) {
					return /"window-production" config is not supported/.test(
						err.message
					);
				}
			);
		});

		it("does not throw if config found but empty", function() {
			assert.equal(
				checkProductionConfig({
					config: function(prop) {
						if (prop === "envs") {
							return {
								"window-production": {}
							};
						}
					}
				}),
				undefined
			);
		});

		it("does not throw if config missing at all", function() {
			assert.equal(
				checkProductionConfig({
					config: function(prop) {
						if (prop === "envs") {
							return;
						}
					}
				}),
				undefined
			);
		});
	});

	describe("checkStealAndLoader", function() {
		var checkStealAndLoader = require("../lib/slim/checks/steal_and_loader");

		it("throws if @loader is in the graph", function() {
			assert.throws(
				function() {
					checkStealAndLoader("stealconfig.js", {
						main: {
							dependencies: ["@loader"]
						},
						"stealconfig.js": {}
					});
				},
				function(err) {
					return /"@loader" module is not supported/.test(err.message);
				}
			);
		});

		it("throws if @steal is in the graph", function() {
			assert.throws(
				function() {
					checkStealAndLoader("stealconfig.js", {
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

		it("does not throw if @loader/@steal missing from graph", function() {
			assert.equal(checkStealAndLoader({}), undefined);
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
