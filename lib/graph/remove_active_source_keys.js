
var clean = function(node){
	delete node.activeSourceKeys;
	node.activeSource = node.load.source;
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

