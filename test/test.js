var dependencyGraph = require("../lib/dependency_graph"),
	comparify = require("comparify"),
	assert = require('assert');

describe('dependency graph', function(){
    it('should work', function(done){
		
		dependencyGraph({
			configPath: __dirname+"/stealconfig.js",
			startId: "basics"
		}).then(function(graph){
			
			var fs = require('fs');
			fs.writeFile(__dirname+"/foo.json", JSON.stringify(graph), function(err) {
			    if(err) {
			        console.log(err);
			    } else {
			        console.log("The file was saved!");
			    }
			}); 
			
			var result = comparify(graph, {
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


