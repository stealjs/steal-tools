var winston = require('winston');
var dependencyGraph = require("../lib/graph/make_graph"),
	comparify = require("comparify"),
	bundle = require("../lib/graph/make_graph_with_bundles"),
	orderGraph = require("../lib/graph/order"),
	mapDeps = require("../lib/graph/map_dependencies"),
	assert = require('assert'),
	multiBuild = require("../lib/build/multi"),
	Browser = require("zombie"),
	connect = require("connect"),
	path = require('path'),
	rmdir = require('rimraf'),
	transformImport = require("../lib/build/transform"),
	fs = require('fs-extra'),
	logging = require('../lib/logger'),
	stealExport = require('../lib/build/export'),
	asap = require("pdenodeify");

System.logLevel = 3;

// Helpers
var find = function(browser, property, callback, done){
	var start = new Date();
	var check = function(){
		if(browser.window && browser.window[property]) {
			callback(browser.window[property]);
		} else if(new Date() - start < 2000){
			setTimeout(check, 20);
		} else {
			done("failed to find "+property+" in "+browser.window.location.href);
		}
	};
	check();
};

var open = function(url, callback, done){
	var server = connect().use(connect.static(path.join(__dirname,".."))).listen(8081);
	var browser = Browser.create();
	browser.visit("http://localhost:8081/"+url)
		.then(function(){
			callback(browser, function(err){
				server.close();
				done(err);
			})
		}).catch(function(e){
			server.close();
			done(e)
		});
};


