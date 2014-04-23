var dependencyGraph = require("../lib/graph/make_graph"),
	comparify = require("comparify"),
	bundle = require("../lib/graph/make_graph_with_bundles"),
	orderGraph = require("../lib/graph/order"),
	assert = require('assert'),
	multiBuild = require("../lib/build/multi"),
	Browser = require("zombie"),
	connect = require("connect"),
	path = require('path'),
	rmdir = require('rimraf');


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
					}, close)
				}, done)
				
				
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
		
	})
	
});

