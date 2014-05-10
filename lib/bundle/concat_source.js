

module.exports = function(bundle, source){
	bundle.source = "";
	bundle.nodes.forEach(function(node){
		bundle.source += "/*"+node.load.name+"*/\n";
		bundle.source += source ? node[source] : (node.minifiedSource || node.transpiledSource || node.load.source)+"\n";
	});
};
