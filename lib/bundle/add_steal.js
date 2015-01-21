
var makeStealNode = require("../node/make_steal_node"),
	makeNode = require("../node/make_node");

// makes it so this bundle loads steal
module.exports = function(bundle, main, configuration){

	bundle.nodes.unshift(makeNode("[production-config]","steal={env: 'production'};"), makeStealNode(configuration), makeNode("[add-define]","window.define = System.amdDefine;"));
	bundle.nodes.push( makeNode("[import-main-module]", "System.import('"+configuration.configMain+"').then(function() {\nSystem.import('"+main+"'); \n});") );
};
