var UglifyJS = require("uglify-js");

module.exports = function(source, options){
	var opts = (options != null) ? options.uglifyOptions : {};
	var code = source.code;

	opts = opts || {};
	opts.fromString = true;
	if(source.map) {
		var inMap = source.map.toJSON();
		var file = inMap.sources && inMap.sources[0];
		opts.inSourceMap = inMap;
		opts.outSourceMap = file;

		if(options.sourceMapsContent) {
			opts.sourceMapIncludeSources = true;
		}
	}

	return UglifyJS.minify(code, opts);
};
