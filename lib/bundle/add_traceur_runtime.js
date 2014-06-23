var fs = require('fs'),
	path = require('path'),
	traceurPath = require.resolve('traceur'),
	makeNode = require("../node/make_node");
	
module.exports = function(bundle){
	var lastTraceur = traceurPath.indexOf("traceur/");
	var baseTraceur = traceurPath.substr(0, lastTraceur);
	var traceurRuntime = fs.readFileSync( path.join(baseTraceur,"traceur/bin/traceur-runtime.js") );
	bundle.nodes.unshift( makeNode("[traceur-runtime]", traceurRuntime) );
};
