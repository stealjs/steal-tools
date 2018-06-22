var assign = require("lodash/assign");
var isFunction = require("lodash/isFunction");
var babelMinify = require("./babel-minify");
var uglify = require("./uglify");

exports.sync = uglify;

exports.async = function(source, options) {
	// use the `minify` function if provided
	if (isFunction(options.minify)) {
		return Promise.resolve().then(function() {
			return options.minify(source, options);
		});
	} else if(typeof options.minify === "string") {
		switch(options.minify) {
			case "uglify":
				return uglify.async(source, options);
			case "babel-minify":
				return babelMinify.async(source, options);
			default:
				throw new Error(`The [${options.minify}] minifier is not supported.`);
		}
	}

	return babelMinify.async(source, options);
};
