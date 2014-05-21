
/**
 * @method graph.each
 */
module.exports = function(graph, name, callback){
	var deps = {};

	function visit(name, node) {
		if(!deps[name]) {
			deps[name] = true;

			// Call the callback
			callback(name, node);
		}

		if(node.dependencies.length) {
			node.dependencies.forEach(function(name){
				visit(name, graph[name]);
			});
		}
	}

	// It's possible weren't try to map a node that doesn't exist.
	if(graph[name]) {
		visit(name, graph[name]);
	}
};
