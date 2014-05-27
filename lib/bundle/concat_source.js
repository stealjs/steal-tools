var source = require('../node/source');

module.exports = function(bundle, sourceProp){
	bundle.source = "";
	bundle.nodes.forEach(function(node){
		bundle.source += "/*"+node.load.name+"*/\n";
		if(node.isPlugin && !node.value.includeInBuild) {
			bundle.source += "System.set('"+node.load.name+"', Module({}));\n";
		} else {
			bundle.source += source(node, sourceProp)+"\n";
		}
	});
};
