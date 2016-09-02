var assign = require("lodash").assign;
var removeSourceMapUrl = require("../remove_source_map_url");

module.exports = function(source, options) {
	var minifier = options.minify === "closureCompiler" ?
		"closureCompiler" :
		"uglifyJS";

	var fn = minifiers[minifier];
	return fn(source, options);
};

var minifiers = {
	uglifyJS: function(source, options) {
		var code = source.code;
		var UglifyJS = require("uglify-js");

		var opts = assign({}, (options || {}).uglifyOptions, {
			fromString: true
		});

		if (source.map) {
			var inMap = source.map.toJSON();
			var file = inMap.sources && inMap.sources[0];

			opts.inSourceMap = inMap;
			opts.outSourceMap = file;

			if(options.sourceMapsContent) {
				opts.sourceMapIncludeSources = true;
			}
		}

		var result = UglifyJS.minify(code, opts);
		result.code = removeSourceMapUrl(result.code);

		return result;
	},

	closureCompiler: function(source, options) {
		var compile = require('google-closure-compiler-js/compile');

		var flags = assign({}, (options || {}).closureCompilerOptions, {
			jsCode: [{ src: source.code, sourceMap: source.map }]
		});

		// make sure closure compiler creates a source map if
		// steal-tools was set to generate source maps for the build
		if (source.map) {
			flags.createSourceMap = true;
		}

		var output = compile(flags);
		return {
			map: output.sourceMap,
			code: removeSourceMapUrl(output.compiledCode)
		};
	}
};
