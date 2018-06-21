var concatAMD = require("./concat_source_amd");
var concatES = require("./concat_source_es");

module.exports = function(bundle, options = {}){
	var sourceProp = options.sourceProp;
	var excludePlugins = options.excludePlugins;

	var result;
	
	if(options.format === "es") {
		result = concatES(bundle, sourceProp, excludePlugins);
	} else if(options.format === "amd") {
		result = concatAMD(bundle, sourceProp, excludePlugins);
	} else {
		return Promise.reject(new Error(`Unsupported concat format: ${options.format}`));
	}

	return Promise.resolve(result);
};
