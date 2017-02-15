var minify = require("../stream/minify");
var devBundle = require("../stream/dev_bundle");
var transpile = require("../stream/transpile");
var concat = require("../bundle/concat_stream");
var stealWriteStream = require("../stream/steal");
var filterDevBundleGraph = require("../stream/filter_dev_bundle_graph");

var assignDefaultOptions = require("../assign_default_options");
var createWriteStream = require("../bundle/write_bundles").createWriteStream;
var createBundleGraphStream = require("../graph/make_graph_with_bundles").createBundleGraphStream;

module.exports = function(config, options) {
	// Use the build-development environment.
	if (!options) options = {};

	// Minification is on by default
	options.minify = options.minify == null ? true : options.minify;

	try {
		options = assignDefaultOptions(config, options);
	} catch(err) {
		return Promise.reject(err);
	}

	options.dest = "";
	options.defaultBundlesPathName = "";

	var graphStream = createBundleGraphStream(config, options);
	var filteredGraphStream = graphStream.pipe(filterDevBundleGraph());
	var transpileStream = filteredGraphStream.pipe(transpile());
	var minifyStream = transpileStream.pipe(minify());
	var buildStream = minifyStream.pipe(devBundle());
	var concatStream = buildStream.pipe(concat());

	// Return a Promise that will resolve after bundles have been written
	return new Promise(function(resolve, reject) {
		// Pipe the build result into a write stream.
		var writeStream = buildStream
			.pipe(createWriteStream())
			.pipe(stealWriteStream());

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
