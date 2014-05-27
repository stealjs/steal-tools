module.exports = function(node, sourceProp){
	return sourceProp ? node[sourceProp] : (node.normalizedSource || node.minifiedSource || node.transpiledSource || node.load.source);
};
