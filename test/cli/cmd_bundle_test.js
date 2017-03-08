var assert = require("assert");
var mockery = require("mockery");

describe("cmd bundle module", function() {
	var cmdBundle;
	var bundleArgs;
	var cmdBundlePath = "../../lib/cli/cmd_bundle";

	beforeEach(function() {
		bundleArgs = {};

		mockery.enable({
			useCleanCache: true,
			warnOnReplace: false,
			warnOnUnregistered: false
		});

		mockery.registerAllowable(cmdBundlePath);

		mockery.registerMock("../../index", {
			bundle: function(system, options) {
				bundleArgs.system = system;
				bundleArgs.options = options;
				return Promise.resolve();
			}
		});

		cmdBundle = require(cmdBundlePath);
	});

	afterEach(function() {
		mockery.disable();
		mockery.deregisterAll();
	});

	it("exposes the right command", function() {
		assert.equal(cmdBundle.command, "bundle");
	});

	it("command options have sensible defaults", function() {
		var options = cmdBundle.builder;

		assert.equal(options.dest.default, "");
		assert.equal(options.filter.default, "**");
		assert.equal(options.config.default, "package.json!npm");
	});

	it("handler calls steal.bundle", function() {
		cmdBundle.handler({
			minify: true,
			config: "/stealconfig.js"
		});

		assert.deepEqual(bundleArgs.system, {
			config: "/stealconfig.js"
		});

		assert(bundleArgs.options.minify);
	});

	it("--deps defaults filter option to `node_modules/**/*`", function() {
		cmdBundle.handler({
			deps: true,
			filter: "**", // default value
			config: "/stealconfig.js"
		});

		assert.equal(bundleArgs.options.filter, "node_modules/**/*");
	});

	it("--dev defaults filter to node_modules and package.json", function() {
		cmdBundle.handler({
			dev: true,
			filter: "**", // default value
			config: "/stealconfig.js"
		});

		assert.deepEqual(bundleArgs.options.filter, ["node_modules/**/*", "package.json"]);
	});
});
