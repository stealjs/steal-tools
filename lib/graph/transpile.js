var transpile = require('transpile');

module.exports = function(graph, outputFormat){
	for(var name in graph) {
		var node = graph[name];
		if(!node.minifiedSource && 
			(!node.load.metadata.buildType || node.load.metadata.buildType === "js" )) {
			node.transpiledSource = transpile.to(node.load,outputFormat);
		}
	}
};
