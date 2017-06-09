var path = require("path");
var prettier = require("prettier");
var assign = require("lodash/assign");
var includes = require("lodash/includes");
var getBundleFileName = require("../bundle/filename");
var isJavaScriptBundle = require("../bundle/is_js_bundle");

module.exports = function(options) {
	var bundles = options.bundles;
	var plugins = collectPlugins(bundles);

	// maps slim module ids (numbers) to slim bundle ids
	var slimBundlesConfig = {};

	// maps raw module ids to slim module ids
	var slimMapConfig = {};

	// maps slim bundle ids to the bundle file address
	var slimPathsConfig = {};

	// maps module ids (of not plain JS files, like css) to the module id of
	// the plugin needed to load the module correctly.
	var slimPluginsConfig = {};

	/**
	 * Returns then bundle's path relative to the loader baseUrl
	 *
	 * The bundles path at this point is an absolute file url, the relative
	 * version is needed in the written config so the loader can use script
	 * tags to load the bundles during runtime.
	 *
	 * @param {Object} bundle - The bundle object
	 * @return {string} the relative path
	 */
	function getRelativeBundlePath(bundle) {
		var baseUrl = options.baseUrl.replace("file:", "");

		return path.join(
			path.relative(baseUrl, options.bundlesPath),
			getBundleFileName(bundle)
		);
	}

	bundles.forEach(function(bundle) {
		slimPathsConfig[bundle.uniqueId] = getRelativeBundlePath(bundle);

		bundle.nodes.forEach(function(node) {
			if (node.load.uniqueId) {
				slimBundlesConfig[node.load.uniqueId] = bundle.uniqueId;

				assign(
					slimPluginsConfig,
					collectPluginNodeConfig(
						node.load.uniqueId,
						node.dependencies,
						plugins
					)
				);
			}
		});
	});

	options.progressiveBundles.forEach(function(bundleName) {
		var node = options.graph[bundleName];
		slimMapConfig[bundleName] = node.load.uniqueId;
	});

	var configSource = `
		(function(global) {
			global.steal = global.steal || {};

			global.steal.map = ${JSON.stringify(slimMapConfig)};
			global.steal.paths = ${JSON.stringify(slimPathsConfig)};
			global.steal.bundles = ${JSON.stringify(slimBundlesConfig)};
			global.steal.plugins = ${JSON.stringify(slimPluginsConfig)};

		}(window));
	`;

	return {
		load: {
			name: "[slim-loader-config]",
			metadata: { format: "global" },
			source: prettier.format(configSource, { useTabs: true })
		},
		dependencies: [],
		deps: []
	};
};

/**
 * Collect name and id of all nodes flagged as plugins
 * @param {Array.<bundle>} bundles - The list of bundles
 * @return {Array.<{ name: string, uniqueId: string }>} List of plugins
 */
function collectPlugins(bundles) {
	var plugins = [];

	bundles.filter(isJavaScriptBundle).forEach(function(bundle) {
		bundle.nodes.forEach(function(node) {
			if (node.isPlugin) {
				plugins.push({
					name: node.load.name,
					uniqueId: node.load.uniqueId
				});
			}
		});
	});

	return plugins;
}

/**
 * Return a map of module id to plugin module id
 * @param {string} nodeId - The node uniqueId number
 * @param {Array.<string>} nodeDependencies - The node dependencies
 * @param {Array} plugins - The plugins list
 * @return {Object}
 */
function collectPluginNodeConfig(nodeId, nodeDependencies, plugins) {
	var config = {};
	var dependencies = nodeDependencies || [];

	if (plugins.length && dependencies.length) {
		plugins
			.filter(function(plugin) {
				return includes(dependencies, plugin.name);
			})
			.forEach(function(plugin) {
				config[nodeId] = plugin.uniqueId;
			});
	}

	return config;
}
