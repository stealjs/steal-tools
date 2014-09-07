var UglifyJS = require("uglify-js"),
	_ = require("lodash");

module.exports = function(code, options){
	var opts = (options != null) ? options.uglifyOptions : {};

	// defaults
	opts = _.assign({
		fromString: true
	}, opts);

	return UglifyJS.minify(code, opts).code;
};
