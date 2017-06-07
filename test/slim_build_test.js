var path = require("path");
var assert = require("assert");
var denodeify = require("pdenodeify");
var testHelpers = require("./helpers");
var slim = require("../lib/build/slim");
var escapeRegExp = require("lodash/escapeRegExp");

var fs = require("fs");
var rimraf = require("rimraf");
var rmdir = denodeify(rimraf);
var readFile = denodeify(fs.readFile);

describe("slim builds", function() {
	var open = testHelpers.popen;
	var find = testHelpers.pfind;

	it("basics + cjs source", function() {
		var base = path.join(__dirname, "slim", "basics");
		var config = { config: path.join(base, "stealconfig.js") };
		var options = { quiet: true };
		var close;

		return rmdir(path.join(base, "dist"))
			.then(function() {
				return slim(config, options);
			})
			.then(function() {
				return open(path.join("test", "slim", "basics", "index.html"));
			})
			.then(function(args) {
				close = args.close;
				return find(args.browser, "foo");
			})
			.then(function(foo) {
				assert.equal(foo, "foo");
				close();
			});
	});

	it("works with progressively loaded bundles", function() {
		var base = path.join(__dirname, "slim", "progressive");
		var config = { config: path.join(base, "stealconfig.js") };
		var options = { quiet: true };
		var close;

		return rmdir(path.join(base, "dist"))
			.then(function() {
				return slim(config, options);
			})
			.then(function() {
				return Promise.all([
					readFile(path.join(base, "dist", "bundles", "main.js")),
					readFile(path.join(base, "dist", "bundles", "baz.js"))
				]);
			})
			.then(function(bundles) {
				var mainBundle = bundles[0].toString();
				var bazBundle = bundles[1].toString();
				var includesLoaderRegEx = new RegExp(
					escapeRegExp("/*[slim-loader-shim]*/")
				);

				assert.ok(
					includesLoaderRegEx.test(mainBundle),
					"the main bundle should include the loader"
				);
				assert.ok(
					!includesLoaderRegEx.test(bazBundle),
					"other bundles do not include the loader shim"
				);
			})
			.then(function() {
				return open(path.join("test", "slim", "progressive", "index.html"));
			})
			.then(function(args) {
				close = args.close;
				return find(args.browser, "baz");
			})
			.then(function(baz) {
				assert.equal(baz, "baz", "progressively loaded baz correctly");
				close();
			});
	});

	it("can build apps using npm plugin", function() {
		var options = { quiet: true };
		var base = path.join(__dirname, "slim", "npm");
		var config = { config: path.join(base, "package.json!npm") };

		return slim(config, options);
	});
});
