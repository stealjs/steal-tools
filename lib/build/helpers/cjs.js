var fs = require('fs'),
	path = require('path'),
	baseHelper = require('./base');

// TODO: this should be loaded from steal:

function parseModuleName (moduleName, currentPackageName) {
	var pluginParts = moduleName.split('!');
	var modulePathParts = pluginParts[0].split("#");
	var versionParts = modulePathParts[0].split("@");
	// it could be something like `@empty`
	if(!modulePathParts[1] && !versionParts[0]) {
		versionParts = ["@"+versionParts[0]];
	}
	var packageName, 
		modulePath;
	
	// if relative, use currentPackageName
	if( currentPackageName && moduleName[0] === "." ) {
		packageName= currentPackageName;
		modulePath = versionParts[0];
	} else {
		
		if(modulePathParts[1]) { // foo@1.2#./path
			packageName = versionParts[0];
			modulePath = modulePathParts[1];
		} else {
			// test/abc
			var folderParts = versionParts[0].split("/");
			packageName = folderParts.shift();
			modulePath = folderParts.join("/");
		}
		
	}
	
	return {
		plugin: pluginParts.length === 2 ? "!"+pluginParts[1] : undefined,
		version: versionParts[1],
		modulePath: modulePath,
		packageName: packageName,
		moduleName: moduleName
	};
}

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
module.exports = baseHelper.makeHelper({
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
		
		return function(depName, depLoad, curName, curLoad, loader){
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
			
			// if it ends in /
			if(depName[depName.length -1] === "/") {
				var parts = depName.split("/");
				parts[parts.length -1] = parts[parts.length -2];
				depName = parts.join("/");
			}
			
			// if the path is already relative ... good ... keep it that way
			if(depName[0] === ".") {
				depName = path.dirname(depName)+"/"+baseHelper.basename(depLoad);
			} else if(depLoad.address.indexOf("node_modules") !== -1){
				// this means its something like can/foo
				// make sure we are referencing the package name
				var parsed = parseModuleName(depLoad.name);
				if(!parsed.packageName || !parsed.version) {
					return depName;
				}
				// SYSTEM.NAME
				var pkg = loader.npm[parsed.packageName+"@"+parsed.version];
				var systemName = pkg.system && pkg.system.name;
				if(systemName && depName.indexOf(systemName) === 0) {
					depName = depName.replace(systemName, pkg.name);
				}
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
		dist = dist || ".";
		
		return function(moduleName, moduleData, load){
			if(aliases[moduleName]) {
				return path.join(root, dist, aliases[moduleName]);
			}
			
			// move it to lib/cjs and rename it
			var address = path.dirname(baseHelper.cleanModuleName(moduleName));
			var basename = baseHelper.basename(load);

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
			if(load.address.indexOf("/node_modules/") >= 0 || load.metadata.format === "defined") {
				return true;
			}
		}].concat(additional || []);
	}
});
