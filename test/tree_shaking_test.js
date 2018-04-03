var path = require("path");
var assert = require("assert");
var keys = require("lodash/keys");
var denodeify = require("pdenodeify");
var testHelpers = require("./helpers");
var build = require("../index").build;
var optimize = require("../index").optimize;
var intersection = require("lodash/intersection");
var escapeRegExp = require("lodash/escapeRegExp");

var fs = require("fs-extra");
var rimraf = require("rimraf");
var rmdir = denodeify(rimraf);
var readFile = denodeify(fs.readFile);

describe("Tree-shaking", function(){
	var open = testHelpers.popen;
	var find = testHelpers.pfind;

	function buildAndOpen(done){
		var base = path.join(__dirname, "treeshake", "basics");
		var config = { config: path.join(base, "package.json!npm") };
		var page = `prod.html`;

		rmdir(path.join(base, "dist"))
			.then(function() {
				return build(config, {
					quiet: true,
					minify: false
				});
			})
			.then(function() {
				return open(path.join("test", "treeshake", "basics", page))
					.then(function(args) {
						close = args.close;
						return find(args.browser, "app");
					})
					.then(function(mod) {
						app = mod;
						close();
						done();
					});
			})
			.catch(done);
	}

	describe("Defaults", function(){
		var app;
		before(buildAndOpen);

		describe("Import/Export syntaxes", function(){
			describe("import {}", function(){
				it.skip("An unused export is removed", function(){

				});
			});

			describe("import default", function(){
				it.skip("Includes the binding", function(){

				});
			});

			describe("import 'mod'", function(){
				it.skip("Includes modules imported for side-effects", function(){

				});
			})

			describe("export *", function(){
				it.skip("Includes the exports that are used", function(){

				});

				it.skip("Tree-shakes exports that are not used", function(){

				});
			})
		});

		describe("Bundles", function(){
			it.skip("Are not tree-shaken", function(){

			});
		});

		describe("sideEffects configuration", function(){
			it.skip("Doesn't tree shake packages without the configuration", function(){

			});
		});
	});

	describe("treeShake: false", function(){

	})
});
