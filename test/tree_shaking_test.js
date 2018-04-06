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
	var app, browser;
	var open = testHelpers.popen;
	var find = testHelpers.pfind;

	function buildAndOpen(done){
		this.timeout(20000);
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
				var close;
				return open(path.join("test", "treeshake", "basics", page))
					.then(function(args) {
						close = args.close;
						browser = args.browser;
						return find(browser, "app");
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
		before(buildAndOpen);

		describe("Import/Export syntaxes", function(){
			describe("import {}", function(){
				it("An unused export is removed", function(){
					let dep = app.dep;
					assert.equal(typeof dep.one, "function", "The 'one' export is used");
					assert.equal(typeof dep.two, "undefined", "The 'two' export was treeshaken");
				});

				it.skip("Uses multiple shakes to remove all unused exports", function(){
					// dep4Other
					// dep4AndAnother
				});
			});

			describe("import default", function(){
				it("Includes the binding", function(){
					assert.equal(app.anon(), "default export", "Includes default exports");
				});
			});

			describe("import 'mod'", function(){
				it("Includes modules imported for side-effects", function(){
					assert.equal(browser.window.DEP3_SIDE_EFFECT, true,
						"Includes a module with needed side effects.");
				});
			})

			describe("export *", function(){
				it("Includes the exports that are used", function(){
					assert.equal(app.fromExports.rexpOne, "one", "Included the used export");
				});

				it("Tree-shakes exports that are not used", function(){
					assert.equal(app.fromExports.rexpTwo, undefined, "Doesn\'t include unused export.");
				});
			})
		});

		describe("Bundles", function(){
			it("Are not tree-shaken", function(){
				let b = app.bundleA;
				assert.equal(b.one(), 1, "This export is still there");
				assert.equal(b.two(), 2, "This one too");
			});
		});

		describe("sideEffects configuration", function(){
			it("Doesn't tree shake packages without the configuration", function(){
				let two = app.depTwo.two;
				assert.equal(typeof two, "function", "Package doesn\'t have sideEffects: false");
			});
		});
	});

	describe("treeShake: false", function(){

	})
});
