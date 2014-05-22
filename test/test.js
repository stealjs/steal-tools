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
	fs = require('fs');


describe('dependency graph', function(){
    it('should work', function(done){
		
		dependencyGraph({
			config: __dirname+"/stealconfig.js",
			startId: "basics"
		}).then(function(data){
			
			var result = comparify(data.graph, {
				stealconfig: {
					load: {}
				},
				'steal/dev/dev': {
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
			done("failed to find "+propety);
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
}


describe("mutli build", function(){
	
	it("should work", function(done){
		
		rmdir(__dirname+"/bundle/bundles", function(error){
			if(error){
				done(error)
			}
			
			multiBuild({
				config: __dirname+"/bundle/stealconfig.js",
				main: "bundle"
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
		rmdir(__dirname+"/plugins/bundles", function(error){
			
			if(error){
				done(error)
			}
			// build the project that 
			// uses a plugin
			multiBuild({
				config: __dirname+"/plugins/config.js",
				main: "main"
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
	
	it("work with css buildType", function(done){
		
		rmdir(__dirname+"/build_types/bundles", function(error){
			
			if(error){
				done(error)
			}
			// build the project that 
			// uses a plugin
			multiBuild({
				config: __dirname+"/build_types/config.js",
				main: "main"
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
	
	it.ok("can build less", function(done){
		rmdir(__dirname+"/dep_plugins/bundles", function(error){
			
			if(error){
				done(error)
			}
			// build the project that 
			// uses a plugin
			multiBuild({
				config: __dirname+"/dep_plugins/config.js",
				main: "main"
			}).then(function(data){

				// open the prod page and make sure
				// the plugin processed the input correctly
				open("test/dep_plugins/prod.html", function(browser, close){
			
					find(browser,"STYLE_CONTENT", function(styleContent){
						console.log(styleContent)
						assert(styleContent.indexOf("#test-element")>=0, "have correct style info");
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
			system : {
				config: __dirname+"/stealconfig.js",
				main: "pluginify/pluginify"
			},
			exports: {}
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
			system: {
				config: __dirname + "/stealconfig.js",
				main: "pluginify/pluginify"
			},
			exports: {}
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

