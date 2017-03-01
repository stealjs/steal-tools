var assign = require("lodash").assign;
var minify = require("../stream/minify");
var transpile = require("../stream/transpile");
var concat = require("../bundle/concat_stream");
var makeBundle = require("../stream/make_bundle");
var filterBundleGraph = require("../stream/filter_bundle_graph");

var assignDefaultOptions = require("../assign_default_options");
var createWriteStream = require("../bundle/write_bundles").createWriteStream;
var createBundleGraphStream = require("../graph/make_graph_with_bundles").createBundleGraphStream;

module.exports = function(config, options) {
	// Use the build-development environment.
	if (!options) options = {};

	var isDestProvided = !!options.dest;

	// minification is on by default
	options.minify = options.minify == null ? true : options.minify;

	try {
		options = assignDefaultOptions(config, options);
	} catch(err) {
		return Promise.reject(err);
	}

	// if `dest` was not provided in the options object, override the default
	// value so the development bundle is written out in the root folder
	assign(options, {
		defaultBundlesPathName: "",
		dest: isDestProvided ? options.dest : "",
		buildStealConfig: {
			env: "bundle-build"
		}
	});

	var graphStream = createBundleGraphStream(config, options);
	var filteredGraphStream = graphStream.pipe(filterBundleGraph());
	var transpileStream = filteredGraphStream.pipe(transpile());
	var minifyStream = transpileStream.pipe(minify());
	var buildStream = minifyStream.pipe(makeBundle());
	var concatStream = buildStream.pipe(concat());

	return new Promise(function(resolve, reject) {
		var writeStream = buildStream.pipe(createWriteStream());

		writeStream.on("data", function(data){
			this.end();
			resolve(data);
		});

		var streams = [
			graphStream,
			filteredGraphStream,
			transpileStream,
			minifyStream,
			buildStream,
			concatStream
		];

		streams.forEach(function(stream) {
			stream.on("error", reject);
		});
	});
};
