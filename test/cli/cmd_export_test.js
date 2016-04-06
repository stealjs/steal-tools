var assert = require("assert");
var mockery = require("mockery");
var _has = require("lodash/has");

describe("cmd export module", function() {
	var cmdExport;
	var exportConfig;
	var cmdExportPath = "../../lib/cli/cmd_export";

	beforeEach(function() {
		exportConfig = {};

		mockery.enable({
			useCleanCache: true,
			warnOnReplace: false,
			warnOnUnregistered: false
		});

		mockery.registerAllowable(cmdExportPath);

		mockery.registerMock("../../index", {
			export: function(config) {
				exportConfig = config;
				return { then: function() {} };
			}
		});

		cmdExport = require(cmdExportPath);
	});

	afterEach(function() {
		mockery.disable();
		mockery.deregisterAll();
	});

	it("exposes the right command", function() {
		assert.equal(cmdExport.command, "export");
	});

	it("defaults config option to package.json!npm", function() {
		assert(cmdExport.builder.config, "package.json!npm");
	});

	it("includes default output options", function() {
		assert(_has(cmdExport.builder, "cjs"), "should include cjs");
		assert(_has(cmdExport.builder, "amd"), "should include amd");
		assert(_has(cmdExport.builder, "global"), "should include global");
		assert(_has(cmdExport.builder, "all"), "should include all");
	});

	it("handler calls steal.export", function() {
		cmdExport.handler({
			minify: true,
			config: "/stealconfig.js"
		});

		assert(_has(exportConfig, "system"), "should include system");
		assert(_has(exportConfig, "options"), "should include options");
		assert(_has(exportConfig, "outputs"), "should include outputs");
	});
});
