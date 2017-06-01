var prettier = require("prettier");
var makeShimCode = require("./slim/make_shim_code");

module.exports = function(options) {
	// Ignore some nodes not needed for the slim loader
	// nodes[0] === [system-bundles-config]
	// nodes[1] === @configMain
	var modules = options.nodes.slice(2);

	var code = prettier.format(
		makeShimCode({
			modules: modules,
			mainModuleId: options.mainModuleId,
			multipleBundles: options.multipleBundles
		}),
		{ useTabs: true }
	);

	return {
		load: {
			source: code,
			name: "[slim-loader-shim]",
			metadata: { format: "global" }
		},
		dependencies: [],
		deps: []
	};
};
