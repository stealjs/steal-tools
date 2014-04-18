var fs = require('fs');

module.exports = function(baseURL){
	
	var dir = baseURL+"bundles";
	
	return new Promise(function(resolve, reject){
		fs.exists(dir, function(exists){

			if(exists){
				resolve(dir);	
			} else {
				fs.mkdir(dir, function(err){
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
