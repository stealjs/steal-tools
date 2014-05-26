

module.exports = function(graph, name){
	var modules = [];
	var visited = {};
	
	function visit( name ) {
		if(!visited[name]) {
		
			visited[name] = true;
			var node = graph[name];
		
			delete graph[name];
			if(!node) {
				console.log("no deps!!!",name);
			}
			node.dependencies.forEach(function( moduleName ) {
				visit(moduleName);
			});
			modules.push(node);
		}
	}
	visit(name);
	return modules;
};
