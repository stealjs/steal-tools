var UglifyJS = require("uglify-js"),
	_ = require("lodash");

module.exports = function(code, options){
	var opts = (options != null) ? options.uglifyOptions : {};
	opts = opts || {};

	_.defaults(opts, {
		fromString: true
	});
	return UglifyJS.minify(code, opts).code
};
