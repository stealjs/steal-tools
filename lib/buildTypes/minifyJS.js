var isFunction = require("lodash").isFunction;

module.exports = function(source, options) {
	return (isFunction(options.minify)) ?
		options.minify(source, options) :
		uglify(source, options);
};

function uglify(source, options) {
	var UglifyJS = require("uglify-js");

	var code = source.code;
	var opts = (options != null) ? options.uglifyOptions : {};

	opts = opts || {};
	opts.fromString = true;

	if (source.map) {
		var inMap = source.map.toJSON();
		var file = inMap.sources && inMap.sources[0];
		opts.inSourceMap = inMap;
		opts.outSourceMap = file;

		if (options.sourceMapsContent) {
			opts.sourceMapIncludeSources = true;
		}
	}

	return UglifyJS.minify(code, opts);
}
