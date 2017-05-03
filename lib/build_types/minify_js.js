var assign = require("lodash/assign");
var isFunction = require("lodash/isFunction");

exports.sync = uglify;

exports.async = function(source, options) {
	// use the `minify` function if provided
	if (isFunction(options.minify)) {
		return Promise.resolve().then(function() {
			return options.minify(source, options);
		});
	}

	return Promise.resolve()
		.then(function() {
			return uglify(source, options);
		});
};

function uglify(source, options) {
	var envify = require("loose-envify/replace");
	var UglifyJS = require("uglify-js");

	var code = source.code;
	var opts = assign({}, options ? options.uglifyOptions : {}, {
		fromString: true
	});

	if (source.map) {
		var inMap = source.map.toJSON();
		var file = inMap.sources && inMap.sources[0];

		opts.inSourceMap = inMap;
		opts.outSourceMap = file;

		if (opts.sourceMapsContent) {
			opts.sourceMapIncludeSources = true;
		}
	}

	if (options.envify) {
		code = envify(code, [process.env]);
	}

	return UglifyJS.minify(code, opts);
}
