// Utility functions for bundle directory names.
var path = require("path");

/**
 * The default location of the dist directory
 */
exports.default = "dist";

exports.name = function(distDir){
	if(distDir) {
		return path.basename(distDir);
	}

	return exports.default;
};

/**
 * Normalizes the dist directory based on options
 */
exports.dist = function(baseURL, distDir){
	if(typeof distDir === "string") {
		// Could be an empty string, if so return the base url
		if(distDir.length === 0) {
			return baseURL;
		}

		return distDir;
	}

	return path.join(baseURL, exports.default);
};

/**
 * Get the final bundles directory, including which dist folder it is
 * contained in.
 */
exports.bundles = function(baseURL, distDir){
	distDir = exports.dist(baseURL, distDir);

	return path.join(distDir, "bundles");
};
