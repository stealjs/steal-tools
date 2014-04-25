var minifyJS = require('../buildTypes/minifyJS'),
	minifyCSS = require('../buildTypes/minifyCSS');

function minify(node){
	if(!node.minifiedSource) {
		var source = node.transpiledSource || node.load.source,
			minifier = node.load.metadata.buildType === "css" ?
				minifyCSS : minifyJS;
		
		node.minifiedSource = minifier(source);
	}
}

module.exports = function(graph){
	if(Array.isArray(graph)) {
		graph.forEach(function(node){
			minify(node);
		});
		
	} else {
		for(var name in graph) {
			var node = graph[name];
			minify(node);
		}
	}
	return graph;
};
