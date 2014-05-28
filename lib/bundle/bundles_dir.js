// Utility functions for bundle directory names.
var path = require("path");

exports.name = function(bundlesDir){
	if(bundlesDir) {
		return path.basename(bundlesDir);
	}

	return "bundles";
};
