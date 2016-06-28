var minifyCSS = require("../buildTypes/minifyCSS");

module.exports = function(bundle, options) {
	options = options || {};

	// run through css-clean module
	// see minifyCSS.js for more info
	if (bundle.buildType === "css") {
		bundle.source = minifyCSS(bundle, options);
	}

	return bundle;
};
