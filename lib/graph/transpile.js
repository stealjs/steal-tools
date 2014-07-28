var winston = require('winston');
var transpile = require('transpile');
var nodeDependencyMap = require("../node/dependency_map");

module.exports = function(graph, outputFormat, options){
	winston.info('\nTranspiling...');
	options = options || {};
	for(var name in graph) {
		var node = graph[name];
		if(!node.minifiedSource && 
			(!node.load.metadata.buildType || node.load.metadata.buildType === "js" )) {
			
			if(options.useNormalizedDependencies) {
				options.normalizeMap = nodeDependencyMap(node);
			}
			
			node.transpiledSource = transpile.to(node.load, outputFormat, options);
		}
	}
};
