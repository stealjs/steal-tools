var UglifyJS = require("uglify-js"),
	_ = require("lodash");

module.exports = function(code, options){
	options = options || {};

	_.defaults(options, {
		fromString: true
	});
	return UglifyJS.minify(code, options).code
};
