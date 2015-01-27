var cjs = require("./cjs");
var baseHelper = require("./base");
var fs = require("fs");
var path = require("path");
var npmUtils = require("steal/ext/npm-utils");

var make = function(buildType){
	return {
		modules: cjs.graphs,
		format: function(){
			return "global";
		},
		dest: function(loc){
			return function(moduleName, moduleData, load, System){
				if(loc) {
					return loc;
				} else {
					var baseRoot = baseHelper.removeFileProtocol(System.baseURL);
					var name;
					try {
						var pkg = JSON.parse( fs.readFileSync( path.join( baseRoot, "package.json" ) ) );
						name = pkg.name;
					} catch(e) {
						name = path.basename(baseRoot); 
					}
					return path.join(baseRoot,"dist/global",name+"."+buildType);
				}
			};
		},
		ignore: function(items){
			return cjs.ignore(items).concat([function(name, load){
				var bt = load.metadata.buildType || "js";
				return bt !== buildType;
			}]);
		},
		useNormalizedDependencies: function(){
			return false;
		},
		normalize: function(){
			return function(depName, depLoad, curName, curLoad, loader){
				if( depLoad.address.indexOf("node_modules") >=0 ) {
					return depName;
				} else {
					// convert this to what would be the normalized name
					var pkg = loader.npmPaths.__default;
					var res;
					if( depLoad.name === npmUtils.pkg.main(pkg) ) {
						res = npmUtils.pkg.name(pkg);
					} else {
						res = npmUtils.pkg.name(pkg)+"/"+depLoad.name;
					}
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




