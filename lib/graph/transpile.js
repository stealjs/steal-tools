var winston = require('winston');
var transpile = require('transpile');

module.exports = function(graph, outputFormat){
	winston.info('\nTranspiling...');

	for(var name in graph) {
		var node = graph[name];
		if(!node.minifiedSource && 
			(!node.load.metadata.buildType || node.load.metadata.buildType === "js" )) {
			node.transpiledSource = transpile.to(node.load, outputFormat, {
				dependencyMap: node.dependencyMap
			});
		}
	}
};