(function(){


describe('dependency graph', function(){
	beforeEach(function() {
		logging.setup({ quiet: true });
	});

	it('should work', function(done){

		dependencyGraph({
			config: path.join(__dirname, "stealconfig.js"),
			startId: "basics",
			logLevel: 3
		}).then(function(data){
			var result = comparify(data.graph, {
				"stealconfig.js": {
					load: {}
				},
				'@dev': {
					load: {
						metadata: {
							// ignore: true
						}
					}
				},
				'basics/basics': {
					deps: ['basics/module/module'],
					dependencies: ['basics/module/module']
				},
				'basics/module/module': {
					deps: ["basics/es6module"],
					dependencies:["basics/es6module"]
				},
				"basics/es6module": {
					deps: ['basics/amdmodule'],
					dependencies:["basics/amdmodule"]
				}
			}, true);


			done();


		}).catch(function(e){
			done(e)
		});
    });

	it("Should allow extra config options to be passed in", function(done){

		dependencyGraph({
			config: __dirname + "/stealconfig.js",
			startId: "basics",
			extra: "stuff",
			logLevel: 3
		}).then(function(data){
			var steal = data.steal;
			var extra = steal.config("extra");

			assert.equal(extra, "stuff", "Extra config options added");
		}).then(done);

	});

	describe("Utility functions", function(){
		it("Map should work", function(done){
			dependencyGraph({
				config: __dirname + "/stealconfig.js",
				startId: "basics",
				logLevel: 3
			}).then(function(data){
				var graph = data.graph;

				var modules = mapDeps(graph, 'basics/basics', function(name){
					return name;
				});

				comparify(modules, [
					"basics/basics", "basics/module/module",
					"basics/es6module", "basics/amdmodule"
				], true);

			}).then(done);

		});

		describe("Order", function(){
			it("works when a module is dependent on @empty", function(){
				var graph = {
					main: {
						dependencies: ["@empty", "dep"]
					},
					dep: {
						dependencies: []
					}
				};
				orderGraph(graph, "main");
				assert.equal(graph.dep.order, 0, "Dep is first");
				assert.equal(graph.main.order, 1, "Main is second");
			});
		});
	});
});

describe("bundle", function(){
	it("should work", function(done){

		bundle({
			config: __dirname+"/bundle/stealconfig.js",
			main: "bundle",
			logLevel: 3
		}).then(function(data){
			var graphCompare = require('./bundle/bundle_graph');
			comparify(data.graph, graphCompare, true);
			done();

		}).catch(function(e){
			done(e)
		});
	});

	it("works with globs", function(done){
		bundle({
			config: __dirname+"/bundle/stealconfig.js",
			main: "bundle",
			logLevel: 3,
			bundle: "app_*"
		}).then(function(data){
			var graphCompare = require('./bundle/bundle_graph');
			comparify(data.graph, graphCompare, true);
			done();

		}).catch(function(e){
			done(e)
		});
	});
});


describe("order", function(){

	it("should work", function(){

		var graph = {
		   "a":{
		      "deps":[ "dep_a_b",  "dep_all" ],
		      "dependencies":[ "dep_a_b", "dep_all" ]
		   },
		   "dep_a_b":{
		      "deps":[],
		      "dependencies":[]
		   },
		   "dep_all":{
		      "deps":["jquery"],
		      "dependencies":["jquery"],
		   },
		   "jquery": {
		      deps: [],
		      dependencies: []
		   }
		};

		orderGraph(graph,"a");
		comparify(graph, {
		   "a":{
		      order: 3
		   },
		   "dep_a_b":{
		      order: 0
		   },
		   "dep_all":{
		      order: 2
		   },
		   "jquery": {
		      order: 1
		   }
		}, true);

	});

});


describe("multi build", function(){

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


});

describe("multi build with plugins", function(){
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

	describe("multi build when long bundle names", function(){

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
	})

});


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


			fs.writeFile(__dirname+"/pluginify/out.js", transform(), function(err) {
			    // open the prod page and make sure
				// the plugin processed the input correctly
				open("test/pluginify/index.html", function(browser, close){

					find(browser,"RESULT", function(result){
						assert(result.module.es6module, "have dependeny");
						assert(result.cjs(), "cjs");
						assert.equal(result.global, "This is a global module", "Global module loaded");
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

			// Get the resulting string, ignoring amdmodule
			var result = transform(null, {
				ignore: ["basics/amdmodule"]
			});

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
			var pluginOut = transform("plugin",{
				ignore: ["util"],
				minify: false
			});
			var utilOut = transform("util",{
				ignore: ["lib"],
				minify: false,
				exports: {
					"lib" : "lib" 
				}
			});

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
			fs.writeFile(__dirname+"/nocallback/out.js", transform(), function(err) {
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
			var pluginOut = transform(null, {
				minify: false
			});

			assert.equal(/System\.set/.test(pluginOut), false,
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
				var pluginOut = transform(null, {
					minify: false
				});

				fs.writeFile(__dirname + "/pluginify_global/out.js", pluginOut, function(error) {
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
				var out = transform(null, { minify: false });

				fs.writeFile(__dirname + "/pluginify_define/out.js", out, function(error){
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
				main: mains
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

describe("export", function(){
	it("basics work", function(done){
		
		stealExport({
			
			system: {
				main: "pluginifier_builder/pluginify",
				config: __dirname+"/stealconfig.js"
			},
			options: {
				quiet: true
			},
			"outputs": {
				"basics standalone": {
					modules: ["basics/module/module"],
					dest: function(){
						return __dirname+"/out/basics.js"
					},
					minify: false
				},
				"pluginify without basics": {
					modules: ["pluginifier_builder/pluginify"],
					ignore: ["basics/module/module"],
					dest: function(){
						return __dirname+"/out/pluginify.js"
					},
					minify: false
				}
			}
		}).then(function(){
			open("test/pluginifier_builder/index.html", function(browser, close){
	
				find(browser,"RESULT", function(result){
					assert.ok(result.module, "has module");
					assert.ok(result.cjs,"has cjs module");
					assert.equal(result.name, "pluginified");
					close();
				}, close);

			}, done);
			
		}, done);
	});

	it("works with multiple mains", function(done){
		stealExport({
			
			system: {
				main: [
					"pluginifier_builder/pluginify",
					"pluginifier_builder/common"
				],
				config: __dirname+"/stealconfig.js"
			},
			options: {
				quiet: true
			},
			"outputs": {
				"basics standalone": {
					modules: ["basics/module/module"],
					dest: function(){
						return __dirname+"/out/basics.js"
					},
					minify: false
				},
				"pluginify without basics": {
					modules: ["pluginifier_builder/pluginify"],
					ignore: ["basics/module/module"],
					dest: function(){
						return __dirname+"/out/pluginify.js"
					},
					minify: false
				}
			}
		}).then(function(){
			open("test/pluginifier_builder/index.html", function(browser, close){
	
				find(browser,"RESULT", function(result){
					assert.ok(result.module, "has module");
					assert.ok(result.cjs,"has cjs module");
					assert.equal(result.name, "pluginified");
					close();
				}, close);

			}, done);
			
		}, done);
	});
	
	it("passes the load objects to normalize and dest", function(done){
		var destCalls = 0;
		
		stealExport({
			
			system: {
				main: "pluginifier_builder_load/main",
				config: __dirname+"/stealconfig.js"
			},
			options: {
				quiet: true
			},
			"outputs": {
				"cjs": {
					graphs: ["pluginifier_builder_load/main"],
					useNormalizedDependencies: false,
					format: "cjs",
					normalize: function(name, load, curName, curLoad, loader) {
						assert.equal(name, "./bar");
						assert.equal(load.name, "pluginifier_builder_load/bar");
						assert.equal(curName, "pluginifier_builder_load/main");
						assert.equal(curLoad.name, "pluginifier_builder_load/main");
						assert.equal(loader.main, "pluginifier_builder_load/main");
						return name;
					},
					ignore: function(moduleName, load){
						switch(destCalls++) {
							case 0:
								assert.equal(load.name, "pluginifier_builder_load/main");
								break;
							case 2:
								assert.equal(load.name, "pluginifier_builder_load/bar");
								return true;
								break;
							default:
								assert.ok(false, "should not be called "+moduleName+"."+destCalls);
								break;
						}
					},
					dest: function(moduleName, moduleData, load){
						switch(destCalls++) {
							case 1:
								assert.equal(load.name, "pluginifier_builder_load/main");
								break;
							default:
								assert.ok(false, "should not be called "+moduleName+"."+destCalls);
								break;
						}
						return __dirname+"/out/"+moduleName+".js"
					},
					minify: false
				}
			}
		}).then(function(err){

			done();

		}, done);
	});
	
	describe("helpers", function(){
		beforeEach(function(done) {
			rmdir(path.join(__dirname, "pluginifier_builder_helpers", "node_modules"), function(error){
				
				if(error){ return done(error); }
				
				rmdir(path.join(__dirname, "pluginifier_builder_helpers", "dist"), function(error){
		
					if(error){ return done(error); }
				
					fs.copy(
						path.join(__dirname, "..", "node_modules","jquery"),
						path.join(__dirname, "pluginifier_builder_helpers", "node_modules", "jquery"),
						function(error){
							if(error) { return done(error); }
							
							fs.copy(
								path.join(__dirname, "..", "node_modules","cssify"),
								path.join(__dirname, "pluginifier_builder_helpers", "node_modules", "cssify"),
								function(error){
									if(error) { return done(error); }
									done();
								}
							);
						}
					);
					
				});
				
			});
		});
		
		it("+cjs", function(done){
			this.timeout(10000);

			stealExport({
				system: { config: __dirname+"/pluginifier_builder_helpers/package.json!npm" },
				options: { quiet: true },
				"outputs": {
					"+cjs": {}
				},
			}).then(function(){
				var browserify = require("browserify");
				
				var b = browserify();
				b.add(path.join(__dirname, "pluginifier_builder_helpers/browserify.js"));
				var out = fs.createWriteStream(path.join(__dirname, "pluginifier_builder_helpers/browserify-out.js"));
				b.bundle().pipe(out);
				out.on('finish', function(){
					open("test/pluginifier_builder_helpers/browserify.html", function(browser, close) {
						find(browser,"WIDTH", function(width){
							
							assert.equal(width, 200, "with of element");
							close();
						}, close);
					}, done);
				});
				
				
			}, function(e) {
				done(e);
			});
				
		});
		
		
		it("+cjs with dest", function(done){
			this.timeout(10000);
			
			stealExport({
				
				system: { config: __dirname+"/pluginifier_builder_helpers/package.json!npm" },
				options: { quiet: true },
				"outputs": {
					"+cjs": {dest: __dirname+"/pluginifier_builder_helpers/cjs"}
				}
			}).then(function(){
				
				var browserify = require("browserify");
				
				var b = browserify();
				b.add(path.join(__dirname, "pluginifier_builder_helpers/browserify-cjs.js"));
				var out = fs.createWriteStream(path.join(__dirname, "pluginifier_builder_helpers/browserify-out.js"));
				b.bundle().pipe(out);
				out.on('finish', function(){
					open("test/pluginifier_builder_helpers/browserify.html", function(browser, close) {
						find(browser,"WIDTH", function(width){
							
							assert.equal(width, 200, "with of element");
							close();
						}, close);
					}, done);
				});
				
				
			}, done);
				
		});
		
		
		
		// NOTICE: this test uses a modified version of the css plugin to better work
		// in HTMLDOM
		it("+amd", function(done){
			this.timeout(10000);
			
			stealExport({
				
				system: { config: __dirname+"/pluginifier_builder_helpers/package.json!npm" },
				options: { quiet: true },
				"outputs": {
					"+amd": {}
				}
			}).then(function(){
				
				open("test/pluginifier_builder_helpers/amd.html", function(browser, close) {
					find(browser,"WIDTH", function(width){
						assert.equal(width, 200, "with of element");
						close();
					}, close);
				}, done);
				
				
			}, done);
				
		});
		
		it("+global-css +global-js", function(done){
			this.timeout(10000);
			
			stealExport({
				
				system: { config: __dirname+"/pluginifier_builder_helpers/package.json!npm" },
				options: { quiet: true },
				"outputs": {
					"+global-css": {},
					"+global-js": { exports: {"jquery": "jQuery"} }
				}
			}).then(function(err){
				
				open("test/pluginifier_builder_helpers/global.html", function(browser, close) {
					find(browser,"WIDTH", function(width){
						assert.equal(width, 200, "width of element");
						assert.ok(browser.window.TABS, "got tabs");
						close();
					}, close);
				}, done);
				
				
			}, done);
				
		});
		
		it("+cjs +amd +global-css +global-js using Babel", function(done){
			this.timeout(10000);
			stealExport({
				system: {
					config: __dirname+"/pluginifier_builder_helpers/package.json!npm",
					transpiler: "babel"
				},
				options: { quiet: true },
				"outputs": {
					"+cjs": {},
					"+amd": {},
					"+global-js": {},
					"+global-css": {}
				}
			}).then(done, done);
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

describe("npm package.json builds", function(){
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

	describe("steal-export", function(){
		describe("ignore", function(){
			it("works with unnormalized names", function(done){
				stealExport({
					system: {
						config: __dirname+"/npm/package.json!npm",
						main: "npm-test/main",
						transpiler: "babel"
					},
					options: { quiet: true },
					"outputs": {
						"+global-js": {
							modules: ["npm-test/main"],
							minify: false,
							ignore: ["npm-test/child"],
							exports: {
								"jquery": "$"
							}
						},
					}
				})
				.then(check);

				function check() {
					openPage(function(moduleValue){
						var child = moduleValue.child;
						assert.equal(child, undefined, "Child ignored in build");
					}, done);
				}

				function openPage(callback, done) {
					open("test/npm/prod-global.html", function(browser, close){
						find(browser,"MODULE", function(moduleValue){
							callback(moduleValue);
							close();
						}, close);
					}, done);
				}


			});
		});
	});
	
});


})();
