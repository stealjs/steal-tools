var makeOrderedTranspiledMinifiedGraph = require("../graph/make_ordered_transpiled_minified_graph"),
	makeBundleFromModuleName = require("../graph/get"),
	concatSource = require("../bundle/concat_source"),
	mapDependencies = require("../graph/map_dependencies");


var toss = function(e){
	setTimeout(function(){
		throw e;
	},1);
};

var shim = function(exports, global){
	var get = function(name){
		var parts = name.split("."),
			cur = global,
			i;
		for(i = 0 ; i < parts.length; i++){
			cur = cur[parts[i]];
		}
		return cur;
	};
	var modules = global.define && global.define.modules || {};
	global.define = function(moduleName, deps, callback){
		if(typeof deps === "function") {
			callback = deps;
			deps = [];
		}
		var args = [],
			i;
		for(i =0; i < deps.length; i++) {
			args.push( exports[deps[i]] ? get(exports[deps[i]]) : modules[deps[i]]  );
		}
		modules[moduleName] = callback.apply(null, args);
	};
	global.define.modules = modules;
	global.System = {
		define: function(__name, __code){
			eval(code);
		}
	};
};



var pluginifier = function(pluginifyConfig){

	return makeOrderedTranspiledMinifiedGraph(pluginifyConfig.system).then(function(data){
		
		return function pluginify(moduleName, options){
			if(!moduleName) {
				moduleName = data.loader.main;
			}
			if(!options) {
				options = { ignore: [] };
			}
			var nodes = makeBundleFromModuleName(data.graph, moduleName);

			var ignores = pluginifier.getAllIgnores(options.ignore, data.graph);
			var nodesInBundle = pluginifier.notIgnored(nodes, ignores);
			
			var shim = pluginifier.shim(nodesInBundle, pluginifyConfig.exports);
			
			var bundle = {nodes: nodesInBundle};
			concatSource(bundle,"transpiledSource");
			return shim+"\n"+bundle.source;
		};
		
		
	}).catch(function(e){
		toss(e);
	});
	
};

pluginifier.exportsForDependencies = function(bundle, allExports){
	var exports = {};
	
	bundle.forEach(function(node){
		if(allExports[node.load.name]){
			exports[node.load.name] = allExports[node.load.name];
		}
	});
	return exports;
};

pluginifier.shim = function(bundle, allExports){
	// given the deps, 
	var exports = allExports ? pluginifier.exportsForDependencies(bundle, allExports) : {};
	
	return "("+shim.toString()+")("+JSON.stringify(exports)+",window)";
};

var matches = function(rules, name){
	if(rules === name) {
		return true;
	}else if( Array.isArray(rules) ) {
		for(var i =0; i < rules.length; i++) {
			if( matches(rules[i], name) ) {
				return true;
			}
		}
	} else if( rules instanceof RegExp) {
		return rules.test(name);
	}
	
};

pluginifier.getAllIgnores = function(baseIgnores, graph) {
	var ignores = [];
	baseIgnores = Array.isArray(ignores) ? baseIgnores : [ baseIgnores ];

	baseIgnores.forEach(function(moduleName){

		// Add this ignore's dependencies
		ignores = ignores.concat(mapDependencies(graph, moduleName, function(name){
			return name;
		}));

	});

	return ignores;
};

pluginifier.notIgnored = function( bundle, rules ) {
	var notIgnored = [];
	bundle.forEach(function(node){
		if( !matches(rules, node.load.name) ) {
			notIgnored.push(node);
		}
	});
	return notIgnored;
};


module.exports = pluginifier;
