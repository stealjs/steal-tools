var path = require("path");
var assert = require("assert");
var denodeify = require("pdenodeify");
var slim = require("../lib/build/slim");
var escapeRegExp = require("lodash/escapeRegExp");

var fs = require("fs");
var rimraf = require("rimraf");
var rmdir = denodeify(rimraf);
var readFile = denodeify(fs.readFile);

describe("slim builds", function() {
	it("works with a global module with no deps", function() {
		var base = path.join(__dirname, "slim", "basics");

		return rmdir(path.join(base, "dist")).then(function() {
			return slim(
				{
					config: path.join(base, "stealconfig.js")
				},
				{
					quiet: true
				}
			);
		});
	});

	it("works with ESM exports", function() {
		var base = path.join(__dirname, "slim", "esm");

		return rmdir(path.join(base, "dist")).then(function() {
			return slim(
				{
					config: path.join(base, "stealconfig.js")
				},
				{
					quiet: true
				}
			);
		});
	});

	it("works with progressively loaded bundles", function() {
		var base = path.join(__dirname, "slim", "progressive");

		return rmdir(path.join(base, "dist"))
			.then(function() {
				return slim(
					{
						config: path.join(base, "stealconfig.js")
					},
					{
						quiet: true
					}
				);
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
				var includesLoaderRegEx = new RegExp(escapeRegExp("/*[slim-loader]*/"));

				assert.ok(
					includesLoaderRegEx.test(mainBundle),
					"the main bundle should include the loader"
				);
				assert.ok(
					!includesLoaderRegEx.test(bazBundle),
					"other bundles do not include the loader shim"
				);
			});
	});
});
