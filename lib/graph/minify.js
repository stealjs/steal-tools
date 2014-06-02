var minifyJS = require('../buildTypes/minifyJS'),
	minifyCSS = require('../buildTypes/minifyCSS');

function minify(node, options){
	if(!node.minifiedSource) {
		var source = node.transpiledSource || node.load.source,
			minifier = node.load.metadata.buildType === "css" ?
				minifyCSS : minifyJS;

		node.minifiedSource = minifier(source, options);
	}
}

module.exports = function(graph, options){
	options = options || {};

	if(Array.isArray(graph)) {
		graph.forEach(function(node){
			minify(node, options);
		});
	} else {
		Object.keys(graph).forEach(function(name) {
			var node = graph[name];
			minify(node, options);
		});
	}
	return graph;
};
