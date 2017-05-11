var path = require("path");
var through = require("through2");
var prettier = require("prettier");
var bundleFilename = require("./filename");
var makeNode = require("../node/make_node");
var makeSlimLoader = require("./make_slim_loader");
var getNodeSource = require("../node/source").node;
var concatSourceMap = require("../source-map-concat");

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

	bundles.forEach(function(bundle, index) {
		var concatenated;
		var output = fileName(bundle);
		var isMainBundle = index === 0;
		var bundleNodes = getBundleNodes(bundle);

		bundle.bundlePath = path.join(bundlesPath, bundleFilename(bundle));

		if (isMainBundle) {
			concatenated = concat(
				output,
				makeLoaderNode({
					nodes: bundleNodes,
					multipleBundles: bundles.length > 1
				})
			);
		} else {
			concatenated = concat(output, bundleNodes);
		}

		bundle.source = concatenated;
	});

	return data;
}

function concat(output, nodes) {
	var concatenated = concatSourceMap(nodes, {
		mapPath: output + ".map",
		delimiter: "\n",
		process: prependName
	});

	return concatenated.toStringWithSourceMap({
		file: path.basename(output)
	});
}

function makeLoaderNode(options) {
	// Ignore some nodes not needed for the slim loader
	// nodes[0] === [system-bundles-config]
	// nodes[1] === @configMain
	var modules = options.nodes.slice(2);

	var code = prettier.format(
		makeSlimLoader({
			mainModuleId: 0,
			modules: modules,
			multipleBundles: options.multipleBundles
		}),
		{ useTabs: true }
	);

	var node = makeNode("[slim-loader]", code);
	var source = getNodeSource(node);

	return [
		{
			node: node,
			code: source.code,
			map: source.map
		}
	];
}

function getBundleNodes(bundle) {
	return bundle.nodes.map(function(node) {
		var source = getNodeSource(node);

		return {
			node: node,
			code: source.code,
			map: source.map
		};
	});
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
