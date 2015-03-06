
var makeNode = require("../node/make_node"),
	minify = require("../graph/minify");

// makes it so this bundle loads steal
module.exports = function(bundle, options){
	
	
	var exports = options.exports; // ? exportsForDependencies(bundle.nodes, options.exports) : {};
	var source = "("+shim.toString()+")("+JSON.stringify(exports)+",window)";
	var node = makeNode("[global-shim]",source);
	if(options.minify){
		minify([node]);
	}
	bundle.nodes.unshift(node);
};

// This only includes exports for loads in the bundle and their dependencies. 
/*var exportsForDependencies = function(bundle, allExports){
	var exports = {};
	
	bundle.forEach(function(node){
		if(allExports[node.load.name]){
			exports[node.load.name] = allExports[node.load.name];
		}
		node.dependencies.forEach(function(dep){
			if(allExports[dep]){
				exports[dep] = allExports[dep];
			}
		});
	});
	return exports;
};*/

var shim = function(exports, global){
	var origDefine = global.define;

	var get = function(name){
		var parts = name.split("."),
			cur = global,
			i;
		for(i = 0 ; i < parts.length; i++){
			if(!cur) {
				break;
			}
			cur = cur[parts[i]];
		}
		return cur;
	};
	var modules = global.define && global.define.modules || {};
	var ourDefine = global.define = function(moduleName, deps, callback){
		var module;
		if(typeof deps === "function") {
			callback = deps;
			deps = [];
		}
		var args = [],
			i;
		for(i =0; i < deps.length; i++) {
			args.push( exports[deps[i]] ? get(exports[deps[i]]) : ( modules[deps[i]] || get(deps[i]) )  );
		}
		// CJS has no dependencies but 3 callback arguments
		if(!deps.length && callback.length) {
			module = { exports: {} };
			var require = function(name) {
				return exports[name] ? get(exports[name]) : modules[name];
			};
			args.push(require, module.exports, module);
		}
		// Babel uses only the exports objet
		else if(!args[0] && deps[0] === "exports") {
			module = { exports: {} };
			args[0] = module.exports;
		}

		global.define = origDefine;
		var result = callback ? callback.apply(null, args) : undefined;
		global.define = ourDefine;

		// Favor CJS module.exports over the return value
		modules[moduleName] = module && module.exports ? module.exports : result;
	};
	global.define.modules = modules;
	global.define.amd = true;
	global.System = {
		define: function(__name, __code){
			global.define = origDefine;
			eval("(function() { " + __code + " \n }).call(global);");
			global.define = ourDefine;
		}
	};
};
