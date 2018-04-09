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

	function buildAndOpen(opts = {}){
		var options = Object.assign(opts, {
			quiet: true,
			minify: false
		});

		return function(done){
			this.timeout(20000);
			var base = path.join(__dirname, "treeshake", "basics");
			var config = { config: path.join(base, "package.json!npm") };
			var page = `prod.html`;

			rmdir(path.join(base, "dist"))
				.then(function() {
					return build(config, options);
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
	}

	describe("Defaults", function(){
		before(buildAndOpen());

		describe("Import/Export syntaxes", function(){
			describe("import {}", function(){
				it("An unused export is removed", function(){
					let dep = app.dep;
					assert.equal(typeof dep.one, "function", "The 'one' export is used");
					assert.equal(typeof dep.two, "undefined", "The 'two' export was treeshaken");
				});

				it("Uses multiple shakes to remove all unused exports", function(){
					let o = app.dep4Other;
					assert.equal(typeof o.first, "function", "included");
					assert.equal(typeof o.second, "undefined", "removed");

					let a = app.dep4AndAnother;
					assert.equal(typeof a.anotherOne, "function", "included");
					assert.equal(typeof a.anotherTwo, "undefined", "removed");
				});
			});

			describe("import default", function(){
				it("Includes the binding", function(){
					assert.equal(app.anon(), "default export", "Includes default exports");
				});

				it("Includes CommonJS modules", function(){
					assert.equal(app.dep5.doStuff(), "worked", "CommonJS module left alone.");
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
			it.skip("Doesn't tree shake packages without the configuration", function(){
				let two = app.depTwo.two;
				assert.equal(typeof two, "function", "Package doesn\'t have sideEffects: false");
			});
		});

		describe("Unused packages", function(){
			it.skip("Get pruned from the build", function(){
				let connect = app.canConnect;
				assert.ok(connect instanceof Error, "Got an error, not a module");
				assert.equal(connect.didFail, true, "marked as failed");
			});
		});
	});

	describe("treeShaking: false", function(){
		before(buildAndOpen({
			treeShaking: false
		}));

		it("Doesn\'t tree shake modules", function(){
			let dep = app.dep;
			assert.equal(typeof dep.one, "function", "Included");
			assert.equal(typeof dep.two, "function", "Included");
		});
	});

	describe("treeShakingForce: true", function(){
		before(buildAndOpen({
			treeShakingForce: true
		}));

		it("Tree-shakes modules without sideEffects: false", function(){
			let two = app.depTwo.two;
			assert.equal(typeof two, "undefined", "Was tree-shaken");
		});
	});
});
