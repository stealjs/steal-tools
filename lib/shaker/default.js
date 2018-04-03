// By default, the edge is entirely used.
exports.settleEdge = function(edge){
	edge.allUsed = true;
	return true;
};

// Noop
exports.getImports = function*(){};
