
var makeStealNode = require("../node/make_steal_node"),
	makeDefineNode = require("../node/make_define_node"),
	makeNode = require("../node/make_node");

// makes it so this bundle loads steal
module.exports = function(bundle, main){
	bundle.nodes.unshift(makeNode("production config","steal={env: 'production'};"), makeStealNode());
	bundle.nodes.push( makeNode("import main module", "System.import('"+main+"');") );
};
