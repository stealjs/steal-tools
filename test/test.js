var dependencyGraph = require("../lib/graph/make_graph"),
	comparify = require("comparify"),
	bundle = require("../lib/graph/make_graph_with_bundles"),
	orderGraph = require("../lib/graph/order"),
	assert = require('assert'),
	multiBuild = require("../lib/build/multi");

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

describe("mutli build", function(){
	
	it("should work", function(done){
		
		multiBuild({
			configPath: __dirname+"/bundle/stealconfig.js",
			startId: "bundle.js"
		}).then(function(data){
			
			done();
			
			
		}).catch(function(e){
			console.log(e.stack);
			done(e);
		});
		
	});
	
});

