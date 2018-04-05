exports.collect = function(edge) {
	// By default, the edge is entirely used.
	edge.allUsed = true;

	return {
		imports: [],
		exports: []
	};
}

// By default, the edge is entirely used.
exports.settleEdge = function(edge){
	edge.allUsed = true;
	return true;
};

// Noop
exports.getImports = function*(){};

// Empty set
exports.getAllExports = function(){
	return new Set();
};
