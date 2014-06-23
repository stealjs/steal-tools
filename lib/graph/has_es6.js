module.exports = function(graph){
	if(Array.isArray(graph)) {
		for(var i = 0; i < graph.length; i++){
			var node = graph[i];
			if(!node.load.metadata.format || node.load.metadata.format == 'es6'){
				return true;
			}
		}		
	} else {
		for( var name in graph ) {
			var node = graph[name];
			
		}
	}
	

	return false;
};

