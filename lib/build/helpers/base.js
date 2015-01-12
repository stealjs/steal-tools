var path = require("path");
var supportedBuildTypes = ["js","css"];

var extend = function(d, s){
	for(var prop in s){
		d[prop] = s[prop];
	}
	return d;
};

module.exports = {
	makeHelper: function(settings){
		debugger;
		var func = function(options){
			debugger;
			options = extend({}, options|| {});
			for(var prop in settings) {
				options[prop] = settings[prop](options[prop]);
			}
			return options;
		};
		extend(func, settings);
		return func;
	},
	extend: extend,
	cleanModuleName: function(moduleName){
		return moduleName.replace(/!.*$/,"");
	},
	basename: function(depLoad){
	
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
	},
	removeFileProtocol: function(path){
		if(path.indexOf("file:") ===0 ){
			return path.substr(5);
		}
		return path;
	}
};
