var assert = require("assert");
var makeBuildOptions = require("../../lib/cli/make_build_options");

describe("makeBuildConfig", function() {
	it("removes aliases", function() {
		var options = makeBuildOptions({ m: "main", main: "main" });
		assert(options.m == null);
		assert.equal(options.main, "main");
	});

	it("removes keys with - in it", function() {
		var options = makeBuildOptions({ "bundle-steal": false, bundleSteal: false });
		assert(options["bundle-steal"] == null);
		assert.equal(options.bundleSteal, false);
	});

	it("sets 'minify' value appropiately", function() {
		assert.equal(makeBuildOptions({}).minify, true, "defaults to true");

		assert.equal(
			makeBuildOptions({ minify: false }).minify,
			false,
			"should not be mutated if set explicitly to false"
		);

		assert.equal(
			makeBuildOptions({ watch: true }).minify,
			false,
			"should default to false for watch mode"
		);

		assert.equal(
			makeBuildOptions({ watch: true, minify: true }).minify,
			true,
			"should not be mutated if set to true"
		);

		assert.equal(
			makeBuildOptions({ noMinify: true }).minify,
			false,
			"cannot be true if 'no-minify' is true"
		);
	});

	it("sets 'quiet' value appropiately", function() {
		assert.equal(makeBuildOptions({}).quiet, false, "defaults to false");

		assert.equal(
			makeBuildOptions({ watch: true }).quiet,
			true,
			"should default to true for watch mode"
		);

		assert.equal(
			makeBuildOptions({ watch: true, quiet: false }).quiet,
			false,
			"should not be mutated if set"
		);

		assert.equal(
			makeBuildOptions({ watch: true, verbose: true }).quiet,
			false,
			"cannot be true if verbose output is set"
		);
	});
});
