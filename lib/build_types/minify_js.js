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
	var opts = assign({}, options ? options.uglifyOptions : {});

	if (source.map) {
		var content = source.map.toJSON();
		var filename = content.sources && content.sources[0];

		opts.sourceMap = opts.sourceMap || {};
		opts.sourceMap.filename = filename;
		opts.sourceMap.content = content;

		if (options.sourceMapsContent) {
			opts.sourceMap.includeSources = true;
		}
	}

	if (options.envify) {
		code = envify(code, [process.env]);
	}

	return UglifyJS.minify(code, opts);
}
