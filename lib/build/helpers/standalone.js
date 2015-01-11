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
			
			return path.join(process.cwd(),"dist/standalone/"+name+"."+buildType);
		},
		ignore: function(items){
			return cjs.ignore(items).concat([function(name, load){
				var bt = load.metadata.buildType || "js";
				return bt !== buildType;
			}]);
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




