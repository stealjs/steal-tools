var cjs = require("./cjs");
var baseHelper = require("./base");
var path = require("path");

var cjsCopy = baseHelper.extend({}, cjs);

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
		var cjsNormalize = cjs.normalize(aliases);
		return function(depName, depLoad){
			var result = cjsNormalize.apply(this, arguments);
			
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
	dest: function(aliases, root, dist){
		dist = dist || "dist/amd";
		return cjs.dest(aliases, root, dist);
	}
	
	// ignore the same
})));




