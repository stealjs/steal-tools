var minifyCSS = require("../buildTypes/minifyCSS");

module.exports = function(bundle, options) {
	options = options || {};

	if (options.minify && bundle.buildType === "css") {
		return minifyCSS(bundle.source, options);
	}

	return Promise.resolve(bundle.source);
};
