var assert = require("assert");
var mockery = require("mockery");

describe("cmd live-reload module", function() {
	var cmdBuild;
	var liveArgs;
	var cmdBuildPath = "../../lib/cli/cmd_live_reload";

	beforeEach(function() {
		liveArgs = {};

		mockery.enable({
			useCleanCache: true,
			warnOnReplace: false,
			warnOnUnregistered: false
		});

		mockery.registerAllowable(cmdBuildPath);

		mockery.registerMock("../stream/live", function(system, options){
			liveArgs.system = system;
			liveArgs.options = options;
		});

		cmdBuild = require(cmdBuildPath);
	});

	afterEach(function() {
		mockery.disable();
		mockery.deregisterAll();
	});

	it("defaults minify to be false", function() {
		cmdBuild.handler({
			config: "package.json!npm"
		});
		assert.ok(liveArgs.options.quiet, "defaults to quiet");
	});
});
