

module.exports = function(bundle, source){
	bundle.source = "";
	bundle.nodes.forEach(function(node){
		bundle.source += "/*"+node.load.name+"*/\n";
		if(node.isPlugin && !node.value.includeInBuild) {
			bundle.source += "System.set('"+node.load.name+"', Module({}));\n";
		} else {
			bundle.source += source ? node[source] : (node.minifiedSource || node.transpiledSource || node.load.source)+"\n";
		}
	});
};
