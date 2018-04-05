exports.collect = function(edge) {
	// By default, the edge is entirely used.
	edge.allUsed = true;

	return {
		imports: [],
		exports: []
	};
};

exports.shakeOut = function(){};
