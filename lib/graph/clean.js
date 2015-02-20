var transformActiveSource = require("../node/transform_active_source");

var clean = function(node, options){
	var removeTags = (options.removeTags || []).slice(0);

	if(!removeTags.length) {
		removeTags.push("steal-remove");
		removeTags.push(/steal.dev.(?:log|warn|assert)\(.*\);?/g);
	}

	if(!node.load.metadata.buildType || node.load.metadata.buildType === "js") {
		transformActiveSource(node, "clean-true", function(node, source){
			removeTags.forEach(function(tag) {
				if (tag instanceof RegExp) {
					source = source.replace(tag, '');
				} else {
					source = source.replace(new RegExp('(\\s?)\/\/!' + tag + '-start((.|\r?\n)*?)\/\/!' + tag + '-end', 'gim'), '');
				}
			});
			return source;
		});
	}
};

module.exports = function(graph, options) {
	options = options || {};
	if(Array.isArray(graph)) {
		graph.forEach(function(node){
			clean(node, options);
		});
	} else {
		for(var name in graph) {
			var node = graph[name];
			// If JavaScript
			clean(node, options);
		}
	}
};

