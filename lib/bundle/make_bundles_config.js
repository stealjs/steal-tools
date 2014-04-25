module.exports = function(bundles){
	
	var bundlesConfig = {};
	bundles.forEach(function(bundle){
		bundlesConfig[bundle.name] = bundle.nodes.map(function(node){
			return node.load.name;
		});
	});
	
	return {
		load: {name: "bundlesConfig"},
		minifiedSource: "System.bundles = "+JSON.stringify(bundlesConfig)+";"
	};
};
