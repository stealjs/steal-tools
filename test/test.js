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
	pluginify = require("../lib/build/pluginifier"),
	fs = require('fs-extra'),
	logging = require('../lib/logger'),
	pluginifierBuilder = require('../lib/build/pluginifier_builder');

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
			config: __dirname+"/stealconfig.js",
			startId: "basics"
		}).then(function(data){
			var result = comparify(data.graph, {
				"@config": {
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
			extra: "stuff"
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
				startId: "basics"
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
	});
});

describe("bundle", function(){

	it("should work", function(done){

		bundle({
			config: __dirname+"/bundle/stealconfig.js",
			main: "bundle"
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
				done(error)
			}

			multiBuild({
				config: __dirname+"/bundle/stealconfig.js",
				main: "bundle"
			}, {
				quiet: true
			}).then(function(data){
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


describe("pluginify", function(){

	it("basics should work", function(done){
		pluginify({
			config: __dirname+"/stealconfig.js",
			main: "pluginify/pluginify"
		}, {
			exports: {
				'pluginify/global': 'globalModule'
			},
			quiet: true
		}).then(function(pluginify){


			fs.writeFile(__dirname+"/pluginify/out.js", pluginify(), function(err) {
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
		pluginify({
			config: __dirname + "/stealconfig.js",
			main: "pluginify/pluginify"
		}, {
			exports: {},
			quiet: true
		}).then(function(pluginify){

			// Get the resulting string, ignoring amdmodule
			var result = pluginify(null, {
				ignore: ["basics/amdmodule"]
			});

			// Regex test to see if the basics/amdmodule is included
			var includesIgnoredThings = new RegExp("\\*basics\\/amdmodule\\*").test(result);

			assert.equal(includesIgnoredThings, false, "It excluded the modules told to.");
		}).then(done);

	});

	it("makes plugins that depend on other made plugins",function(done){

		pluginify({
			config: __dirname+"/pluginify_deps/config.js",
			main: "plugin"
		}, {
			exports: {},
			quiet: true
		}).then(function(pluginify){
			var pluginOut = pluginify("plugin",{
				ignore: ["util"],
				minify: false
			});
			var utilOut = pluginify("util",{
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
		pluginify({
			config: __dirname + "/stealconfig.js",
			main: "nocallback/nocallback"
		}, {
			exports: {},
			quiet: true
		}).then(function(pluginify) {
			fs.writeFile(__dirname+"/nocallback/out.js", pluginify(), function(err) {
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
		pluginify({
			config: __dirname+"/plugins/config.js",
			main: "main"
		}, {
			exports: {},
			quiet: true
		}).then(function(pluginify){
			var pluginOut = pluginify(null, {
				minify: false
			});

			assert.equal(/System\.set/.test(pluginOut), false,
						 "No System.set in the output");
		}).then(done);
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
				quiet: true
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

describe("pluginifier builder", function(){
	it("basics work", function(done){
		
		pluginifierBuilder({
			
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
		}, [{}], {}, function(err){
			
			open("test/pluginifier_builder/index.html", function(browser, close){
	
				find(browser,"RESULT", function(result){
					assert.ok(result.module, "has module");
					assert.ok(result.cjs,"has cjs module");
					assert.equal(result.name, "pluginified");
					close();
				}, close);

			}, done);
			
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
				open("test/current-loader/prod.html", function(browser, close){

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


})();
