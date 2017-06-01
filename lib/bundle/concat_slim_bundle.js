var path = require("path");
var through = require("through2");
var bundleFilename = require("./filename");
var getNodeSource = require("../node/source").node;
var concatSourceMap = require("../source-map-concat");

var makeSlimShimNode = require("../node/make_slim_shim_node");
var makeSlimBundleNode = require("../node/make_slim_bundle_node");
var makeSlimConfigNode = require("../node/make_slim_config_node");

module.exports = function() {
	return through.obj(function(data, enc, next) {
		try {
			next(null, concatBundles(data));
		} catch (err) {
			next(err);
		}
	});
};

function concatBundles(data) {
	var bundles = data.bundles;
	var configuration = data.configuration;
	var bundlesPath = configuration.bundlesPath;

	var slimConfigNode = makeSlimConfigNode(data);

	bundles.forEach(function(bundle, index) {
		var concatenated;
		var output = fileName(bundle);
		var isMainBundle = index === 0;
		var bundleNodes = bundle.nodes.map(toConcatenableNode);

		bundle.bundlePath = path.join(bundlesPath, bundleFilename(bundle));

		if (isMainBundle) {
			concatenated = concat(output, [
				slimConfigNode,
				makeSlimShimNode({
					nodes: bundleNodes,
					multipleBundles: bundles.length > 1,
					mainModuleId: getMainModuleId(data)
				})
			]);
		} else {
			concatenated = concat(output, [makeSlimBundleNode(bundle)]);
		}

		bundle.source = concatenated;
	});

	return data;
}

function concat(output, nodes) {
	var concatenated = concatSourceMap(nodes.map(toConcatenableNode), {
		mapPath: output + ".map",
		delimiter: "\n",
		process: prependName
	});

	return concatenated.toStringWithSourceMap({
		file: path.basename(output)
	});
}

function toConcatenableNode(node) {
	var source = getNodeSource(node);

	return {
		node: node,
		code: source.code,
		map: source.map
	};
}

function getMainModuleId(data) {
	var mainName = data.mains[0];
	return data.graph[mainName].load.uniqueId;
}

function fileName(bundle) {
	var name = bundle.name || bundle.bundles[0] || bundle.nodes[0].load.name;
	return (
		name.replace("bundles/", "").replace(/\..+!/, "") + "." + bundle.buildType
	);
}

function prependName(node, file) {
	var load = file.node.load;
	node.prepend("/*" + load.name + "*/\n");
}
