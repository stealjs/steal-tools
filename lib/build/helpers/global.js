var cjs = require("./cjs");
var baseHelper = require("./base");
var fs = require("fs");
var path = require("path");

var make = function(buildType){
	return {
		modules: cjs.graphs,
		format: function(){
			return "global";
		},
		dest: function(loc){
			if(loc) {
				return loc;
			}
			var pkg = JSON.parse( fs.readFileSync( path.join( process.cwd(), "package.json" ) ) );
			var name = pkg.name;
			
			return path.join(process.cwd(),"dist/global/"+name+"."+buildType);
		},
		ignore: function(items){
			return cjs.ignore(items).concat([function(name, load){
				var bt = load.metadata.buildType || "js";
				return bt !== buildType;
			}]);
		},
		normalize: function(){
			return function(depName, depLoad, curName, curLoad, loader){
				var parsed;
				if(depLoad.address.indexOf("node_modules") >=0) {
					parsed = baseHelper.parseModuleName(depLoad.name);
					
					return parsed.packageName+"/"+parsed.modulePath;
				} else {
					var pkg = loader.npmPaths.__default;
					
					var defaultPkgName = (pkg.system && pkg.system.name || pkg.name);
					
					parsed = baseHelper.parseModuleName(depLoad.name, defaultPkgName);
					var res = defaultPkgName+"/"+parsed.packageName+"/"+parsed.modulePath;
					
					return res;
				}
			};
			
			
		}
	};
};

var css = make("css");
css.noGlobalShim = function(value){
	return value || true;
};

module.exports = {
	js: baseHelper.makeHelper(make("js")),
	css: baseHelper.makeHelper(css)
};




