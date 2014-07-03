/**
 * @typedef options
 * 
 * @param {String} [distDir='//dist']  Specifies the path where the build files should be 
 * placed. By default, the location is a dist folder directly within the baseURL folder.
 * 
 * The path can be specified in three ways:
 * 
 *  - Relative to baseURL - distDir starts with `//` like `distDir: "//place"`
 *  - Relative to `process.cwd()` - distDir starts with `./` like `distDir: "./place"`
 *  - Absolute path - distDir does not start with `//` or `./` like `distDir: __dirname+"/place"` 
 * 
 * 
 * @param {Object} buildLoader
 * @param {Object} options
 */

var fs = require("fs-extra"),
	path = require("path");


module.exports = function(loader, buildLoader, options){
	return new Configuration(loader, buildLoader, options);
};

function Configuration(loader, buildLoader, options){
	this.loader = loader;
	this.buildLoader = buildLoader;
	this.options = options;
};

// full path
// relative to 

Configuration.prototype = {
	join: function(src){
		if(src.indexOf("//") === 0) {
			return path.join(this.loader.baseURL, src.substr(2));
		} else if( src.indexOf("./") === 0 ){
			return path.join(process.cwd(), src.substr(2));
		} else {
			return src;
		}
	},
	get distDir () {
	 	var dir = this.options.distDir;
	 	if(dir === "") {
	 		dir = "//"
	 	} else if(!dir) {
	 		dir = "//dist"
	 	}
	 	return this.join( dir );
	},
	get distURL () {
		return path.relative( this.loader.baseURL, this.distDir );
	},
	mkDistDir: function(){
		var distDir = path.join(this.distDir,"bundles");
		return new Promise(function(resolve, reject){
			fs.mkdirs(distDir, function(err){
				if(err) {
					reject(err);
				} else {
					resolve();
				}
			})
		});
	}
};








