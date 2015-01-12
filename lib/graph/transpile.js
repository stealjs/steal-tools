var transpile = require('transpile');
var nodeDependencyMap = require("../node/dependency_map"),
	minify = require("../buildTypes/minifyJS"),
	transformActiveSource = require("../node/transform_active_source"),
	_ = require("lodash");


var transpileNode = function(node, outputFormat, options, graph){
	
	
	if( !node.load.metadata.buildType || node.load.metadata.buildType === "js"  ) {
		
		transformActiveSource(node,"format-"+outputFormat,function(node, source){
			var opts = _.clone(options);
			var depMap = nodeDependencyMap(node);
			
			if(opts.useNormalizedDependencies) {
				opts.normalizeMap = depMap;
			}
			// make sure load has activeSource
			var load = _.clone(node.load, true);
			load.source = source || load.source;
			// Minify globals prior to transpiling because they can't
			// be minified after they become a System.define.
			if(load.metadata.format === "global" && options.minify) {
				load.source = minify(load.source, options);
			}
			// I'm not sure how to handle defined.  "less" is an example of something we
			// define.  Presumably these should all be ignored.
			// also ignore any non js build type ... for now ...!
			var buildType = load.metadata.buildType || "js";
			if(load.metadata.format === "defined" || buildType !== "js") {
				return source;
			}
			if(opts.normalize) {
				
				var givenNormalize = opts.normalize;
				opts.normalize = function(name, curName){
					// if name === curName ... it's asking to normalize the current module's name
					// for something like define('component/component',[...])
					// component/component won't be in depMap.
					var depLoad;
					if(name === curName) {
						depLoad = load;
					} else {
						var normalizedName = options.useNormalizedDependencies ? name : depMap[name];
						depLoad = graph[ normalizedName ].load;
					}
					return givenNormalize.call(this, name, depLoad, curName, load);
				};
			}
			return transpile.to(load, outputFormat, opts);
		});
	}
};

// fullGraph - if graph is a bundle ... fullGraph is the actual graph
module.exports = function(graph, outputFormat, options, fullGraph){
	
	options = options || {};
	if(Array.isArray(graph)) {
		graph.forEach(function(node){
			transpileNode(node, outputFormat, options, fullGraph);
		});
	} else {
		for(var name in graph) {
			var node = graph[name];
			// If JavaScript
			transpileNode(node, outputFormat, options, graph);
		}
	}
};
