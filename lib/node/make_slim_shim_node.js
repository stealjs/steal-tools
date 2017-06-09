var prettier = require("prettier");
var endsWith = require("lodash/endsWith");
var getNodeSource = require("./source").node;
var makeShimTemplate = require("./slim/make_shim_template");

module.exports = function(options) {
	// Ignore some nodes not needed for the slim loader
	// nodes[0] === [system-bundles-config]
	// nodes[1] === @configMain
	var modules = options.nodes.slice(2);

	var template = makeShimTemplate({
		plugins: options.plugins,
		progressive: options.progressive
	});

	var args = modules
		.map(function(node) {
			var code = getNodeSource(node).code.toString();
			return endsWith(code, ";") ? code.substring(0, code.length - 1) : code;
		})
		.join(",");

	var code = prettier.format(
		template({
			args: args,
			mainModuleId: options.mainModuleId
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
