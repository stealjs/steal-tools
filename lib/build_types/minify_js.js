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
	var UglifyJS = require("uglify-es");
	var envify = require("loose-envify/replace");

	var code = source.code;
	var existingSourceMap = source.map;
	var uglifyOptions = assign({}, options ? options.uglifyOptions : {});

	if (options.sourceMaps) {
		var sourceMap = uglifyOptions.sourceMap || {};

		if (existingSourceMap) {
			var content = getRawSourceMap(existingSourceMap);
			var filename = content.sources && content.sources[0];

			sourceMap.filename = filename;
			sourceMap.content = content;
		}

		sourceMap.includeSources = !!options.sourceMapsContent;
		uglifyOptions.sourceMap = sourceMap;
	}

	if (options.envify) {
		code = envify(code, [process.env]);
	}

	return UglifyJS.minify(code, uglifyOptions);
}

function getRawSourceMap(map) {
	return isFunction(map.toJSON) ? map.toJSON() : map;
}
