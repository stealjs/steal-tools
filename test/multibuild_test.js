var asap = require("pdenodeify");
var assert = require("assert");
var comparify = require("comparify");
var fs = require("fs-extra");
var multiBuild = require("../lib/build/multi");
var rmdir = require("rimraf");
var path = require("path");
var testHelpers = require("./helpers");
var fileExists = require("./file_exists");
var escapeRegExp = require("lodash/escapeRegExp");

var find = testHelpers.find;
var open = testHelpers.open;

describe("multi build", function(){
	this.timeout(5000);

	it("should work", function(done){
		rmdir(__dirname+"/bundle/dist", function(error){
			if(error){
				done(error);
				return;
			}

			multiBuild({
				config: __dirname+"/bundle/stealconfig.js",
				main: "bundle"
			}, {
				minify: false,
				quiet: true
			}).then(function(){
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
				main: "main",
				transpiler: "traceur"
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

	it("should minify by default", function() {
		var config = {
			config: path.join(__dirname, "minify", "config.js"),
			main: "minify"
		};

		return asap(rmdir)(path.join(__dirname, "minify", "dist"))
			.then(function() {
				return multiBuild(config, { quiet: true });
			})
			.then(function() {
				var main = path.join(__dirname, "minify", "dist", "bundles", "minify.js");
				var actualJS = fs.readFileSync(main, "utf8");

				var hasLongVariable = actualJS.indexOf("thisObjectHasABigName") !== -1;
				var hasGlobalLongVariable = actualJS.indexOf("anotherVeryLongName") !== -1;
				var hasDevCode = actualJS.indexOf("remove this") !== -1;
				var hasEnvifyCode = actualJS.indexOf("when envify is turned on this should be removed") !== -1;

				assert(hasEnvifyCode, "Minified source has envify test code removed.");
				assert(!hasDevCode, "Minified source has dev code removed.");
				assert(!hasLongVariable, "Minified source renamed long variable.");
				assert(!hasGlobalLongVariable, "Minified source includes a global that was minified.");
			});
	});

	it("should allow turning envify on", function() {
		var config = {
			config: path.join(__dirname, "minify", "config.js"),
			main: "minify"
		};

		var options = {
			quiet: true,
			envify: true
		};

		return asap(rmdir)(path.join(__dirname, "minify", "dist"))
			.then(function() {
				process.env.ENVIFY_VAR = "test_value";
				return multiBuild(config, options);
			})
			.then(function() {
				delete process.env.ENVIFY_VAR;

				var main = path.join(__dirname, "minify", "dist", "bundles", "minify.js");
				var actualJS = fs.readFileSync(main, "utf8");

				var hasLongVariable = actualJS.indexOf("thisObjectHasABigName") !== -1;
				var hasGlobalLongVariable = actualJS.indexOf("anotherVeryLongName") !== -1;
				var hasDevCode = actualJS.indexOf("remove this") !== -1;
				var hasEnvifyCode = actualJS.indexOf("when envify is turned on this should be removed") !== -1;

				assert(!hasEnvifyCode, "Minified source has kept envify test code.");
				assert(!hasDevCode, "Minified source has dev code removed.");
				assert(!hasLongVariable, "Minified source renamed long variable.");
				assert(!hasGlobalLongVariable, "Minified source includes a global that was minified.");
			});
	});

	it("should allow minification to be turned off", function() {
		var config = {
			config: path.join(__dirname, "minify", "config.js"),
			main: "minify"
		};

		var options = {
			minify: false,
			quiet: true
		};

		return asap(rmdir)(path.join(__dirname, "minify", "dist"))
			.then(function() {
				return multiBuild(config, options);
			})
			.then(function() {
				var main = path.join(__dirname, "minify", "dist", "bundles", "minify.js");
				var actualJS = fs.readFileSync(main, "utf8");

				var hasLongVariable = actualJS.indexOf("thisObjectHasABigName") !== -1;
				assert(hasLongVariable, "Source includes long variable name.");
			});
	});

	it("should allow setting uglify-js options", function() {
		var config = {
			config: path.join(__dirname, "minify", "config.js"),
			main: "minify"
		};

		var options = {
			quiet: true,
			uglifyOptions: {
				mangle: false // skip mangling names.
			}
		};

		return asap(rmdir)(path.join(__dirname, "minify", "dist"))
			.then(function() {
				return multiBuild(config, options);
			})
			.then(function() {
				var main = path.join(__dirname, "minify", "dist", "bundles", "minify.js");
				var actualJS = fs.readFileSync(main, "utf8");

				var hasLongVariable = actualJS.indexOf("thisObjectHasABigName") !== -1;
				var hasAnotherLongVariable = actualJS.indexOf("anotherLongObjectName") !== -1;

				assert(hasLongVariable, "Skip mangling names in dependencies graph files");
				assert(hasAnotherLongVariable, "skip mangling names in stealconfig and main files");
			});
	});

	it("Allows specifying an alternative dist directory", function(done){
		var config = {
			config: __dirname + "/other_bundle/stealconfig.js",
			main: "bundle"
		};

		var options = {
			dest: __dirname + "/other_bundle/other_dist",
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

	it("Throws if you use bundlesPath configuration", function(done){
		multiBuild({
			config: __dirname + "/some/fake/dir/package.json!npm",
			bundlesPath: __dirname + "/some/fake/dir/bundles"
		}, {
			quiet: false
		})
		.then(function(){
			assert.ok(false, "This should not have succeeded");
		}, function(err){
			var msg = err.message;
			assert.ok(/bundlesPath has been removed/.test(msg),
					  "Rejected because bundlesPath is used");
		})
		.then(done);
	});


	it("Allows specifying dist as the current folder", function(done){
        this.timeout(5000);
		var config = {
			config: __dirname + "/other_bundle/stealconfig.js",
			main: "bundle"
		};

		var options = {
			dest: __dirname + "/other_bundle",
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

	it("supports bundling steal", function(done) {
		var base = path.join(__dirname, "bundle");

		asap(rmdir)(path.join(base, "dist"))
			.then(function() {
				return multiBuild({
					main: "bundle",
					config: path.join(base, "stealconfig.js")
				}, {
					quiet: true,
					minify: false,
					bundleSteal: true,
					dest: path.join(base, "dist")
				});
			})
			.then(function(){
				open("test/bundle/packaged_steal.html#a",function(browser, close){
					find(browser,"appA", function(appA){
						var loader = browser.window.System;

						assert(true, "got A");
						assert.equal(appA.name, "a", "got the module");
						assert.equal(appA.ab.name, "a_b", "a got ab");

						// environment is set to production
						assert.equal(
							loader.env,
							"window-production",
							"bundle steal is always production"
						);
						close();
					}, close);
				}, done);
			})
			.catch(done);
	});

	it("allows bundling steal and loading from alternate locations", function(done){

		rmdir(__dirname+"/bundle/alternate", function(error){
			if(error){
				done(error);
			}

			multiBuild({
				config: __dirname+"/bundle/stealconfig.js",
				main: "bundle"
			},{
				bundleSteal: true,
				dest: __dirname + "/bundle/alternate",
				quiet: true,
				minify: false
			}).then(function(){

				open("test/bundle/folder/packaged_steal.html#a",function(browser, close){
					find(browser,"appA", function(appA){
						var loader = browser.window.System;

						assert(true, "got A");
						assert.equal(appA.name, "a", "got the module");
						assert.equal(appA.ab.name, "a_b", "a got ab");

						// environment is set to production
						assert.equal(loader.env, 'window-production', "bundle steal is always production");

						close();
					}, close);
				}, done);


			}).catch(function(e){
				done(e);
			});



		});


	});

	it("builds and can load transpiled ES6 modules", function(done){
		this.timeout(60000);

		var base = path.join(__dirname, "basics");

		asap(rmdir)(path.join(base, "dist"))
			.then(function() {
				return multiBuild({
					config: path.join(__dirname, "stealconfig.js"),
					main: "basics/basics"
				}, {
					quiet: true,
					minify: false,
					dest: path.join(base, "dist")
				});
			})
			.then(function() {
				open("test/basics/prod.html",function(browser, close){
					find(browser,"MODULE", function(module){
						assert.equal(
							module.name,
							"module",
							"module name is right"
						);

						assert.equal(
							module.es6module.name,
							"es6Module",
							"steal loads ES6"
						);

						assert.equal(
							module.es6module.amdModule.name,
							"amdmodule",
							"ES6 loads amd"
						);

						close();
					}, close);
				}, done);
			}, done);
	});

	it("System.instantiate works when bundling steal", function(done){
		rmdir(__dirname+"/dist", function(error){
			if(error){
				return done(error);
			}

			multiBuild({
				config: __dirname+"/stealconfig.js",
				main: "basics/basics"
			}, {
				bundleSteal: true,
				quiet: true,
				minify: false
			}).then(function(){
				open("test/basics/prod-inst.html",function(browser, close){
					find(browser,"MODULE", function(){
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
				done(error);
			}

			multiBuild({
				config: __dirname+"/stealconfig.js",
				main: "basics/"
			}, {
				quiet: true,
				minify: false
			}).then(function(){
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

	it("can load projects that use require('./package'); convention", function(done){
		rmdir(__dirname + "/pkg_json/dist", function(err){
			if(err) return done(err);

			var p = multiBuild({
				config: __dirname + "/pkg_json/package.json!npm"
			}, {
				quiet: true,
				minify: false
			});

			p.then(function(){
				done();
			});
		});
	});

	describe("sideBundle", function(){
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
						find(browser, "MODULE", function(){
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

		it("can be declared in a child package", function(done){
			rmdir(__dirname+"/side_bundle/dist", function(error){
				if(error) return done(error);

				multiBuild({
					config: __dirname + "/side_bundle_dep/package.json!npm"
				}, {
					quiet: true,
					minify: false
				}).then(function(){
					open("test/side_bundle_dep/prod.html", function(browser, close){
						find(browser, "MODULE", function(){
							var loader = browser.window.System;

							comparify(loader.bundles, {
								"bundles/dep/b": [ "dep@1.0.0#c","dep@1.0.0#d","dep@1.0.0#b" ]
							}, true);

							close();
						}, close);
					}, done);
				});
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

	it("Is able to load progressively loaded app with progressively loaded package.json data", function(done){
		rmdir(__dirname+"/progressive_package/dist", function(error){
			if(error) return done(error);

			multiBuild({
				config: __dirname + "/progressive_package/package.json!npm"
			}, {
				minify: false,
				quiet: true
			}).then(function(){
				open("test/progressive_package/prod.html",
					 function(browser, close){
					find(browser, "MODULE", function(module){
						var a = module.a;
						var b = module.b;
						assert.equal(a.name, "dep2", "loaded dep2");
						assert.equal(a.dep3, "dep3", "loaded dep3");

						assert.equal(b.name, "dep4", "loaded dep4");
						assert.equal(b.dep5, "dep5", "loaded dep5");

						assert.equal(module.foo, "bar", "configDependency code ran");
						close();
					}, close);
				}, done);
			});
		});
	});

	it("Loads an ES6 module that consumes CJS modules using {}", function(done){
		rmdir(__dirname + "/es_cjs/dist", function(error){
			if(error) return done(error);

			multiBuild({
				config: __dirname + "/es_cjs/package.json!npm"
			}, {
				minify: false,
				quiet: true
			}).then(function(){
				open("test/es_cjs/prod.html", function(browser, close){
						find(browser, "MODULE", function(mod){
							assert.equal(mod.x, "foo", "got module that uses " +
										 "{} for imports");
							assert.equal(mod.y, "bar", "got module using default");

							close();
						}, close);
				}, done);
			});
		});
	});

	it("Circular refs works with Babel", function(done){
		rmdir(__dirname+"/circular/dist", function(error){
			if(error){
				done(error);
				return;
			}

			multiBuild({
				config: __dirname+"/circular/package.json!npm",
			}, {
				quiet: true,
				minify: false
			}).then(function(){
				open("test/circular/prod.html",function(browser, close){
					find(browser,"circularWorks", function(result){
						assert.equal(result, true, "circular refs worked");
						close();
					}, close);
				}, done);
			}, done);
		});
	});

	it("circular refs using default imports work with Babel (#802)", function(done) {
		var base = path.join(__dirname, "circular_default");

		asap(rmdir)(path.join(base, "dist"))
			.then(function() {
				return multiBuild({
					config: path.join(base, "stealconfig.js"),
				}, {
					quiet: true,
					minify: false,
					dest: path.join(base, "dist")
				});
			})
			.then(function() {
				open("test/circular_default/prod.html", function(browser, close) {
					find(browser, "circular", function(circular) {
						assert.equal(
							circular.foo,
							circular.bar,
							"circular refs worked"
						);
						close();
					}, close);
				}, done);
			}, done);
	});

	describe("with plugins", function(){
		this.timeout(60000);

		it("work on the client", function(done){
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
					done(error);
				}
				// build the project that
				// uses a plugin

				multiBuild({
					config: __dirname+"/plugins/config.js",
					main: "main"
				}, {
					quiet: true,
					minify: false
				}).then(function(){
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
					done(error);
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
				}).then(function(){
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

	describe("@loader used in configs", function() {

		it("works built", function(done) {

			rmdir(__dirname+"/current-loader/dist", function(error){
				if(error){
					done(error);
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
					done(error);
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
					done(error);
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
						systemName: "2"
					}, {
						dest: __dirname + "/bundle_multiple_builds",
						quiet: true
					});

				Promise.all([first, second]).then(function(){
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
				})
				.catch(done);
			});
		});
	});

	describe("npm with directories.lib", function(){
		beforeEach(function(done){
			asap(rmdir)(__dirname + "/npm-directories/dist").then(function(){
				return multiBuild({
					baseURL: __dirname + "/npm-directories"
				}, {
					minify: false,
					quiet: true
				});
			}).then(function(){
				done();
			}, done);
		});

		it("creates pretty shared bundle names", function(done){
			var sharedBundleName = __dirname+"/npm-directories/dist/bundles/" +
				"category-home.js";

			var mainBundleName = __dirname+"/npm-directories/dist/bundles/npm-dependencies/" +
				"main.js";

			fs.exists(sharedBundleName, function(exists){
				assert.ok(exists, "shared bundle name was created in the right folder");

				fs.exists(mainBundleName, function(exists){
					assert.ok(exists, "main bundle was created in the package folder");
					done();
				});

			});

		});
	});

	describe("npm package.json builds", function(){
		this.timeout(5000);

		var ab = {name: "a_b"},
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
						name: "c", cd: cd, all: all
					},
					app_d:{
						name: "d", cd: cd, all: all
					}
				};


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

								done();

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
					config: path.join(__dirname, "npm", "package.json!npm"),
					transpiler: "traceur"
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
					assert(fs.existsSync(__dirname + "/npm/dist/bundles/npm-test/two.js"),
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

		it("with a single (string) package-module", function(done){
			rmdir(__dirname+"/npm-multi-main/dist", function(error){
				if(error){
					done(error);
					return;
				}

				multiBuild({
					config: __dirname+"/npm-multi-main/package.json!npm",
					main: "multi-main/app_a"
				}, {
					quiet: true,
					minify: false,
					//bundleSteal: true
				}).then(function(){

					open("test/npm-multi-main/app_a.html",function(browser, close){
						find(browser,"app", function(app){
							assert(true, "app found");
							assert.equal(app.name, "a", "app loaded");
							assert.deepEqual(app, results.app_a, "deps are all loaded");
							close();
						}, close);
					}, done);

				}).catch(function(e){
					done(e);
				});
			});
		});
	});

	describe("do not transpile and bundle ignored modules", function(){
		this.timeout(5000);

		beforeEach(function() {});

		var setup = function(done){
			rmdir(path.join(__dirname, "bundle_false", "dist"), function (error) {
				if (error) {
					return done(error);
				}
				done();
			});
		};

		var setupWithCDN = function(done){
			rmdir(path.join(__dirname, "bundle_false_cdn", "dist"), function (error) {
				if (error) {
					return done(error);
				}
				done();
			});
		};


		it("set meta information from package.json and build-config", function(done){
			multiBuild({
				config: __dirname + "/bundle_false/package.json!npm",
				main: "src/main",
				meta: {
					foo: "bar"
				}
			}, {
				quiet: true,
				minify: false
			}).then(function (data) {
				assert.equal(data.buildLoader.meta['bar'], "foo", "package.json-meta information is set correctly");
				assert.equal(data.buildLoader.meta['foo'], "bar", "build-config-meta information is set correctly");
				done();
			}).catch(done);
		});

		it("merge meta data with package.json", function(done){
			multiBuild({
				config: __dirname + "/bundle_false/package.json!npm",
				main: "src/main",
				meta: {
					jqueryt: {
						"bar": "foo"
					},
					foobar: {
						"bar": "foo"
					}
				}
			}, {
				quiet: true,
				minify: false
			}).then(function (data) {
				assert.equal(data.loader.meta['foobar']['bar'], "foo", "foobar should be also have 'bar' = 'foo'");
				assert.equal(data.loader.meta['jqueryt@2.2.0#dist/jqueryt']['bar'], "foo", "jqueryt@2.2.0#dist/jqueryt should be also have 'bar' = 'foo'");
				done();
			}).catch(done);
		});

		it("set bundle=false correctly", function(done){
			setup(function(error) {
				if (error) {
					return done(error);
				}

				multiBuild({
					config: __dirname + "/bundle_false/package.json!npm",
					main: "src/main",
					meta: {
						jqueryt: {
							bundle: false
						},
						'src/dep': {
							bundle: false
						}
					}
				}, {
					quiet: true,
					minify: false
				}).then(function (data) {
					assert.strictEqual(data.graph['src/dep'].load.metadata.bundle, false, 'set bundle=false to dependent module');
					assert.strictEqual(data.graph['jqueryt@2.2.0#dist/jqueryt'].load.metadata.bundle, false, 'set bundle=false to normalized jquery');

					assert.equal(data.loader.meta['foobar']['foo'], "bar", "foobar should be also have 'foo'='bar'");
					assert.equal(data.loader.meta['jqueryt@2.2.0#dist/jqueryt']['foo'], "bar", "jqueryt@2.2.0#dist/jqueryt should also have 'foo'='bar'");
					assert.equal(data.graph['jqueryt@2.2.0#dist/jqueryt'].load.metadata.foo, "bar", "jqueryt@2.2.0#dist/jqueryt should also have 'foo'='bar'");
					done();
				}).catch(done);
			});
		});

		it("set the ignore array option on metadata", function(done){
			setup(function(error) {
				if (error) {
					return done(error);
				}

				multiBuild({
					config: __dirname + "/bundle_false/package.json!npm",
					main: "src/main"
				}, {
					quiet: true,
					minify: false,
					ignore: [
						'jqueryt',
						'src/dep'
					]
				}).then(function (data) {
					assert.strictEqual(data.graph['src/dep'].load.metadata.bundle, false, 'set bundle=false to dependent module');
					assert.strictEqual(data.graph['jqueryt@2.2.0#dist/jqueryt'].load.metadata.bundle, false, 'set bundle=false to normalized jquery');
					done();
				}).catch(done);
			});
		});


		it("should not include src/dep and jqueryt into the bundled file", function(done){
			setup(function(error) {
				if (error) {
					return done(error);
				}

				multiBuild({
					config: __dirname + "/bundle_false/package.json!npm",
					main: "src/main"
				}, {
					quiet: true,
					minify: false,
					ignore: [
						'jqueryt',
						'src/dep'
					]
				}).then(function(data){

					// in production config this module should map to @empty if it is not needed
					// a feature can be, steal set automaticly @empty if the module is set with bundles:false in package.json
					assert.equal(data.loader.envs['window-production'].map.jqueryt, '@empty', 'ignore modules must declare as @empty');

					// bundle exists
					assert.ok(fs.existsSync(__dirname + "/bundle_false/dist/bundles/src/main.js"), "bundle main");

					var code = fs.readFileSync(__dirname+"/bundle_false/dist/bundles/src/main.js",
						"utf8");
					assert.ok(!/\*src\/dep\*/.test(code), "src/dep module is not inside");
					assert.ok(!/\*jqueryt@2.2.0#dist\/jqueryt\*/.test(code), "jqueryt module is not inside");

					open("test/bundle_false/prod.html",function(browser, close){

						find(browser,"MODULE", function(module){
							assert.ok(module);
							assert.equal(typeof module.name, "undefined", "depending Module shouldn't have been loaded");
						}, close);

						find(browser,"$", function(jqueryt){
							// jqueryt is mapped to @empty
							assert.ok(jqueryt);
								var jversion = false;
							try{
								jversion = jqueryt.fn.version;
							}catch(e){}
							assert.strictEqual(jversion, false, "jqueryt Module shouldn't have been loaded");
							close();
						}, close);

					}, done);
				}).catch(done);
			});
		});

		it("should jqueryt exclude from bundle and load it from CDN", function(done){
			this.timeout(5000);

			setupWithCDN(function(error) {
				if (error) {
					return done(error);
				}

				multiBuild({
					config: __dirname + "/bundle_false_cdn/package.json!npm",
					main: "src/main"
				}, {
					quiet: true,
					minify: false,
					ignore: [
						"jqueryt"
					]
				}).then(function(data){

					assert.equal(data.loader.envs['window-production'].paths.jqueryt, '//code.jquery.com/jquery-2.2.0.js', 'CDN is set');

					// bundle exists
					assert.ok(fs.existsSync(__dirname + "/bundle_false_cdn/dist/bundles/src/main.js"), "bundle main");

					var code = fs.readFileSync(__dirname+"/bundle_false_cdn/dist/bundles/src/main.js",
						"utf8");
					assert.ok(!/\*jqueryt@2.2.0#dist\/jqueryt\*/.test(code), "jqueryt module is not inside");

					open("test/bundle_false_cdn/prod.html", function(browser, close){

						browser.assert.text('h1', 'Hello World');
						close();
					}, done);

				}).catch(done);
			});
		});

		it("should transpile src/dep and not jqueryt into AMD", function(done){
			setup(function(error) {
				if (error) {
					return done(error);
				}

				multiBuild({
					config: __dirname + "/bundle_false/package.json!npm",
					main: "src/main"
				}, {
					quiet: true,
					minify: false,
					ignore: [
						'jqueryt'
					]
				}).then(function(data){

					// since we transpile all js files into a AMD format we can check
					// * if source and amdSource is the same
					// * amdSource begins not with "define(\'MODULENAME\',
					// when bundle=false
					var module = 'jqueryt@2.2.0#dist/jqueryt';
					var source = data.graph[module].load.source;
					var amdSource = data.graph[module].activeSource.code;

					assert.equal(source, amdSource, "jquery is not transpiled into AMD");
					assert.notEqual(amdSource.substr(0, 10+module.length), "define('"+module+"',");

					module = 'src/dep';
					source = data.graph[module].load.source;
					amdSource = data.graph[module].activeSource.code;

					assert.notEqual(source, amdSource, "src/dep is transpiled into AMD");
					assert.equal(amdSource.substr(0, 10+module.length), "define('"+module+"',");

					done();
				}).catch(done);
			});
		});

		it("buildConfig is not included in the build", function (done) {
			rmdir(__dirname +"/build_config/dist", function (error) {
				if (error) {
					return done(error);
				}

				multiBuild({
					config: __dirname + "/build_config/config.js",
					main: "main"
				}, {
					minify: false,
					quiet: true,
					ignore: [
						'two'
					]
				}).then(function () {
					// Verify that the buildConfig item is not included
					var js = fs.readFileSync(__dirname + "/build_config/dist/bundles/main.js", "utf8");
					assert(!/define\('two/.test(js), "two not included");
				})
				.then(done, done);
			});
		});
	});

	describe("with long bundle names", function(){

		it("should work", function(done){
			rmdir(__dirname+"/long_bundle_names/dist", function(error){
				if(error){
					done(error);
				}

				multiBuild({
					config: __dirname+"/long_bundle_names/stealconfig.js",
					main: "bundle"
				}, {
					quiet: true
				}).then(function(){
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
					done(error);
				}

				multiBuild({
					config: __dirname+"/long_bundle_names/stealconfig.js",
					main: "bundle"
				}, {
					quiet: true
				}).then(function(){

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
		this.timeout(60000);

		it("basics works", function() {
			return asap(rmdir)(path.join(__dirname, "bundle", "dist"))
				.then(function() {
					return multiBuild({
						config: __dirname+"/stealconfig.js",
						main: "basics/basics",
						transpiler: "traceur"
					}, {
						quiet: true,
						sourceMaps: true,
						minify: true
					});
				})
				.then(function() {
					return fileExists(path.join(__dirname, "dist", "bundles", "basics", "basics.js.map"));
				});
		});

		it("works with configDependencies", function() {
			var readFile = asap(fs.readFile);
			var base = path.join(__dirname, "npm-config-dep");

			return asap(rmdir)(path.join(base, "dist"))
				.then(function(){
					return multiBuild({
						config: path.join(base, "package.json!npm")
					}, {
						quiet: true,
						sourceMaps: true,
						sourceMapsContent: true,
						minify: false
					});
				})
				.then(function() {
					return readFile(path.join(base, "dist", "bundles", "npmc", "main.js.map"))
						.then(function(data) {
							return JSON.parse(data.toString());
						});
				})
				.then(function(sourceMap) {
					assert.equal(sourceMap.sources[2], "../../../foo.js");
					assert.equal(
						sourceMap.sources.length,
						sourceMap.sourcesContent.length,
						"The source content should be included"
					);
				});
		});

		it("removes dev code from configDependencies", function(done){
			asap(rmdir)(path.join(__dirname, "npm-config-dep", "dist"))
			.then(function() {
				var config = {
					config: path.join(__dirname, "npm-config-dep", "package.json!npm")
				};

				var options = {
					quiet: true,
					minify: false
				};

				return multiBuild(config, options);
			})
			.then(function() {
				var mainBundle = path.join(__dirname, "npm-config-dep", "dist",
					"bundles", "npmc", "main.js");

				var str = fs.readFileSync(mainBundle, "utf8");
				assert.equal(str.indexOf("devCodeInConfigDependencies"), -1,
					"dev code should be removed");

			})
			.then(done, done);
		});

		it("strip sourcemapping URL in all files", function (done) {
			asap(rmdir)(__dirname + "/strip-sourcemap/dist")
				.then(function () {
					return multiBuild({
						config: __dirname + "/strip-sourcemap/stealconfig.js",
						main: "main"
					}, {
						quiet: true,
						minify: false,
						sourceMaps: true,
						bundleSteal: true
					});
				})
				.then(function () {
					var source = fs.readFileSync(__dirname + "/strip-sourcemap/dist/bundles/main.js", "utf8");
					//var soureMapRegex = /\/\/# sourceMappingURL=main.js.map/m;
					assert.ok(/\/\/# sourceMappingURL=main.js.map/m.test(source), 'sourceMap found');

					assert.ok(!/\/\/# sourceMappingURL=foobar.js.map/m.test(source), 'foobar.js.map should not be found');
					assert.ok(!/\/\/# sourceMappingURL=Promise.js.map/m.test(source), 'Promise.js.map should not be found');
				})
				.then(done, done);
		});
	});

	describe("maxBundleRequests", function(){
		it("can be set to 1", function(done){
			asap(rmdir)(__dirname + "/bundleDepth/dist")
			.then(function(){
				var p = multiBuild({
					config: __dirname + "/bundleDepth/package.json!npm"
				}, {
					quiet: true,
					minify: false,

					maxBundleRequests: 1
				});

				return p;
			})
			.then(function(data){
				assert.equal(data.bundles.length, 2, "there are two bundles because they were merged");

				// check the bundles
				open("test/bundleDepth/prod.html",function(browser, close){
					find(browser,"MODULEA", function(modA){
						assert.equal(modA, "worked");

						find(browser, "MODULEB", function(modB){
							assert.equal(modB, "worked");

							close();
						}, close);
					}, function(){});
				}, done);
			});
		});
	});

	it("should work with UMD produced by webpack (#579)", function(done){
		rmdir(__dirname + "/umd/bundle", function(error){
			if(error) {
				return done(error);
			}

			multiBuild({
				config: __dirname + "/umd/config.js",
				main: "main"
			}, {
				quiet: true
			}).then(function(){
				open("test/umd/prod.html", function(browser, close){
					find(browser, "umdExport", function(umdExport){
                        assert.equal(typeof umdExport, "function", "got umdExport");
						close();
					}, close);
				}, done);
			}).catch(done);
		});
	});

	it("supports JS minification through custom function", function() {
		function customMinify(source, options) {
			assert.ok(source.code, "gets the source code");
			assert.ok(options, "gets the options object");

			source.code = "custom minification works!!";
			return source;
		}

		return asap(rmdir)("test/basics/dist")
			.then(function() {
				return multiBuild({
					config: path.join(__dirname, "stealconfig.js"),
					main: "basics/basics"
				}, {
					minify: customMinify
				});
			})
			.then(function() {
				var source = fs.readFileSync(
					path.join(__dirname, "dist", "bundles", "basics", "basics.js")
				);

				assert.ok(/custom minification works/.test(source),
					"code was changed by custom minifier");
			});
	});

	it("should work with custom globals", function(done) {
		var globals = path.join(__dirname, "globals");

		asap(rmdir)(path.join(globals, "dist"))
			.then(function() {
				return multiBuild({
					main: "main",
					config: path.join(globals, "config.js")
				}, {
					minify: false
				});
			})
			.then(function() {
				var page = path.join("test", "globals", "index.html");

				open(page, function(browser, close) {
					find(browser, "$$$", function($$$) {
						assert.deepEqual($$$, {}, "worked");
						done();
					}, close);
				}, done);
			})
			.catch(function(err) {
				assert.ok(!err, err.stack || err);
			});
	});

	it("can build out buildTypes it is not aware of", function(done){
		var buildTypesDir = path.join(__dirname, "build_types");
		asap(rmdir)(path.join(buildTypesDir, "dist"))
		.then(function(){
			return multiBuild({
				config: path.join(buildTypesDir, "config.js"),
				main: "main"
			}, {quiet: true});
		})
		.then(function(){
			var page = path.join("test", "build_types", "prod.html");

			open(page, function(browser, close){
				find(browser, "ELEMENT", function(el){
					assert.equal(el.id, "main", "element inserted");
					done();
				}, close);
			}, done);
		});
	});

	it("can build apps using babel-standalone decorator plugin", function(done) {
		this.timeout(0);
		var base = path.join(__dirname, "decorators");

		asap(rmdir)(path.join(base, "dist"))
			.then(function() {
				return multiBuild({
					config: path.join(base, "package.json!npm")
				}, {
					quiet: true
				});
			})
			.then(function() {
				var page = path.join("test", "decorators", "prod.html");

				open(page, function(browser, close) {
					find(browser, "phone", function(phone) {
						assert.equal(phone.brand, "Bitovi", "decorators should work");
						done();
					}, close);
				}, done);
			});
	});

	it("can build apps using steal-clone", function() {
		var base = path.join(__dirname, "steal_clone");

		return asap(rmdir)(path.join(base, "dist"))
			.then(function() {
				return multiBuild({
					main: "steal_clone/index",
					config: path.join(__dirname, "stealconfig.js")
				}, {
					dest: path.join(base, "dist"),
					quiet: true,
					minify: false
				});
			})
			.then(function() {
				assert.ok(true, "it works!");
			});
	});

	it("writes out UTF-8 correctly", function(done) {
		var base = path.join(__dirname, "utf8");

		asap(rmdir)(path.join(base, "dist"))
			.then(function() {
				return multiBuild({
					main: "utf8/main",
					config: path.join(__dirname, "stealconfig.js")
				}, {
					quiet: true,
					dest: path.join(base, "dist")
				});
			})
			.then(function() {
				var page = path.join("test", "utf8", "prod.html");

				open(page, function(browser, close) {
					find(browser, "foo", function(foo) {
						assert.equal(foo, "捕");
						done();
					}, close);
				}, done);
			});
	});

	// related to https://github.com/stealjs/steal-tools/issues/602
	it("works with a bundle that depends on main", function() {
		var base = path.join(__dirname, "multi-main-dep");

		return asap(rmdir)(path.join(base, "dist"))
			.then(function() {
				return multiBuild({
					main: "multi-main-dep/main1",
					bundle: ["multi-main-dep/main2"],
					config: path.join(__dirname, "stealconfig.js")
				}, {
					quiet: true,
					dest: path.join(base, "dist")
				});
			});
	});

	it("does not swallow clean-css errors", function(done) {
		var base = path.join(__dirname, "broken_css_build");

		asap(rmdir)(path.join(base, "dist"))
			.then(function() {
				return multiBuild({
					main: "main",
					config: path.join(base, "stealconfig.js")
				}, {
					quiet: true,
					cleanCSSOptions: {
						inline: ["all"] // set inline @import to trigger build error
					}
				});
			})
			.then(function() {
				assert.ok(false, "build promise should not resolve");
				done();
			})
			.catch(function(err) {
				assert.ok(!!err, "build promise should be rejected");
				done();
			});
	});

	it("css imports are not inlined by default", function() {
		var base = path.join(__dirname, "css_imports");

		return asap(rmdir)(path.join(base, "dist"))
			.then(function() {
				return multiBuild({
					main: "main",
					config: path.join(base, "stealconfig.js")
				}, {
					quiet: true
				});
			})
			.then(function() {
				var source = fs.readFileSync(path.join(base, "dist", "bundles",
					"main.css"));

				assert.ok(/\@import/.test(source), "@imports are not inlined");
			});
	});

	it("error message when main is missing", function(done) {
		var base = path.join(__dirname, "bundle");

		var buildPromise = multiBuild({
			config: path.join(base, "stealconfig.js")
		}, {
			quiet: true,
			minify: false
		});

		buildPromise
			.then(function() {
				assert.ok(false, "'main' is missing");
				done();
			})
			.catch(function(err) {
				assert(/Attribute 'main' is required/.test(err.message),
					"should fail with a nice error message");
				done();
			});
	});

	it("minifies the whole bundle", function() {
		return asap(rmdir)(path.join(__dirname, "bundle", "dist"))
			.then(function() {
				return multiBuild({
					main: "bundle",
					config: path.join(__dirname, "bundle", "stealconfig.js")

				}, {
					quiet: true
				});
			})
			.then(function() {
				return asap(fs.readFile)(
					path.join(__dirname, "bundle", "dist", "bundles", "bundle.js")
				);
			})
			.then(function(bundle) {
				// matches /*stealconfig.js*/ comment
				assert.ok(!/\/\*stealconfig.js\*\//.test(bundle),
					"node name comment is removed when the bundle is minified");

				// matches /*bundle*/ comment
				assert.ok(!/\/\*bundle\*\//.test(bundle),
					"node name comment is removed when the bundle is minified");
			});
	});

	it("clean-css should not rebase urls by default", function() {
		var base = path.join(__dirname, "css_image_urls");

		return asap(rmdir)(path.join(base, "dist"))
			.then(function() {
				return multiBuild({
					main: "main",
					config: path.join(base, "stealconfig.js")
				}, {
					quiet: true
				});
			})
			.then(function() {
				return asap(fs.readFile)(
					path.join(base, "dist", "bundles", "main.css")
				);
			})
			.then(function(source) {
				var rx = new RegExp(escapeRegExp("url(../../../../../topbanner.png)"));
				assert.ok(rx.test(source), "image url should be relative to 'dist'");
			});
	});


	it("writes bundles manifiest if option is passed in", function() {
		var base = path.join(__dirname, "progressive_package");

		return asap(rmdir)(path.join(base, "dist"))
			.then(function() {
				return multiBuild({
					config: path.join(base, "package.json!npm")
				}, {
					minify: false,
					quiet: true,
					bundleManifest: true
				});
			})
			.then(function() {
				return fileExists(path.join(base, "dist", "bundles.json"));
			})
			.then(function() {
				return asap(rmdir)(path.join(base, "dist"));
			});
	});

	it("bundle manifest path can be provided", function() {
		var base = path.join(__dirname, "progressive_package");

		return asap(rmdir)(path.join(base, "dist"))
			.then(function() {
				return multiBuild({
					config: path.join(base, "package.json!npm")
				}, {
					minify: false,
					quiet: true,
					bundleManifest: path.join(base, "dist", "bundle-manifest.json")
				});
			})
			.then(function() {
				return fileExists(path.join(base, "dist", "bundle-manifest.json"));
			})
			.then(function() {
				return asap(rmdir)(path.join(base, "dist"));
			});
	});

	it("can minify non-transpiled ES2015 code", function() {
		var base = path.join(__dirname, "cjs_and_es6");

		return asap(rmdir)(path.join(base, "dist"))
			.then(function() {
				return multiBuild({
					main: "main",
					config: path.join(base, "stealconfig.js")
				}, {
					quiet: true,
					dest: path.join(base, "dist")
				});
			});
	});

	it("promise polyfill can be excluded from StealJS core", function() {
		var base = path.join(__dirname, "bundle");

		return asap(rmdir)(path.join(base, "dist"))
			.then(function() {
				return multiBuild({
					main: "bundle",
					config: path.join(__dirname, "bundle", "stealconfig.js")
				}, {
					quiet: true,
					minify: false,
					bundlePromisePolyfill: false,
					dest: path.join(base, "dist")
				});
			})
			.then(function() {
				return fileExists(
					path.join(base, "dist", "steal-sans-promises.production.js")
				);
			});
	});

	it("supports bundling StealJS without promise polyfill", function() {
		var base = path.join(__dirname, "bundle");

		return asap(rmdir)(path.join(base, "dist"))
			.then(function() {
				return multiBuild({
					main: "bundle",
					config: path.join(base, "stealconfig.js")
				}, {
					quiet: true,
					minify: false,
					bundleSteal: true,
					bundlePromisePolyfill: false,
					dest: path.join(base, "dist")
				});
			})
			.then(function() {
				return asap(fs.readFile)(
					path.join(base, "dist", "bundles", "bundle.js")
				);
			})
			.then(function(mainBundle) {
				assert(
					!/ES6 global Promise shim/.test(mainBundle.toString()),
					"Promise shim should not be bundled with steal"
				);
			});
	});

	it("has the correct buildType in buildResult", function (done) {
		multiBuild({
			config: __dirname + "/bundle/stealconfig.js",
			main: "bundle"
		}, {
			minify: false,
			quiet: true
		}).then(function (buildResult) {
			assert.equal(buildResult.buildType, "build");
			done();
		}, done).catch(done);
	})
});
