var pump = require("pump");
var arrify = require("../arrify");
var assign = require("lodash/assign");
var difference = require("lodash/difference");
var makeDeferred = require("../make-deferred");
var isUndefined = require("lodash/isUndefined");
var assignDefaultOptions = require("../assign_default_options");

// streams
var buildType = require("../stream/build_type");
var bundle = require("../stream/bundle");
var minify = require("../stream/minify");
var slimBundles = require("../stream/slim");
var transpile = require("../stream/transpile");
var concat = require("../bundle/concat_stream");
var addModuleIds = require("../stream/add_module_ids");
var addBundleIds = require("../stream/add_bundle_ids");
var filterGraph = require("../stream/filter_slim_graph");
var addPluginNames = require("../stream/add_plugin_names");
var addAtLoaderShim = require("../stream/add_loader_shim");
var cloneBuildData = require("../stream/clone_build_data");
var loadNodeBuilder = require("../stream/load_node_builder");
var checkSlimSupport = require("../stream/check_slim_support");
var convertSlimConfig = require("../stream/convert_slim_config");
var adjustBundlesPath = require("../stream/adjust_bundles_path");
var write = require("../bundle/write_bundles").createWriteStream;
var writeBundlesManifest = require("../stream/write_bundle_manifest");
var graph = require("../graph/make_graph_with_bundles").createBundleGraphStream;

module.exports = function(config, options) {
	var slimDfd = makeDeferred();
	var buildOptions = assign({}, options);
	var supportedTargets = ["web", "node", "worker"];

	// minification is on by default
	assign(buildOptions, {
		minify: isUndefined(buildOptions.minify) ? true : buildOptions.minify
	});

	try {
		options = assignDefaultOptions(config, buildOptions);
	} catch (err) {
		return Promise.reject(err);
	}

	// fail early if an unknown target is passed in
	var targets = arrify(buildOptions.target);
	if (difference(targets, supportedTargets).length) {
		var unknown = difference(targets, supportedTargets);
		return Promise.reject(
			new Error(
				`Cannot create slim build, target(s) ${unknown.join(",")} not supported`
			)
		);
	}

	var initialStream = pump(
		graph(config, buildOptions),
        buildType("optimize"),
		filterGraph(),
		checkSlimSupport(),
		addAtLoaderShim(),
		addModuleIds(),
		convertSlimConfig(),
		loadNodeBuilder(),
		transpile({ outputFormat: "slim" }),
		bundle(),
		addPluginNames(),
		addBundleIds(),
		function(err) {
			if (err) slimDfd.reject(err);
		}
	);

	var promises = (targets.length ? targets : [""]).map(function(target) {
		var dfd = makeDeferred();

		var final = pump(
			initialStream,
			cloneBuildData(),
			adjustBundlesPath({ target: target }), // the "" target is relevant for this transform
			slimBundles({ target: target || "web" }), // set default target so there is no need to handle ""
			concat(),
			minify(),
			write(),
			writeBundlesManifest(),
			function(err) {
				if (err) dfd.reject(err);
			}
		);

		final.on("data", dfd.resolve);
		return dfd.promise;
	});

	Promise.all(promises).then(
		// If no `target` is provided resolves `buildResult`; otherwise
		// resolves an object where the key is the target name and its value
		// the `buildResult` object.
		function(results) {
			var value;

			if (targets.length) {
				value = {};
				results.forEach(function(result, index) {
					value[targets[index]] = result;
				});
			} else {
				value = results[0];
			}

			slimDfd.resolve(value);
		},
		slimDfd.reject
	);

	return slimDfd.promise;
};
