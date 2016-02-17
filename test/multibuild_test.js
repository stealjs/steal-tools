var asap = require("pdenodeify"),
	assert = require("assert"),
	comparify = require("comparify"),
	fs = require("fs-extra"),
	multiBuild = require("../lib/build/multi"),
	rmdir = require("rimraf"),
	path = require("path"),
	testHelpers = require("./helpers");

var find = testHelpers.find;
var open = testHelpers.open;

describe("multi build", function(){
    this.timeout(5000);

	it("should work", function(done){
		rmdir(__dirname+"/bundle/dist", function(error){
			if(error){
				done(error);
			}

			multiBuild({
				config: __dirname+"/bundle/stealconfig.js",
				main: "bundle"
			}, {
				quiet: true
			}).then(function(data){
				var exists = fs.existsSync(  path.join(__dirname,"bundle/dist/bundles/bundle.js")  );
				if(!exists) {
					done(new Error("no bundle info"));
					return;
				}

				open("test/bundle/bundle.html#a",function(browser, close){
					find(browser,"appA", function(appA){
						assert(true, "got A");
						assert.equal(appA.name, "a", "got the module");
						assert.equal(appA.ab.name, "a_b", "a got ab");
						assert.equal(appA.clean, undefined, "removed dev code");
						close();
					}, close);
				}, done);


			}, done);
		});
	});

	it("should work with CommonJS", function(done){
		rmdir(__dirname + "/commonjs/bundle", function(error){
			if(error) {
				return done(error);
			}

			multiBuild({
				config: __dirname + "/commonjs/config.js",
				main: "main"
			}, {
				quiet: true
			}).then(function(){
				open("test/commonjs/prod.html", function(browser, close){
					find(browser, "app", function(app){
						assert.equal(app.foo, "bar", "Correct object placed on the window");
						close();
					}, close);
				}, done);
			}).catch(done);
		});
	});

	it("should pass the babelOptions to transpile", function(done){
		this.timeout(20000);

		rmdir(__dirname + "/es6-loose/bundle", function(error){
			if(error) {
				return done(error);
			}

			multiBuild({
				config: __dirname + "/es6-loose/config.js",
				main: "main",
				transpiler: "babel"
			}, {
				quiet: true,
				minify: false,
				babelOptions: {
					loose: 'es6.modules'
				}
			}).then(function(){
				fs.readFile("test/es6-loose/dist/bundles/main.js", "utf8", function(err, data) {
					if (err) {
						done(err);
					}

					var noObjectDefineProperty = data.indexOf("Object.defineProperty") === -1;
					var es6ModuleProperty = data.indexOf("exports.__esModule = true;") >= 0;

					assert(noObjectDefineProperty, "loose mode does not use Object.defineProperty");
					assert(es6ModuleProperty, "should assign __esModule as normal object property");
					done();
				});
			}).catch(done);
		});
	});

	it("allows you to transpile modules on your own", function(done){
		rmdir(__dirname + "/self_transpile/dist", function(error){
			if(error) {
				return done(error);
			}

			multiBuild({
				config: __dirname + "/self_transpile/config.js",
				main: "index"
			}, {
				quiet: true,
				minify: false,
				transpile: function(source){
					if(source.indexOf("import") >= 0) {
						source = "require('two');";
					} else {
						source = '"format amd";';
					}
					return { code: source };
				}
			}).then(function(){
				fs.readFile(__dirname + "/self_transpile/dist/bundles/index.js",
					"utf8", function(error, contents){
					if(error) return done(error);

					var hasRequire = /require\('two'\)/.test(contents);
					assert.ok(hasRequire, "converted the way my transpile does");
					done();
				});
			});
		});
	});

	it("doesn't include the traceur runtime if it's not being used", function(done){
		rmdir(__dirname + "/simple-es6/dist", function(error){
			if(error) {
				return done(error);
			}

			multiBuild({
				config: __dirname + "/simple-es6/config.js",
				main: "main"
			}, {
				quiet: true
			}).then(function(){
				fs.readFile(__dirname + "/simple-es6/dist/bundles/main.js", function(error, contents){
					assert.equal(error, null, "Able to open the file");
					assert.equal(/\$traceurRuntime/.test(contents), false,
								 "Traceur not included");
					done();
				});
			}).catch(done);
		});
	});

	it("Should minify by default", function(done){
		var config = {
			config: __dirname + "/minify/config.js",
			main: "minify"
		};

		rmdir(__dirname+"/minify/dist", function(error){
			if(error) {
				done(error);
				return;
			}

			multiBuild(config, { quiet: true }).then(function(){
				var actual = fs.readFileSync(__dirname + "/minify/dist/bundles/minify.js", "utf8");

				var hasLongVariable = actual.indexOf("thisObjectHasABigName") !== -1;
				var hasGlobalLongVariable = actual.indexOf("anotherVeryLongName") !== -1;
				var hasDevCode = actual.indexOf("remove this") !== -1;

				assert(!hasLongVariable, "Minified source renamed long variable.");
				assert(!hasGlobalLongVariable, "Minified source includes a global that was minified.");
				assert(!hasDevCode, "Minified source has dev code removed.");

			}).then(done);
		});

	});

	it("Should allow minification to be turned off", function(done){
		var config = {
			config: __dirname + "/minify/config.js",
			main: "minify"
		};

		var options = {
			minify: false,
			quiet: true
		};

		rmdir(__dirname+"/minify/dist", function(error){
			if(error) {
				done(error);
				return;
			}

			multiBuild(config, options).then(function(){
				var actual = fs.readFileSync(__dirname + "/minify/dist/bundles/minify.js", "utf8");

				var hasLongVariable = actual.indexOf("thisObjectHasABigName") !== -1;

				assert(hasLongVariable, "Source includes long variable name.");

				done();
			}).catch(function(e){
				done(e);
			});

		});

	});

	it("Should allow setting uglify-js options", function(done) {
		var config = {
			config: __dirname + "/minify/config.js",
			main: "minify"
		};

		var options = {
			quiet: true,
			uglifyOptions: {
				mangle: false // skip mangling names.
			}
		};

		rmdir(__dirname + "/minify/dist", function(error){
			if(error) {
				done(error);
				return;
			}

			multiBuild(config, options).then(function(){
				var actual = fs.readFileSync(__dirname + "/minify/dist/bundles/minify.js", "utf8"),
					hasLongVariable = actual.indexOf("thisObjectHasABigName") !== -1,
					hasAnotherLongVariable = actual.indexOf("anotherLongVariableName") !== -1;

				assert(hasLongVariable, "Skip mangling names in dependencies graph files");
				assert(hasAnotherLongVariable, "skip mangling names in stealconfig and main files");
				done();
			}).catch(done);
		});
	});

	it("Should allow setting clean-css options", function(done) {
		var config = {
			config: __dirname + "/minify/config.js",
			main: "minify"
		};

		var options = {
			quiet: true,
			cleanCSSOptions: {
				keepSpecialComments: 0 // remove all, default '*'
			}
		};

		rmdir(__dirname + "/minify/dist", function(error){
			if(error) {
				done(error);
				return;
			}

			multiBuild(config, options).then(function(){
				var actual = fs.readFileSync(__dirname + "/minify/dist/bundles/minify.css", "utf8"),
					lackSpecialComment = actual.indexOf("a special comment") === -1;

				assert(lackSpecialComment, "clean-css set to remove special comments");
				done();
			}).catch(done);
		});
	});

	it("Allows specifying an alternative dist directory", function(done){
		var config = {
			config: __dirname + "/other_bundle/stealconfig.js",
			main: "bundle",
			bundlesPath: __dirname + "/other_bundle/other_dist/bundles"
		};

		var options = {
			quiet: true
		};

		rmdir(__dirname + "/other_bundle/other_dist", function(error){
			if(error) {
				done(error);
				return;
			}

			multiBuild(config, options).then(function(){
				open("test/other_bundle/bundle.html#a",function(browser, close){
					find(browser,"appA", function(appA){
							assert(true, "got A");
							assert.equal(appA.name, "a", "got the module");
							assert.equal(appA.ab.name, "a_b", "a got ab");
							close();
					}, close);
				}, done);
			});

		});

	});


	it("Allows specifying dist as the current folder", function(done){
        this.timeout(5000);
		var config = {
			config: __dirname + "/other_bundle/stealconfig.js",
			main: "bundle",
			bundlesPath: __dirname+"/other_bundle/bundles"
		};

		var options = {
			quiet: true
		};

		rmdir(__dirname + "/other_bundle/bundles", function(error){
			if(error) {
				done(error);
				return;
			}

			multiBuild(config, options).then(function(){
				open("test/other_bundle/bundle-dist.html#a",function(browser, close){
					find(browser,"appA", function(appA){
							assert(true, "got A");
							assert.equal(appA.name, "a", "got the module");
							assert.equal(appA.ab.name, "a_b", "a got ab");
							close();
					}, close);
				}, done);
			});

		});

	});

	it("Works with bundlesPath and loading from a subfolder", function(done){
		this.timeout(5000);

		rmdir(__dirname + "/bundle_path/javascript/dist", function(error){
			if(error) return done(error);

			multiBuild({
				config: __dirname + "/bundle_path/config.js",
				main: "main",
				bundlesPath: __dirname + "/bundle_path/javascript/dist"
			}, {
				minify: false,
				quiet: true
			}).then(function(){
				open("test/bundle_path/subfolder/index.html",
					 function(browser, close){
					find(browser,"STYLE_CONTENT", function(styleContent){
						assert(styleContent.indexOf("#test-element")>=0, "have correct style info");
						close();
					}, close);
				}, done);
			});
		});
	});


	it("supports bundling steal", function(done){

		rmdir(__dirname+"/bundle/bundles", function(error){
			if(error){
				done(error)
			}

			multiBuild({
				config: __dirname+"/bundle/stealconfig.js",
				main: "bundle"
			},{
				bundleSteal: true,
				quiet: true
			}).then(function(data){

				open("test/bundle/packaged_steal.html#a",function(browser, close){
					find(browser,"appA", function(appA){
						assert(true, "got A");
						assert.equal(appA.name, "a", "got the module");
						assert.equal(appA.ab.name, "a_b", "a got ab");
						close();
					}, close);
				}, done);


			}).catch(function(e){
				done(e);
			});



		});


	});

	it("allows bundling steal and loading from alternate locations", function(done){

		rmdir(__dirname+"/bundle/alternate", function(error){
			if(error){
				done(error)
			}

			multiBuild({
				config: __dirname+"/bundle/stealconfig.js",
				main: "bundle",
				bundlesPath: __dirname + "/bundle/alternate/bundles"
			},{
				bundleSteal: true,
				quiet: true
			}).then(function(data){

				open("test/bundle/folder/packaged_steal.html#a",function(browser, close){
					find(browser,"appA", function(appA){
						assert(true, "got A");
						assert.equal(appA.name, "a", "got the module");
						assert.equal(appA.ab.name, "a_b", "a got ab");
						close();
					}, close);
				}, done);


			}).catch(function(e){
				done(e);
			});



		});


	});

	it("builds and can load transpiled ES6 modules", function(done){
		rmdir(__dirname+"/dist", function(error){
			if(error){
				done(error)
			}

			multiBuild({
				config: __dirname+"/stealconfig.js",
				main: "basics/basics"
			}, {
				quiet: true,
				minify: false
			}).then(function(data){
				open("test/basics/prod.html",function(browser, close){
					find(browser,"MODULE", function(module){
						assert(true, "module");

						assert.equal(module.name, "module", "module name is right");

						assert.equal(module.es6module.name, "es6Module", "steal loads ES6");

						assert.equal(module.es6module.amdModule.name, "amdmodule", "ES6 loads amd");

						close();
					}, close);
				}, done);


			}, done);



		});

	});


	it("System.instantiate works when bundling steal", function(done){
		rmdir(__dirname+"/dist", function(error){
			if(error){
				return done(error)
			}

			multiBuild({
				config: __dirname+"/stealconfig.js",
				main: "basics/basics"
			}, {
				bundleSteal: true,
				quiet: true,
				minify: false
			}).then(function(data){
				open("test/basics/prod-inst.html",function(browser, close){
					find(browser,"MODULE", function(module){
						assert(true, "module");

						// We marked stealconfig.js as instantiated so it shouldn't have it's properties
						var System = browser.window.System;
						assert.equal(System.map["mapd/mapd"], undefined, "Mapping not applied");

						close();
					}, close);
				}, done);
			});



		});

	});



	it("Returns an error when building a main that doesn\'t exist", function(done){
		var config = {
			config: __dirname + "/stealconfig.js",
			main: "some/fake/app"
		};

		var options = {
			quiet: true
		};

		// Temporarily swallow console.logs to prevent 404 showing.
		var log = console.log;
		console.log = function(){};

		multiBuild(config, options).then(function onFulfilled(){
			// If we get then the error wasn't caught properly
			assert(false, "Build completed successfully when there should have been an error");
		}, function onRejected(err){
			assert(err instanceof Error, "Caught an error when loading a fake main");
		}).then(function() {
			// Set back console.log
			console.log = log;
		}).then(done);

	});

	it("removes steal.dev references", function(done){
		rmdir(__dirname + "/bundle/dist", function(error){
			if(error){
				done(error);
			}

			multiBuild({
				main: "bundle",
				config: __dirname + "/bundle/stealconfig.js"
			}, {
				quiet: true
			}).then(function(){
				fs.readFile(__dirname + "/bundle/dist/bundles/app_a.js", function(error, content){
					assert(!error, "able to open the file");
					assert.equal(
						/steal.dev/.test(content),
						false,
						"it should remove steal.dev references"
					);
					done();
				});
			}, done);
		});
	});

	it("works with the bower plugin", function(done){
		rmdir(__dirname + "/bower/dist", function(error){
			if(error) return done(error);

			multiBuild({
				config: __dirname + "/bower/config.js",
				main: "main"
			}, {
				quiet: true,
				minify: false
			}).then(function(){
				open("test/bower/prod.html",function(browser, close){
					find(browser,"MODULE", function(module){
						assert(true, "module");
						assert(module.jquerty, "has jquerty");
						assert(module.jquerty(), "hello jquerty", "correct function loaded");
						close();
					}, close);
				}, done);
			}, done);
		});
	});

	it("works with the bower plugin when using as the config", function(done){
		// this test seems broken.
		rmdir(__dirname + "/bower/dist", function(error){
			if(error) return done(error);

			multiBuild({
				config: __dirname + "/bower/bower.json!bower",
				main: "main"
			}, {
				quiet: true,
				minify: false
			}).then(function(){
				open("test/bower/prod.html",function(browser, close){
					find(browser,"MODULE", function(module){
						assert(true, "module");
						assert(module.jquerty, "has jquerty");
						assert(module.jquerty(), "hello jquerty", "correct function loaded");
						close();
					}, close);
				}, done);
			}, done);
		});
	});

	it("works with babel", function(done){
        this.timeout(5000);

		// this test seems broken.
		rmdir(__dirname + "/babel/dist", function(error){
			if(error) return done(error);

			multiBuild({
				config: __dirname + "/babel/config.js",
				main: "main"
			}, {
				quiet: true,
				minify: false
			}).then(function(){
				var code = fs.readFileSync(__dirname+"/babel/dist/bundles/main.js",
										   "utf8");
				assert(!/\*babel\*/.test(code), "babel not included in the code");

				open("test/babel/prod.html",function(browser, close){
					find(browser,"MODULE", function(module){
						assert(true, "module");
						assert(module.dep, "has jquerty");
						assert(module.dep(), "hello jquerty", "correct function loaded");
						close();
					}, close);
				}, done);
			}, done);
		});
	});

	it("works with an unnormalized main", function(done){
		rmdir(__dirname+"/dist", function(error){
			if(error){
				done(error)
			}

			multiBuild({
				config: __dirname+"/stealconfig.js",
				main: "basics/"
			}, {
				quiet: true,
				minify: false
			}).then(function(data){
				open("test/basics/prod.html",function(browser, close){
					find(browser,"MODULE", function(module){
						assert(true, "module");

						assert.equal(module.name, "module", "module name is right");

						assert.equal(module.es6module.name, "es6Module", "steal loads ES6");

						assert.equal(module.es6module.amdModule.name, "amdmodule", "ES6 loads amd");

						close();
					}, close);
				}, done);


			}, done);



		});

	});

	it("works with a project with json", function(done){
		rmdir(__dirname+"/json/dist", function(error){
			if(error) return done(error);

			multiBuild({
				config: __dirname + "/json/package.json!npm"
			}, {
				quiet: true,
				minify: false
			}).then(function(){
				open("test/json/prod.html", function(browser, close){
					find(browser, "MODULE", function(module){
						assert(!!module.data, "json data exists");
						assert.equal(module.data.foo, "bar", "correctly parsed");
						close();
					}, close);
				}, done);
			});
		});
	});

	it("can define own translate with meta", function(done){
		rmdir(__dirname+"/meta_translate/dist", function(error){
			if(error) return done(error);

			multiBuild({
				configMain: "@empty",
				main: "main",
				baseURL: __dirname + "/meta_translate",
				meta: {
					a: {
						translate: function(load){
							load.metadata.format = "amd";
							return "define([], function(){\n" +
										   "return 'b';\n});";
						}
					}
				}
			}, {
				quiet: true,
				minify: false
			}).then(function(){
				open("test/meta_translate/prod.html", function(browser, close){
					find(browser, "MODULE", function(module){
						assert.equal(module.a, "b", "translate worked");
						close();
					}, close);
				}, done);
			});
		});
	});

	it("sideBundle: true will move a module into a side bundle", function(done){
		rmdir(__dirname+"/side_bundle/dist", function(error){
			if(error) return done(error);

			multiBuild({
				config: __dirname + "/side_bundle/package.json!npm"
			}, {
				quiet: true,
				minify: false
			}).then(function(){
				open("test/side_bundle/prod.html", function(browser, close){
					find(browser, "MODULE", function(module){
						var loader = browser.window.System;

						comparify(loader.bundles, {
							"bundles/b": [ "d", "b" ]
						}, true);

						close();
					}, close);
				}, done);
			});
		});
	});

	it("returns a buildResult", function(done){
		rmdir(__dirname+"/bundle/dist", function(error){
			if(error){
				done(error);
			}

			multiBuild({
				config: __dirname+"/bundle/stealconfig.js",
				main: "bundle"
			}, {
				quiet: true
			}).then(function(data){
				assert(!!data.bundles, "bundles");
				assert(!!data.configuration, "configuration");
				assert(!!data.graph, "graph");
				assert(!!data.loader, "loader");
				assert(!!data.steal, "steal");
			}).then(done);
		});
	});

	it("virtual modules can become bundles", function(done){
		rmdir(__dirname+"/virtual/dist", function(error){
			if(error) {
				return done(error);
			}

			multiBuild({
				config: __dirname + "/virtual/config.js",
				main: "main"
			}, {
				quiet: true
			}).then(function(){
				assert(true, "it worked");
				open("test/virtual/prod.html", function(browser, close){
					find(browser, "MODULE", function(module){
						assert(typeof module.b, "undefined", "b module not included in the main bundle");

						close();
					}, close);
				}, done);
			}).then(null, done);
		});
	});

	it("envs configuration works", function(done){
		rmdir(__dirname+"/envs/dist", function(error){
			if(error) {
				return done(error);
			}

			multiBuild({
				config: __dirname + "/envs/config.js",
				main: "main"
			}, {
				quiet: true
			}).then(function(){
				open("test/envs/prod.html", function(browser, close){
					find(browser, "MODULE", function(module){
						assert.equal(module.FOO, "bar", "envs configuration was set");

						close();
					}, close);
				}, done);
			}).then(null, done);
		});
	});

	describe("with plugins", function(){
		it("work on the client", function(done){
			this.timeout(5000);
			open("test/plugins/site.html", function(browser, close){

				find(browser,"PLUGTEXT", function(plugText){
					assert.equal(plugText, "client-Holler", "client can do plugins");
					close();
				}, close);

			}, done);

		});

		it("work built", function(done){
			// remove the bundles dir
			rmdir(__dirname+"/plugins/dist/bundles", function(error){

				if(error){
					done(error)
				}
				// build the project that
				// uses a plugin

				multiBuild({
					config: __dirname+"/plugins/config.js",
					main: "main"
				}, {
					quiet: true
				}).then(function(data){
					// open the prod page and make sure
					// the plugin processed the input correctly
					open("test/plugins/prod.html", function(browser, close){

						find(browser,"PLUGTEXT", function(plugText){
								assert.equal(plugText, "server-Holler", "server can do plugins");
								close();
						}, close);

					}, done);

				}).catch(function(e){
					done(e);
				});
			});

		});

		it("work built using steal", function(done){
			// remove the bundles dir
			rmdir(__dirname+"/plugins/dist", function(error){

				if(error){
					done(error)
				}

				// build the project that
				// uses a plugin
				multiBuild({
					config: __dirname+"/plugins/config.js",
					main: "main-steal",
					paths: {
						"plug/plug": "plug.js"
					}
				}, {
					quiet: true
				}).then(function(data){
					// open the prod page and make sure
					// the plugin processed the input correctly
					open("test/plugins/prod-steal.html", function(browser, close){

						find(browser,"PLUGTEXT", function(plugText){
								assert.equal(plugText, "server-Holler", "server can do plugins");
								close();
						}, close);

					}, done);

				}).catch(function(e){
					done(e);
				});
			});
		});

		it("work with css buildType", function(done){

			rmdir(__dirname+"/build_types/dist", function(error){

				if(error){
					done(error)
				}
				// build the project that
				// uses a plugin
				multiBuild({
					config: __dirname+"/build_types/config.js",
					main: "main"
				}, {
					quiet: true
				}).then(function(data){

					// open the prod page and make sure
					// the plugin processed the input correctly
					open("test/build_types/prod.html", function(browser, close){

						find(browser,"STYLE_CONTENT", function(styleContent){
							assert(styleContent.indexOf("#test-element")>=0, "have correct style info");
							close();
						}, close);

					}, done);

				}).catch(function(e){
					done(e);
				});
			});
		});

		it("can build less", function(done){
			rmdir(__dirname+"/dep_plugins/dist", function(error){

				if(error){
					done(error)
				}
				// build the project that
				// uses a plugin
				multiBuild({
					config: __dirname+"/dep_plugins/config.js",
					main: "main"
				}, {
					quiet: true
				}).then(function(data){
					// open the prod page and make sure
					// the plugin processed the input correctly
					open("test/dep_plugins/prod.html", function(browser, close){

						find(browser,"STYLE_CONTENT", function(styleContent){
							assert(styleContent.indexOf("#test-element")>=0, "have correct style info");
							close();
						}, close);

					}, done);

				}).catch(function(e){
					done(e);
				});
			});
		});

		it("builds paths correctly", function(done){
			rmdir(__dirname+"/css_paths/dist", function(error){

				if(error){
					done(error)
				}
				// build the project that
				// uses a plugin
				multiBuild({
					config: __dirname+"/css_paths/config.js",
					main: "main"
				}, {
					quiet: true
				}).then(function(data){
					// open the prod page and make sure
					// the plugin processed the input correctly
					open("test/css_paths/prod.html", function(browser, close){

						find(browser,"STYLE_CONTENT", function(styleContent){

							var count = 0;
							styleContent.replace(/url\(['"]?([^'"\)]*)['"]?\)/g, function(whole, part){
								assert.equal(part,"../../images/hero-ribbons.png", "reference is correct");
								count++;
							});
							assert.equal(count, 3, "correct number of styles");
							close();
						}, close);

					}, done);

				}).catch(function(e){
					done(e);
				});
			});
		});

		it("plugins that are part of the main are part of the main bundle", function(done){
			rmdir(__dirname+"/plugin_main_bundle/dist", function(error){
				if(error) {
					return done(error);
				}

				multiBuild({
					config: __dirname + "/plugin_main_bundle/config.js",
					main: "main"
				}, {
					minify: false,
					quiet: true
				}).then(function(buildResult){
					var mainBundle = buildResult.bundles[0];
					var found = false;
					for(var i = 0, len = mainBundle.nodes.length; i < len; i++) {
						var node = mainBundle.nodes[i];
						if(node.load.name === "plug") {
							found = true;
						}
					}
					assert.ok(found, "plugin was in the main bundle");
				}).then(done, done);
			});
		});

		it("Errors that happen during transpile are reported with the name of the module that failed", function(done){

			multiBuild({
				config: __dirname + "/stealconfig.js",
				main: "transpile_error/main"
			}, {
				minify: false,
				quiet: true
			}).then(function(){
				assert(false, "Succeeded when it should not have");
			}, function(err){
				assert(/Unable to transpile transpile_error\/main:/.test(err.message),
					   "Reports the module that had the transpile error");
			}).then(done, done);
		});

	});

	describe("bundleAssets", function(){
        this.timeout(5000);

		before(function(done){
			asap(rmdir)(__dirname + "/bundle_assets/dist")
				.then(function(){
					done();
				});
		});

		it("works", function(done){
			multiBuild({
				config: __dirname + "/bundle_assets/package.json!npm"
			}, {
				quiet: true,
				bundleAssets: true
			}).then(function(){
				open("test/bundle_assets/prod.html", function(browser, close){
					find(browser, "MODULE", function(module){
						assert(true, "page loaded correctly");
						close();
					}, close);
				}, done);
			});
		});
	});

	describe("multi-main", function(){
		it("should work", function(done){
			var mains = ["app_a","app_b","app_c","app_d"],
				ab = {name: "a_b"},
				cd = {name: "c_d"},
				all = {name: "all"},
				results = {
					app_a: {
						name: "a", ab: ab, all: all
					},
					app_b: {
						name: "b", ab: ab, all: all
					},
					app_c:{
						name: "b", cd: cd, all: all
					},
					app_d:{
						name: "d", cd: cd, all: all
					}
				};

			rmdir(__dirname+"/multi-main/dist", function(error){
				if(error){
					done(error)
				}

				multiBuild({
					config: __dirname+"/multi-main/config.js",
					main: mains.slice()
				}, {
					quiet: true
					//verbose: true
				}).then(function(data){

					var checkNext = function(next){
						if(next) {
							open("test/multi-main/"+next+".html",function(browser, close){
								find(browser,"app", function(app){

									assert(true, "got app");
									comparify(results[next], app);
									close();

								}, close);

							}, function(err){
								if(err) {
									done(err);
								} else {
									var mynext = mains.shift();
									if(mynext) {
										setTimeout(function(){
											checkNext(mynext)
										},1);
									} else {
										done();
									}
								}
							});
						}
					};
					checkNext( mains.pop() );

				}).catch(function(e){
					done(e);
				});
			});
		});

		it("works with npm plugin", function(done){
			var mains = [
				"app_a","app_b",
				"app_c","app_d"
			],
				ab = {name: "a_b"},
				cd = {name: "c_d"},
				all = {name: "all"},
				results = {
					app_a: {
						name: "a", ab: ab, all: all
					},
					app_b: {
						name: "b", ab: ab, all: all
					},
					app_c:{
						name: "b", cd: cd, all: all
					},
					app_d:{
						name: "d", cd: cd, all: all
					}
				};

			rmdir(__dirname+"/multi-main/dist", function(error){
				if(error){
					done(error);
					return;
				}

				multiBuild({
					config: __dirname+"/multi-main/package.json!npm",
					main: mains.slice()
				}, {
					quiet: true,
					minify: false
				}).then(function(data){

					var checkNext = function(next){
						if(next) {
							open("test/multi-main/npm_"+next+".html",function(browser, close){
								find(browser,"app", function(app){

									assert(true, "got app");
									comparify(results[next], app);
									close();

								}, close);

							}, function(err){
								if(err) {
									done(err);
								} else {
									var mynext = mains.shift();
									if(mynext) {
										setTimeout(function(){
											checkNext(mynext)
										},1);
									} else {
										done();
									}
								}
							});
						}
					};
					checkNext( mains.pop() );

				}).catch(function(e){
					done(e);
				});
			});
		});


		it("works with steal bundled", function(done){
			var mains = ["app_a","app_b","app_c","app_d"],
				ab = {name: "a_b"},
				cd = {name: "c_d"},
				all = {name: "all"},
				results = {
					app_a: {
						name: "a", ab: ab, all: all
					},
					app_b: {
						name: "b", ab: ab, all: all
					},
					app_c:{
						name: "b", cd: cd, all: all
					},
					app_d:{
						name: "d", cd: cd, all: all
					}
				};

			rmdir(__dirname+"/multi-main/dist", function(error){
				if(error){
					done(error)
				}

				multiBuild({
					config: __dirname+"/multi-main/config.js",
					main: mains
				}, {
					bundleSteal: true,
					quiet: true,
					minify: false
				}).then(function(data){
					var checkNext = function(next){
						if(next) {
							open("test/multi-main/bundle_"+next+".html",function(browser, close){
								find(browser,"app", function(app){

									assert(true, "got app");
									comparify(results[next], app);
									close();

								}, close);

							}, function(err){
								if(err) {
									done(err);
								} else {
									var mynext = mains.shift();
									if(mynext) {
										setTimeout(function(){
											checkNext(mynext)
										},1);
									} else {
										done();
									}
								}
							});
						}
					};
					checkNext( mains.pop() );

				}).catch(function(e){
					done(e);
				});
			});
		});
	});

	describe("@loader used in configs", function() {

		it("works built", function(done) {

			rmdir(__dirname+"/current-loader/dist", function(error){
				if(error){
					done(error)
				}
				// build the project that uses @loader
				multiBuild({
					config: __dirname + "/current-loader/config.js",
					main: "main"
				}, {
					quiet: true,
					minify: false
				}).then(function(){
					// open the prod page and make sure
					// and make sure the module loaded successfully
					open("test/current-loader/config-prod.html", function(browser, close){

						find(browser,"moduleValue", function(moduleValue){
							assert.equal(moduleValue, "Loader config works", "@loader worked when built.");
							close();
						}, close);

					}, done);

				}).catch(done);
			});


		});


		it("works built with plugins", function(done) {

			rmdir(__dirname+"/current-loader/dist", function(error){
				if(error){
					done(error)
				}
				// build the project that uses @loader
				multiBuild({
					config: __dirname + "/current-loader/config.js",
					main: "main-plugin"
				}, {
					quiet: true,
					minify: false
				}).then(function(){
					// open the prod page and make sure
					// and make sure the module loaded successfully
					open("test/current-loader/config-plugin.html", function(browser, close){

						find(browser,"moduleValue", function(moduleValue){
							assert.equal(moduleValue, "Loader config works", "@loader worked when built.");
							close();
						}, close);

					}, done);

				}).catch(done);
			});


		});


		it("works with es6", function(done) {
			rmdir(__dirname+"/current-loader/dist", function(error){
				if(error){
					done(error)
				}
				// build the project that uses @loader
				multiBuild({
					config: __dirname + "/current-loader/esconfig.js",
					main: "main"
				}, {
					quiet: true,
					minify: false
				}).then(function(){
					// open the prod page and make sure
					// and make sure the module loaded successfully
					open("test/current-loader/prod.html", function(browser, close){

						find(browser,"moduleValue", function(moduleValue){
							assert.equal(moduleValue, "Loader config works", "@loader worked when built.");
							close();
						}, close);

					}, done);

				}).catch(done);
			});

		});

		it("supports multiple builds at once", function(done){
			rmdir(__dirname+"/bundle/dist", function(error){
				if(error){ return done(error); }

				var first = multiBuild({
						config: __dirname+"/bundle/stealconfig.js",
						main: "bundle",
						systemName: "1"
					}, {
						quiet: true
					});

				var second = multiBuild({
						config: __dirname+"/bundle/stealconfig.js",
						main: "bundle",
						bundlesPath: __dirname+"/bundle_multiple_builds",
						systemName: "2"
					}, {
						quiet: true
					})

				Promise.all([first, second]).then(function(data){
					done();
				}).catch(done);
			});
		});
	});

	describe("importing into config", function(){
		it("works", function(done){
			rmdir(__dirname + "/import-config/dist", function(error){
				if(error) return done(error);

				multiBuild({
					config: __dirname + "/import-config/config.js",
					main: "main"
				}, {
					quiet: true
				}).then(function(){
					open("test/import-config/prod.html", function(browser, close){

						find(browser,"moduleValue", function(moduleValue){
							assert.equal(moduleValue, "it worked", "Importing a config within a config works");
							close();
						}, close);

					}, done);
				}).catch(done);
			});
		});

		it("works bundled with steal", function(done){
			rmdir(__dirname + "/import-config/dist", function(error){
				if(error) return done(error);

				multiBuild({
					config: __dirname + "/import-config/config.js",
					main: "main"
				}, {
					quiet: true,
					bundleSteal: true
				}).then(function(){
					open("test/import-config/bundled.html", function(browser, close){

						find(browser,"moduleValue", function(moduleValue){
							assert.equal(moduleValue, "it worked", "Importing a config within a config works");
							close();
						}, close);

					}, done);
				}).catch(done);
			});
		});
	});

	describe("npm with directories.lib", function(){
		beforeEach(function(done){
			asap(rmdir)(__dirname + "/npm-directories/dist").then(function(){
				return multiBuild({
					config: __dirname + "/npm-directories/package.json!npm"
				}, {
					quiet: true
				});
			}).then(function(){
				done();
			}, done);
		});

		it("creates pretty shared bundle names", function(done){
			var sharedBundleName = __dirname+"/npm-directories/dist/bundles/" +
				"category-home.js";
			fs.exists(sharedBundleName, function(exists){
				assert.ok(exists, "shared bundle name was created");
				done();
			});
		});
	});

	describe("npm package.json builds", function(){
		this.timeout(5000);

		beforeEach(function() {

		});


		var setup = function(done){
			rmdir(path.join(__dirname, "npm", "node_modules"), function(error){
				if(error){ return done(error); }

				rmdir(path.join(__dirname, "npm", "dist"), function(error){
					if(error){ return done(error); }

					fs.copy(path.join(__dirname, "..", "node_modules","jquery"),
						path.join(__dirname, "npm", "node_modules", "jquery"), function(error){

						if(error){ return done(error); }

						fs.copy(
							path.join(__dirname, "..", "bower_components","steal"),
							path.join(__dirname, "npm", "node_modules", "steal"), function(error){

							if(error){ return done(error); }

							fs.copy(
								path.join(__dirname, "..", "bower_components","steal"),
								__dirname+"/npm/node_modules/steal", function(error){

								if(error){ return done(error); }

								done()

							});

						});
					});
				});
			});
		};

		it("only needs a config", function(done){
			this.timeout(50000);
			setup(function(error){
				if(error){ return done(error); }

				multiBuild({
					config: path.join(__dirname, "npm", "package.json!npm")
				}, {
					quiet: true,
					minify: false
				}).then(function(){
					// open the prod page and make sure
					// and make sure the module loaded successfully
					open("test/npm/prod.html", function(browser, close){
						var h1s = browser.window.document.getElementsByTagName('h1');
						assert.equal(h1s.length, 1, "Wrote H!.");
						close();
					}, done);

				}).catch(done);

			});

		});

		it("works with bundleSteal", function(done){
			this.timeout(50000);
			setup(function(error){
				if(error){ return done(error); }

				multiBuild({
					config: path.join(__dirname, "npm", "package.json!npm")
				}, {
					quiet: true,
					minify: false,
					bundleSteal: true
				}).then(function(){
					// open the prod page and make sure
					// and make sure the module loaded successfully
					open("test/npm/prod-bundled.html", function(browser, close){
						var h1s = browser.window.document.getElementsByTagName('h1');
						assert.equal(h1s.length, 1, "Wrote H!.");
						close();
					}, done);

				}).catch(done);

			});

		});

		it("only needs a config and works with bundles", function(done){
			setup(function(error){
				if(error){ return done(error); }

				multiBuild({
					config: __dirname + "/npm/package.json!npm",
					bundle: ["npm-test/two", "npm-test/three"]
				}, {
					quiet: true,
					minify: false
				}).then(function(){
					// Make sure they are named correctly.
					assert(fs.existsSync(__dirname + "/npm/dist/bundles/two.js"),
										 "two bundle in the right place");

					// open the prod page and make sure
					// and make sure the module loaded successfully
					open("test/npm/prod-bundle.html", function(browser, close){
						var h1s = browser.window.document.getElementsByTagName('h1');
						assert.equal(h1s.length, 1, "Wrote H!.");
						close();
					}, done);

				}).catch(done);
			});
		});
	});

	describe("with long bundle names", function(){

		it("should work", function(done){
			rmdir(__dirname+"/long_bundle_names/dist", function(error){
				if(error){
					done(error)
				}

				multiBuild({
					config: __dirname+"/long_bundle_names/stealconfig.js",
					main: "bundle"
				}, {
					quiet: true
				}).then(function(data){
					open("test/long_bundle_names/bundle.html#a",function(browser, close){
						find(browser,"appA", function(appA){
								assert(true, "got A");
								assert.equal(appA.name, "a", "got the module");
								assert.equal(appA.ab.name, "a_b", "a got ab");
								close();
						}, close);
					}, done);


				}).catch(function(e){
					done(e);
				});
			});
		});

		it("should truncate and hash long bundle names", function(done){
			rmdir(__dirname+"/long_bundle_names/dist", function(error){
				if(error){
					done(error)
				}

				multiBuild({
					config: __dirname+"/long_bundle_names/stealconfig.js",
					main: "bundle"
				}, {
					quiet: true
				}).then(function(data){

					assert(fs.existsSync("test/long_bundle_names/dist/bundles/app_a_with_a_ver-5797ef41.js"));
					assert(fs.existsSync("test/long_bundle_names/dist/bundles/app_a_with_a_ver-8702980e.js"));

					fs.readFile("test/long_bundle_names/dist/bundles/bundle.js", "utf8", function(err, data) {
						if (err) {
							done(err);
						}
						assert(data.indexOf("app_a_with_a_ver-5797ef41"));
						assert(data.indexOf("app_a_with_a_ver-8702980e"));
						done();
					});

				}).catch(function(e){
					done(e);
				});
			});
		});

	});

	describe("Source Maps", function(){
		this.timeout(5000);

		it("basics works", function(done){
			rmdir(__dirname+"/bundle/dist", function(error){
				if(error){
					done(error);
				}

				multiBuild({
					config: __dirname+"/stealconfig.js",
					main: "basics/basics",
					transpiler: "babel"
				}, {
					quiet: true,
					sourceMaps: true,
					minify: true
				}).then(function(data){
					var exists = fs.existsSync(path.join(__dirname,"dist/bundles/basics/basics.js.map"));
					if(!exists) {
						done(new Error("no bundle info"));
						return;
					}
					done();
				}, done);
			});
		});

		it("works with clean and css", function(done){
			rmdir(__dirname+"/bundle/dist", function(error){
				if(error){
					done(error);
				}

				multiBuild({
					config: __dirname+"/stealconfig.js",
					main: "sourcemaps/basics",
					transpiler: "babel"
				}, {
					quiet: true,
					sourceMaps: true,
					minify: false,
					bundleSteal: true
				}).then(function(data){
					var exists = fs.existsSync(path.join(__dirname,"dist/bundles/sourcemaps/basics.js.map"));
					if(!exists) {
						done(new Error("no bundle info"));
						return;
					}
					done();
				}, done);
			});
		});
	});
});
