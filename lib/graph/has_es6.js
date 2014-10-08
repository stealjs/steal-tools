var isES6 = function(node){
	return !node.load.metadata.format || node.load.metadata.format == 'es6';
};


module.exports = function(graph){
  var node;

	if(Array.isArray(graph)) {
		for(var i = 0; i < graph.length; i++){
			node = graph[i];
			if(isES6(node)){
				debugger;
				return true;
			}
		}		
	} else {
		for( var name in graph ) {
			node = graph[name];
			if(isES6(node)){
				debugger;
				return true;
			}
		}
	}
	

	return false;
};

