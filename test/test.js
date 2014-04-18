var dependencyGraph = require("../lib/graph/make_graph"),
	comparify = require("comparify"),
	bundle = require("../lib/graph/make_graph_with_bundles"),
	orderGraph = require("../lib/graph/order"),
	assert = require('assert'),
	multiBuild = require("../lib/build/multi"),
	Browser = require("zombie"),
	connect = require("connect"),
	path = require('path');

describe('dependency graph', function(){
    it('should work', function(done){
		
		dependencyGraph({
			configPath: __dirname+"/stealconfig.js",
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
			configPath: __dirname+"/bundle/stealconfig.js",
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
		if(browser.window[property]) {
			callback(browser.window[property]);
		} else if(new Date() - start < 2000){
			setTimeout(check, 20);
		} else {
			done("failed to find "+propety);
		}
	};
	check();
};

describe("mutli build", function(){
	
	it("should work", function(done){
		
		multiBuild({
			configPath: __dirname+"/bundle/stealconfig.js",
			startId: "bundle.js"
		}).then(function(data){
			var finished = function(e){
				done(e);
				server.close();
			};
			var server = connect().use(connect.static(path.join(__dirname,".."))).listen(8081);
			
			Browser.visit("http://localhost:8081/test/bundle/bundle.html#a")
				.then(function(browser){
					find(browser,"appA", function(appA){
						assert(true, "got A");
						assert.equal(appA.name, "a", "got the module");
						assert.equal(appA.ab.name, "a_b", "a got ab");
						finished();
					}, finished)
					
				},finished);
			
		}).catch(function(e){
			done(e);
		});
		
	});
	
});

