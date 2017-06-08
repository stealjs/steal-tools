var pump = require("pump");
var assignDefaultOptions = require("../assign_default_options");

var streams = {
	slim: require("../stream/slim"),
	bundle: require("../stream/bundle"),
	transpile: require("../stream/transpile"),
	concat: require("../bundle/concat_stream"),
	addModuleIds: require("../stream/add_module_ids"),
	addBundleIds: require("../stream/add_bundle_ids"),
	filterGraph: require("../stream/filter_slim_graph"),
	write: require("../bundle/write_bundles").createWriteStream,
	graph: require("../graph/make_graph_with_bundles").createBundleGraphStream
};

module.exports = function(config, options) {
	if (!options) options = {};

	try {
		options = assignDefaultOptions(config, options);
	} catch (err) {
		return Promise.reject(err);
	}

	return new Promise(function(resolve, reject) {
		var writeSteam = pump(
			streams.graph(config, options),
			streams.filterGraph(),
			streams.addModuleIds(),
			streams.transpile({ outputFormat: "slim" }),
			streams.bundle(),
			streams.addBundleIds(),
			streams.slim(),
			streams.concat(),
			streams.write(),
			reject
		);

		writeSteam.on("data", resolve);
	});
};
