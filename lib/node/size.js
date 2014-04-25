module.exports = function(node){
	return (node.minifiedSource || node.transpiledSource || node.load.source).length;
};
