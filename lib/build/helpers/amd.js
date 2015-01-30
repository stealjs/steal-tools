var cjs = require("./cjs");
var baseHelper = require("./base");
var path = require("path");

var cjsCopy = baseHelper.extend({}, cjs);

/**
 * @module {function} steal-tools/lib/build/helpers/amd amd
 * @parent steal-tools.helpers
 * 
 * Helpers that make exporting to AMD projects easier.
 * 
 * @signature `"+amd": { ... OVERWRITES ... }`
 * 
 * Adds [steal-tools.exporter.output] values that write a project out to an AMD format.
 * 
 */


module.exports = (baseHelper.makeHelper(baseHelper.extend(cjsCopy, {
	
	// graphs the same
	
	format: function(){
		return "amd";
	},
	
	// useNormalizedDependencies the same
	
	// very much like CJS's but:
	// - puts a css! for css build types
	// - remove .js for js resources 
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
			
			// if it ends in /
			var parts = depName.split("/"),
				last = parts[parts.lenght - 1];
				
			if(parts.length > 2 && (!last || last === parts[parts.lenght - 2]) ) {
				parts.pop();
				depName = parts.join("/");
			}
			
			// if the path is already relative ... good ... keep it that way
			if(depName[0] === ".") {
				depName = path.dirname(depName)+"/"+baseHelper.basename(depLoad);
			} 
			// if two relative paths that are not in node_modules
			
			var result = depName;
			
			
			var buildType = depLoad.metadata.buildType || "js";
			if(buildType === "css") {
				return buildType+"!"+result;
			}
			if(path.extname(result) === ".js") {
				return result.substr(0, result.length-3);
			}
			
			return result;
		};
	},
	// similar put defaults to putting things in dist/amd
	dest: baseHelper.makeDest("dist/amd")
	
	// ignore the same
})));




