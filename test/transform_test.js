var assert = require("assert"),
	path = require("path"),
	asap = require("pdenodeify"),
	fs = require("fs-extra"),
	rmdir = require("rimraf"),
	testHelpers = require("./helpers"),
	transformImport = require("../lib/build/transform");

var find = testHelpers.find;
var open = testHelpers.open;

describe("transformImport", function(){

	it("basics should work", function(done){
		transformImport({
			config: __dirname+"/stealconfig.js",
			main: "pluginify/pluginify"
		}, {
			exports: {
				'pluginify/global': 'globalModule'
			},
			quiet: true
		}).then(function(transform){
			return transform();
		}).then(function(source){
			fs.writeFile(__dirname+"/pluginify/out.js", source.code, function(err) {
			    // open the prod page and make sure
				// the plugin processed the input correctly
				open("test/pluginify/index.html", function(browser, close){

					find(browser,"RESULT", function(result){
						assert(result.module.es6module, "have dependeny");
						assert(result.cjs(), "cjs");
						assert.equal(result.global, "This is a global module", "Global module loaded");
						assert.equal(result.UMD, "works", "Doesn't mess with UMD modules");
						assert.equal(result.define, undefined, "Not keeping a global.define");
						assert.equal(result.System, undefined, "Not keeping a global.System");
						close();
					}, close);

				}, done);
			});


		}).catch(function(e){
			console.log(e.stack)
		});
	});

	it("ignores files told to ignore", function(done){
		transformImport({
			config: __dirname + "/stealconfig.js",
			main: "pluginify/pluginify"
		}, {
			exports: {},
			quiet: true
		}).then(function(transform){
			return transform(null, {
				ignore: ["basics/amdmodule"]
			});
		}).then(function(source){

			// Get the resulting string, ignoring amdmodule
			var result = source.code;

			// Regex test to see if the basics/amdmodule is included
			var includesIgnoredThings = new RegExp("\\*basics\\/amdmodule\\*").test(result);

			assert.equal(includesIgnoredThings, false, "It excluded the modules told to.");
		}).then(done);

	});

	it("makes plugins that depend on other made plugins",function(done){
		transformImport({
			config: __dirname+"/pluginify_deps/config.js",
			main: "plugin"
		}, {
			exports: {},
			quiet: true
		}).then(function(transform){
			return Promise.all([
				transform("plugin",{
					ignore: ["util"],
					minify: false
				}),
				transform("util",{
					ignore: ["lib"],
					minify: false,
					exports: {
						"lib" : "lib"
					}
				})
			]);
		}).then(function([pluginSource, utilSource]) {
			var pluginOut = pluginSource.code;
			var utilOut = utilSource.code;

			fs.mkdirs(__dirname+"/pluginify_deps/out", function(err) {

				fs.writeFile(__dirname+"/pluginify_deps/out/plugin.js", pluginOut, function(err) {

					fs.writeFile(__dirname+"/pluginify_deps/out/util.js", utilOut, function(err) {

						// open the prod page and make sure
						// the plugin processed the input correctly
						open("test/pluginify_deps/prod.html", function(browser, close){

							find(browser,"plugin", function(plugin){
								assert.equal(plugin.util.lib.name, "lib");
								close();
							}, close);

						}, done);

					});

				});

			});

		}).catch(function(e){
			console.log(e.stack)
		});
	});

	it("works when a file has no callback", function(done) {
		transformImport({
			config: __dirname + "/stealconfig.js",
			main: "nocallback/nocallback"
		}, {
			exports: {},
			quiet: true
		}).then(function(transform) {
			return transform();
		}).then(function({code}) {
			fs.writeFile(__dirname+"/nocallback/out.js", code, function(err) {
			    // open the prod page and make sure
				// the plugin processed the input correctly
				open("test/nocallback/index.html", function(browser, close){
					find(browser, "RESULT", function(result){
						assert(result.message, "I worked!");
						close();
					}, close);
				}, done);
			});
		});
	});

	it("Excludes plugins from the built output unless marked includeInBuild", function(done){
		transformImport({
			config: __dirname+"/plugins/config.js",
			main: "main"
		}, {
			exports: {},
			quiet: true
		}).then(function(transform){
			return transform(null, {
				minify: false
			});
		}).then(function({code}) {
			assert.equal(/System\.set/.test(code), false,
						 "No System.set in the output");
		}).then(done);
	});

	it("Works with globals that set `this`", function(done){
		rmdir(__dirname+"/pluginify_global/out.js", function(error){
			if(error){
				return done(error);
			}

			transformImport({
				config: __dirname+"/pluginify_global/config.js",
				main: "main"
			}, {
				exports: {
					"global": "GLOBAL"
				},
				quiet: true
			}).then(function(transform){
				return transform(null, {
					minify: false
				});
			}).then(function({code}) {
				fs.writeFile(__dirname + "/pluginify_global/out.js", code, function(error) {
					if(error) {
						return done(error);
					}

					open("test/pluginify_global/site.html", function(browser, close){

						find(browser,"MODULE", function(result){
							assert.equal(result.GLOBAL, "global", "Global using this set correctly.");
							close();
						}, close);

					}, done);
				});
			});
		});
	});

	it("Works with modules that check for define.amd", function(done){
		rmdir(__dirname + "/pluginify_define/out.js", function(error){
			if(error) {
				return done(error);
			}

			transformImport({
				config: __dirname + "/pluginify_define/config.js",
				main: "main"
			}, {
				quiet: true
			}).then(function(transform){
				return transform(null, { minify: false })
			}).then(function({code}){
				fs.writeFile(__dirname + "/pluginify_define/out.js", code, function(error){
					if(error) {
						return done(error);
					}

					open("test/pluginify_define/site.html", function(browser, close){
						find(browser, "MODULE", function(result){
							assert.equal(result.define, "it worked", "Module using define.amd works");
							close();
						}, close);
					}, done);
				});
			});
		});
	});

	it("Works with projects using live-reload", function(done) {
		asap(rmdir)(path.join(__dirname, "live_reload", "out.js"))
			.then(function() {
				return transformImport({
					config: path.join(__dirname, "live_reload", "package.json!npm")
				}, {
					quiet: true
				});
			})
			.then(function(transform) {
				return transform(null, { minify: false });
			})
			.then(function({code}) {
				return asap(fs.writeFile)(
					path.join(__dirname, "live_reload", "out.js"),
					code
				);
			})
			.then(function() {
				open("test/live_reload/plugin.html", function(browser, close) {
					find(browser, "MODULE", function(result){
						assert.equal(result.foo, "bar", "works");
						close();
					}, close);
				}, done);
			})
			.catch(done);
	});

	describe("exports", function(){
		it("can be used to export a module's value", function(done){
			asap(rmdir)(__dirname + "/transform_export/out.js")
			.then(function(){
				return transformImport({
					config: __dirname + "/transform_export/package.json!npm"
				}, {
					quiet: true,
					exports: {
						"app/foo": "foo.bar",
						"other": "other.thing"
					}
				});
			})
			.then(function(transform){
				return transform(null, { minify: false });
			}).then(function({code}){
				return asap(fs.writeFile)(__dirname + "/transform_export/out.js",
										  code);
			})
			.then(function(){
				open("test/transform_export/site.html", function(browser, close){
					find(browser, "MODULE", function(mod){
						assert.equal(mod.foo, "foo bar", "got foo");
						assert.equal(mod.other, "other thing", "got other");
						close();
					}, close);
				}, done);
			});
		});
	});
});
