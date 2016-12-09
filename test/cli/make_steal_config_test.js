var path = require("path");
var assert = require("assert");
var makeStealConfig = require("../../lib/cli/make_steal_config");

describe("makeStealConfig", function() {
	it("includes main if argv.main provided", function() {
		var config = makeStealConfig({
			main: "path/to/main",
			config: "package.json!npm"
		});
		assert.equal(config.main, "path/to/main");

		config = makeStealConfig({
			config: "package.json!npm"
		});
		assert(
			typeof config.main === "undefined",
			"main should not be defined"
		);
	});

	it("builds config path if relative", function() {
		var cwd = process.cwd();
		var config = makeStealConfig({ config: "package.json!npm" });
		assert.equal(config.config, path.join(cwd, "package.json!npm"));
	});

	it("returns absolute config path as-is", function() {
		var config = makeStealConfig({ config: "/my-config" });
		assert.equal(config.config, "/my-config");
	});
});
