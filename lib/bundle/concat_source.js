

module.exports = function(bundle){
	bundle.source = "";
	bundle.nodes.forEach(function(node){
		bundle.source += "/*"+node.load.name+"*/\n";
		bundle.source += (node.minifiedSource || node.transpiledSource || node.load.source)+"\n";
	});
};
