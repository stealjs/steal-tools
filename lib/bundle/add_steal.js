
var makeStealNode = require("../node/make_steal_node"),
	makeNode = require("../node/make_node"),
	minify = require("../graph/minify");

// makes it so this bundle loads steal
module.exports = function(bundle, main, configuration){
	bundle.nodes.unshift(makeNode("[production-config]","steal={env: 'production'};"), makeStealNode(configuration));
	bundle.nodes.push( makeNode("[import-main-module]", "System.import('"+main+"');") );
};
