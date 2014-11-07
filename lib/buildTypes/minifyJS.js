var UglifyJS = require("uglify-js");

module.exports = function(code, options){
	var opts = (options != null) ? options.uglifyOptions : {};

	opts = opts || {};
	opts.fromString = true;

	return UglifyJS.minify(code, opts).code;
};
