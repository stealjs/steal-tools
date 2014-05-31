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
	fs = require('fs'),
	logging = require('../lib/logger');

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
				stealconfig: {
					load: {}
				},
				'steal/dev': {
					load: {
						metadata: {
							// ignore: true
						}
					}
				},
				'basics/basics': {
					deps: ['basics/module'],
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
			startId: "bundle.js"
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

var find = function(browser, property, callback, done){
	var start = new Date();
	var check = function(){
		if(browser.window && browser.window[property]) {
			callback(browser.window[property]);
		} else if(new Date() - start < 2000){
			setTimeout(check, 20);
		} else {
			done("failed to find "+property);
		}
	};
	check();
};

var open = function(url, callback, done){
	var server = connect().use(connect.static(path.join(__dirname,".."))).listen(8081);
			var browser = new Browser();
			browser.visit("http://localhost:8081/"+url)
				.then(function(){
					callback(browser, function(){
						server.close();
						done();
					})
				}).catch(function(e){
					server.close();
					done(e)
				});
};


describe("multi build", function(){

	it("should work", function(done){
		rmdir(__dirname+"/bundle/bundles", function(error){
			if(error){
				done(error)
			}

			multiBuild({
				config: __dirname+"/bundle/stealconfig.js",
				main: "bundle"
			}, {
				quiet: true,
				distDir: ''
			}).then(function(data){
				open("test/bundle/bundle.html#a",function(browser, close){
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

				assert(!hasLongVariable, "Minified source renamed long variable.");

				done();
			}).catch(function(e){
				done(e);
			});
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
			config: __dirname + "/stealconfig.js",
			main: "basics/basics"
		};

		var options = {
			distDir: __dirname + "/other_dist",
			quiet: true
		};

		rmdir(__dirname + "/other_dist", function(error){
			if(error) {
				done(error);
				return;
			}

			multiBuild(config, options).then(function(){
				var fileExists = fs.existsSync(__dirname + "/other_dist/bundles/basics.js");

				assert(fileExists, "File written to alternative bundle location.");

				done();
			});

		});

	});
	
	it("allows bundling steal", function(done){
		
		rmdir(__dirname+"/bundle/bundles", function(error){
			if(error){
				done(error)
			}
			
			multiBuild({
				config: __dirname+"/bundle/stealconfig.js",
				main: "bundle"
			},{
        distDir: "",
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
		
		rmdir(__dirname+"/bundle/bundles", function(error){
			if(error){
				done(error)
			}
			
			multiBuild({
				config: __dirname+"/bundle/stealconfig.js",
				main: "bundle"
			},{
				bundleSteal: true,
				quiet: true,
        distDir: ""
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
	
});

describe("plugins", function(){
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
							assert.equal(part,"../images/hero-ribbons.png", "reference is correct");
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
			exports: {},
			quiet: true
		}).then(function(pluginify){


			fs.writeFile(__dirname+"/pluginify/out.js", pluginify(), function(err) {
			    // open the prod page and make sure
				// the plugin processed the input correctly
				open("test/pluginify/index.html", function(browser, close){

					find(browser,"RESULT", function(result){
						assert(result.module.es6module, "have dependeny");
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
			var includesIgnoredThings = /\*basics\/amdmodule\*/.test(result);

			assert.equal(includesIgnoredThings, false, "It excluded the modules told to.");
		}).then(done);

	});


});

