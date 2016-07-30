var makeStealNode = require("../node/make_steal_node"),
	makeNode = require("../node/make_node");

// makes it so this bundle loads steal
module.exports = function(bundle, main, configuration){

	bundle.nodes.unshift(
		makeProductionConfigNode(main, configuration),
		makeStealNode(configuration),
		makeDefineNode()
	);
	bundle.nodes.push( makeNode("[import-main-module]", "System[\"import\"]('"+configuration.configMain+"').then(function() {\nSystem[\"import\"]('"+main+"'); \n});") );
};

function makeProductionConfigNode(main, configuration){
	var configString = "steal = " + browserGlobal + ".steal || {};\n" +
		"steal.stealBundled = true;\n" +
		"steal.loadBundles = true;\n" +
		"steal.baseURL = './';\n" +
		"steal.configMain = \"" + configuration.configMain + "\";\n" +
		"steal.main = \"" + main + "\";";
	return makeNode("[production-config]", configString);
}

function makeDefineNode(){
	return makeNode("[add-define]", browserGlobal + ".define = System.amdDefine;");
}

var browserGlobal = "((typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope) ? self : window)";
