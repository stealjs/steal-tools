var prettier = require("prettier");
var endsWith = require("lodash/endsWith");
var getNodeSource = require("./source").node;
var makeShimTemplate = require("./slim/make_shim_template");

module.exports = function(options) {
	var modules = options.nodes.slice(0);

	var template = makeShimTemplate({
		target: options.target,
		plugins: options.plugins,
		splitLoader: options.splitLoader,
		progressive: options.progressive,
		sharedBundles: options.sharedBundles,
		extensions: options.slimConfig.extensions.length,
		resolve: options.slimConfig.identifiersToResolve.length
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
