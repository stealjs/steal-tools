var makeOrderedTranspiledMinifiedGraph = require("../graph/make_ordered_transpiled_minified_graph"),
	makeBundleFromModuleName = require("../graph/get"),
	concatSource = require("../bundle/concat_source"),
	mapDependencies = require("../graph/map_dependencies"),
	clean = require("./clean"),
	logging = require('../logger'),
	hasES6 = require('../graph/has_es6'),
	path = require('path'),
	fs = require('fs');


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
		var module;
		if(typeof deps === "function") {
			callback = deps;
			deps = [];
		}
		var args = [],
			i;
		for(i =0; i < deps.length; i++) {
			args.push( exports[deps[i]] ? get(exports[deps[i]]) : modules[deps[i]]  );
		}
		// CJS has no dependencies but 3 callback arguments
		if(!deps.length && callback.length) {
			module = { exports: {} };
			var require = function(name) {
				return exports[name] ? get(exports[name]) : modules[name];
			};
			args.push(require, module.exports, module);
		}
		var result = callback.apply(null, args);
		// Favor CJS module.exports over the return value
		modules[moduleName] = module && module.exports ? module.exports : result;
	};
	global.define.modules = modules;
	global.System = {
		define: function(__name, __code){
			eval(__code);
		}
	};
};



var pluginifier = function(config, pluginifierOptions){
	pluginifierOptions = pluginifierOptions || {};
	var exports = pluginifierOptions.exports || {};

	// Setup logging
	logging.setup(pluginifierOptions);

	var makeOrderedOptions = {
		dependencyMapping: true
	};

	return makeOrderedTranspiledMinifiedGraph(config, makeOrderedOptions).then(function(data){

		var pluginify = function(moduleName, options){
			if(!moduleName) {
				moduleName = data.loader.main;
			}
			if(!options) {
				options = { ignore: [] };
			}

			var nodes = makeBundleFromModuleName(data.graph, moduleName);

			var ignores = pluginifier.getAllIgnores(options.ignore, data.graph);
			var nodesInBundle = pluginifier.notIgnored(nodes, ignores);
			
			var shim = pluginifier.shim(nodesInBundle, exports);
			
			var bundle = {nodes: nodesInBundle};
			concatSource(bundle,"transpiledSource");

			// If the user wants to keep dev tags like steal-remove-start
			if(options.keepDevTags) {
				return shim+"\n"+bundle.source;
			} else {
				return shim + "\n" + clean(bundle.source, {});
			}
		};

		// Set the graph on pluginify in case anyone needs to use it.
		pluginify.graph = data.graph;

		return pluginify;
		
		
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
	var result = "";
	if(hasES6(bundle)){
		result += fs.readFileSync(path.join(__dirname,"../..","/node_modules/traceur/bin/traceur-runtime.js"))+"\n";
	}
	return result+"("+shim.toString()+")("+JSON.stringify(exports)+",window)";
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
	baseIgnores = Array.isArray(baseIgnores) ? baseIgnores : [ baseIgnores ];

	baseIgnores.forEach(function(moduleName){

		// An ignore could be a regular expression, this only applies to strings.
		if(typeof moduleName === "string") {
			// Add this ignore's dependencies
			ignores = ignores.concat(mapDependencies(graph, moduleName, function(name){
				return name;
			}));
		} else {
			ignores.push(moduleName);
		}

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
