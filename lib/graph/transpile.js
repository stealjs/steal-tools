var transpile = require('transpile');

module.exports = function(graph, outputFormat){
	for(var name in graph) {
		var node = graph[name];
		if(!node.minifiedSource) {
			node.transpiledSource = transpile.to(node.load,outputFormat);
		}
	}
};
