var source = require('../node/source');

module.exports = function(bundle, sourceProp, excludePlugins){

	bundle.source = "";
	bundle.nodes.forEach(function(node){
		bundle.source += "/*"+node.load.name+"*/\n";
		if(node.isPlugin && !node.value.includeInBuild) {
			if(!excludePlugins) {
				bundle.source += "System.set('"+node.load.name+"', System.newModule({}));\n";
			}
		} else {
			bundle.source += source(node, sourceProp)+"\n";
		}
	});
};
