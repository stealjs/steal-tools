var fs = require('fs'),
	path = require('path');

var supportedBuildTypes = ["js","css"];

var cjsBasename = function(depLoad){

	var buildType = depLoad.metadata.buildType || "js";
	
	if( supportedBuildTypes.indexOf(buildType) >= 0 ) {
		// this will end in .js ... use the address
		var base = path.basename(depLoad.address),
			ext = path.extname(base);
		var clean = path.basename(base, ext);
		
		// might want to change to tabs.less.css
		return base+("."+buildType === ext ? "" : "."+buildType);
	} else {
		throw ("unsupported build type "+buildType);
	}
};

var removeFileProtocol = function(path){
	if(path.indexOf("file:") ===0 ){
		return path.substr(5);
	}
	return path;
};
var extend = function(d, s){
	for(var prop in s){
		d[prop] = s[prop];
	}
	return d;
};

var cjs = function(options){
	options = extend({}, options|| {});
	for(var prop in settings) {
		options[prop] = settings[prop](options[prop]);
	}
	return options;
};
/**
 * @module {function} steal-tools/lib/build/helpers/cjs
 * 
 * Provides helper methods that make exporting easier.
 * 
 * ```js
 * var cjsBuildHelper = require('steal-tools/lib/build/helpers/cjs');
 * 
 * 
 * stealPluginifier: {
 * 	 dist: {
 * 	   system: {...},
 *     options: {...},  
 *     outputs: {
 * 	     cjs: cjsBuildHelper()
 *     }
 *   }
 * }
 * ```
 * 
 */

var settings = {
	/**
	 * @function
	 * By default, looks for a package.json's system.main or main file.
	 * 
	 * @param {Array<>} modules An array of modules to overide the main file.
	 */
	graphs: function(modules){
		if(!Array.isArray(modules)) {
			var pkg = JSON.parse( fs.readFileSync( path.join(modules || process.cwd(), "package.json" ) ) );
			var main = (pkg.system && pkg.system.main) || pkg.main;
			return [main];
		}
	},
	format: function(){
		return "cjs";
	},
	useNormalizedDependencies: function(){
		return false;
	},
	/**
	 * @function
	 * 
	 * Returns a function that makes everything not in node_modules relative.
	 * @param {Object} aliases
	 */
	normalize: function(aliases){
		aliases = aliases || {};
		
		return function(depName, depLoad, curName, curLoad){
			if(aliases[depName]) {
				return aliases[depName];
			}
			// if both not in node_modules
			if(depLoad.address.indexOf("node_modules") === -1 && curLoad.address.indexOf("node_modules") === -1) {
				// provide its name relative
				depName = path.relative(path.dirname(curLoad.address), depLoad.address);
				if(depName[0] !== ".") {
					depName = "./"+depName;
				}
			}
			
			// if the path is already relative ... good ... keep it that way
			if(depName.indexOf("./") === 0) {
				return path.dirname(depName)+"/"+cjsBasename(depLoad);
			}
			
			// if two relative paths that are not in node_modules
			
			return depName;
		};
		
	},
	/**
	 * @function
	 * 
	 * Returns a `dest` function that names everything ending in .js or .css if it doesn't already have it and
	 * moves it to `dist/cjs`.
	 * @param {Object} aliases
	 */
	dest: function(aliases, root, dist){
		aliases = aliases || {};
		root = root || process.cwd();
		dist = dist || "dist/cjs";
		
		return function(moduleName, moduleData, load){
			if(aliases[moduleName]) {
				return path.join(root, dist, aliases[moduleName]);
			}
			
			// move it to lib/cjs and rename it
			var address = removeFileProtocol(path.dirname(load.address));
			address = address.replace(root,"");
			var basename = cjsBasename(load);

			return path.join(root, dist, address, basename);
		};
	},
	/**
	 * @function 
	 * 
	 * Ignores everything in _node_modules_.
	 * @param {Object} additional
	 */
	ignore: function(additional){
		return [function(name, load){
			if(load.address.indexOf("/node_modules/") >= 0 ) {
				return true
			};
		}].concat(additional || []);
	}
};

extend(cjs, settings);

module.exports = cjs;
