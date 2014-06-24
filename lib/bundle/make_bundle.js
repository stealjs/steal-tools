// # lib/bundle/make_bundle.js
// Makes a __bundle__ graph from a dependency graph.
// A bundle graph contains objects that look like:
//
//     {
//       size: 231231,
//       nodes: [node1, node2, ...],
//       bundles: [bundleName1, bundleName2]	
//     }
//



var _ = require("lodash"),
	nodeSize = require("../node/size");

var getMostBundled = function(sharedGraph){
	if (!sharedGraph.length ) {
		return null;
	}
	// get the highest shared number
	var mostShared = sharedGraph.pop(),
		mostSize = 0,
		most;
		
	// go through each app combo, get the one that has
	// the bigest size
	for ( var apps in mostShared ) {
		if ( mostShared[apps].size > mostSize ) {
			most = mostShared[apps];
			mostSize = most.size;
		}
	}
	
	// order the files by when they should be included
	most.nodes = most.nodes.sort(function( f1, f2 ) {
		return f1.order - f2.order;
	});
	return most;
};


module.exports = function(graph){
	
	// Records if a module has already been bundled
	var bundled = {};
	
	var makeSharedGraph = function(){
		var sharedGraph = [];
		for(var name in graph) {
			// ignore files that have already been bundled
			if(bundled[name]) {
				continue;
			}
			var node = graph[name];
			// Adds the shared set for the number of apps 2: {}
			var sharedSet = setProp(sharedGraph, node.bundles.length, {});
			
			// a name for the combo
			var bundlesName = node.bundles.sort().join(),
				// a pack is data for a specific appNames combo
				sharing = setProp(sharedSet, bundlesName, function(){
					return {
						size: 0,
						nodes: [],
						bundles: node.bundles
					};
				});
				
			sharing.nodes.push(node);
			sharing.size += nodeSize(node);
		}
		return sharedGraph;
	};
	
	
	var bundles = [],
		bundle;
		
	while( bundle = getMostBundled( makeSharedGraph() ) ) {
		
		//mark files as packaged
		bundle.nodes.forEach(function(n){
			bundled[n.load.name] = true;
		});
		
		bundles.push(bundle);
	}
	return bundles;
};


var setProp = function(root, prop, raw, cb){
	if(!root[prop]){
		root[prop] = ( typeof raw === 'object' ?
			_.assign({},raw) :
			raw() );
	}
	cb && cb( root[prop] );
	return root[prop];
};


