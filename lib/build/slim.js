var pump = require("pump");
var assign = require("lodash/assign");
var isUndefined = require("lodash/isUndefined");
var assignDefaultOptions = require("../assign_default_options");

var streams = {
	bundle: require("../stream/bundle"),
	minify: require("../stream/minify"),
	slimBundles: require("../stream/slim"),
	transpile: require("../stream/transpile"),
	concat: require("../bundle/concat_stream"),
	addModuleIds: require("../stream/add_module_ids"),
	addBundleIds: require("../stream/add_bundle_ids"),
	filterGraph: require("../stream/filter_slim_graph"),
	checkSlimSupport: require("../stream/check_slim_support"),
	write: require("../bundle/write_bundles").createWriteStream,
	writeBundlesManifest: require("../stream/write_bundle_manifest"),
	loadOptimizedPlugins: require("../stream/load_optimized_plugins"),
	graph: require("../graph/make_graph_with_bundles").createBundleGraphStream
};

module.exports = function(config, options) {
	var buildOptions = assign({}, options);

	// minification is on by default
	assign(buildOptions, {
		minify: isUndefined(buildOptions.minify) ? true : buildOptions.minify
	});

	try {
		options = assignDefaultOptions(config, buildOptions);
	} catch (err) {
		return Promise.reject(err);
	}

	return new Promise(function(resolve, reject) {
		var writeSteam = pump(
			streams.graph(config, buildOptions),
			streams.filterGraph(),
			streams.checkSlimSupport(),
			streams.addModuleIds(),
			streams.loadOptimizedPlugins(),
			streams.transpile({ outputFormat: "slim" }),
			streams.bundle(),
			streams.addBundleIds(),
			streams.slimBundles(),
			streams.concat(),
			streams.minify(),
			streams.write(),
			streams.writeBundlesManifest(),
			reject
		);

		writeSteam.on("data", resolve);
	});
};
