var minifyJS = require('../buildTypes/minifyJS'),
	transformActiveSource = require("../node/transform_active_source");

function minify(node, options) {
	transformActiveSource(node,"minify-true", function(node, source){
		var buildType = node.load.metadata.buildType;

		// skip css source files, css is minified after the bundle is concatenated
		return buildType === "css" ? source : minifyJS(source, options);
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
