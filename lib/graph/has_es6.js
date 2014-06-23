var isES6 = function(node){
	return !node.load.metadata.format || node.load.metadata.format == 'es6'
};


module.exports = function(graph){
	if(Array.isArray(graph)) {
		for(var i = 0; i < graph.length; i++){
			var node = graph[i];
			if(isES6(node)){
				return true;
			}
		}		
	} else {
		for( var name in graph ) {
			var node = graph[name];
			if(isES6(node)){
				return true;
			}
		}
	}
	

	return false;
};

