var minifyJS = require('../buildTypes/minifyJS'),
	minifyCSS = require('../buildTypes/minifyCSS'),
	transformActiveSource = require("../node/transform_active_source");

function minify(node, options){
	transformActiveSource(node,"minify-true", function(node, source){
		var minifier = node.load.metadata.buildType === "css" ?
				minifyCSS : minifyJS;
		return minifier(source, options);
	});
}

module.exports = function(graph, options){
	options = options || {};

	if(Array.isArray(graph, options)) {
		graph.forEach(function(node){
			minify(node, options);
		});
	} else {
		for(var name in graph) {
			var node = graph[name];
			minify(node, options);
		}
	}
	return graph;
};
