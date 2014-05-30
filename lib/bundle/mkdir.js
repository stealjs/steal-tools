var fs = require('fs');
var mkdirp = require("../mkdirp");
var directory = require("./dist_dir");

module.exports = function(baseURL, distDir){
	var dir = directory.bundles(baseURL, distDir);
	
	return new Promise(function(resolve, reject){
		fs.exists(dir, function(exists){

			if(exists){
				resolve(dir);	
			} else {
				mkdirp(dir, function(err){
					if(err){
						reject(err);
					} else {
						resolve(dir);	
					}
				});
			}
			
			
		});		
		
	});
	
	
};
