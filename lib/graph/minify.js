var minify = require('../minify');

module.exports = function(graph){
	if(Array.isArray(graph)) {
		graph.forEach(function(node){
			if(!node.minifiedSource) {
				//node.minifiedSource = minify(node.transpiledSource || node.load.source);
			}
		});
		
	} else {
		for(var name in graph) {
			var node = graph[name];
			if(!node.minifiedSource) {
				//node.minifiedSource = minify(node.transpiledSource || node.load.source);
			}
		}
	}
	return graph;
};
