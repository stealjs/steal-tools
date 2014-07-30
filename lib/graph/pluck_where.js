var winston = require('winston');

/**
 * @method.pluckWhere
 *
 * Pluck dependencies that meet a provided condition
 *
 * @param {Object} graph The dependency graph
 * @param {String} name The module name
 * @param {Function} condition A function to run against each node to determine
 * if they should be plucked.
 */
module.exports = function(graph, name, condition){
	var modules = [];
	var visited = {};
	
	function visit( name ) {
		var plucked = false;
		if(!visited[name]) {
		
			visited[name] = true;
			var node = graph[name];
		
			// Only delete the node if it meets the condition
			if(condition(node)) {
				delete graph[name];
				plucked = true;
			}

			if(!node) {
				winston.warn("no deps!!!",name);
			}
			var removed = {};
			node.dependencies.forEach(function( moduleName ) {
				// If this dependency is plucked remove it.
				if(visit(moduleName)) {
					removed[moduleName] = true;
				}
			});
			modules.push(node);

			// Remove all the deps there were plucked
			for(var moduleName in removed) {
				node.dependencies.splice(node.dependencies.indexOf(moduleName), 1);
			}
		}
		return plucked;
	}
	visit(name);
	return modules;
};
