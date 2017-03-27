var _ = require("lodash");
var path = require("path");
var babel = require("babel-standalone");

/**
 * A Babel plugin as defined in `babelOptions.plugins`
 * @typedef {string|Function|<string, Object>[]|<Function, Object>[]} BabelPlugin
 */

/**
 * The options needed to load the babel plugins not bundled in babel-standalone
 * @typedef {Object} LoadCustomPluginsOptions
 * @property {string} baseURL The loader baseURL value
 * @property {string} loaderEnv The loader env value
 * @property {Object} babelOptions The babel configuration options
 */

/**
 * Returns a list of babel plugins to be used by transpile
 * @param {LoadCustomPluginsOptions} opts The options object
 * @return {BabelPlugin[]} The list of plugins to be used by transpile
 */
module.exports = function(opts) {
	var processed = [];
	var babelOptions = opts.babelOptions || {};
	var babelEnvConfig = babelOptions.env || {};

	var babelEnv = process.env.BABEL_ENV ||
		process.env.NODE_ENV ||
		opts.loaderEnv;

	var processPlugins = makeProcessPlugins(opts.baseURL, babelEnv);

	// process plugins in babelOptions.plugins
	processed = processed.concat(processPlugins(babelOptions.plugins || []));

	// process environment dependant plugins
	_.keys(babelEnvConfig).forEach(function(envName) {
		var plugins = babelEnvConfig[envName].plugins || [];
		processed = processed.concat(processPlugins(plugins, envName));
	});

	return processed;
};

/**
 * Returns a function to process plugins based on an evironment value
 * @param {string} baseURL The loader base url used when relative plugin paths are provided
 * @param {string} babelEnv The babel environment name
 * @return {Function}
 */
function makeProcessPlugins(baseURL, babelEnv) {
	// path.resolve does not work correctly if baseURL starts with "file:"
	baseURL = baseURL.replace("file:", "");

	/**
	 * Collect plugins matching the environment name and loads non-builtins
	 * @param {BabelPlugin[]} plugins An array of babel plugins
	 * @param {?string} The environment name in which the plugins were found
	 * @return {BabelPlugin[]} An array of babel plugins filtered by the babel
	 *                         environment name and with non-builtins replaced
	 *                         by their respective functions
	 */
	return function(plugins, pluginsEnv) {
		var normalized = [];

		plugins.forEach(function(plugin) {
			var name = getPluginName(plugin);
			var canUsePlugin = pluginsEnv == null || pluginsEnv === babelEnv;

			// skip rest of the logic if the babel env does not match the env
			// in which the plugin is supposed to be used
			if (!canUsePlugin) return;

			if (isPluginFunction(plugin) || isBuiltinPlugin(name)) {
				normalized.push(plugin);
			}
			else if (!isBuiltinPlugin(name)) {
				var npmPluginNameOrPath = getNpmPluginNameOrPath(baseURL, name);

				// load the plugin!
				var pluginFn = require(npmPluginNameOrPath);

				if (_.isString(plugin)) {
					normalized.push(pluginFn);
				}
				else if (_.isArray(plugin)) {
					// [ pluginName, pluginOptions ]
					normalized.push([pluginFn, plugin[1]]);
				}
			}
		});

		return normalized;
	};
}

/**
 * Whether the plugin function was provided instead of the plugin name
 * @param {BabelPlugin} plugin
 * @return {boolean} `true` if a plugin function was provided, `false` otherwise
 */
function isPluginFunction(plugin) {
	return _.isFunction(plugin) || _.isFunction(_.head(plugin));
}

function getNpmPluginNameOrPath(baseURL, name) {
	var isPath = /\//;
	var isNpmPluginName = /^(?:babel-plugin-)/;

	if (isPath.test(name)) {
		return path.resolve(baseURL, name);
	}
	else if (!isNpmPluginName.test(name)) {
		return "babel-plugin-" + name;
	}

	return name;
}

/**
 * Gets the plugin name
 * @param {BabelPlugin} plugin An item inside of `babelOptions.plugins`
 * @return {?string} The plugin name
 */
function getPluginName(plugin) {
	if (isPluginFunction(plugin)) return null;

	return _.isString(plugin) ? plugin : _.head(plugin);
}

/**
 * Whether the plugin is built in babel-standalone
 *
 * @param {string} name A plugin path or shorthand name.
 * @return {boolean} `true` if plugin is bundled, `false` otherwise
 *
 * Babel plugins can be set using the following variations:
 *
 * 1) the npm plugin name, which by convention starts with `babel-plugin-`
 *    (e.g babel-plugin-transform-decorators).
 * 2) A shorthand name, which is the npm name without the `babel-plugin-` prefix
 * 3) A path to where the plugin function is defined
 *
 * babel-standalone registers the plugins bundled with it using the shorthand
 * version.
 */
function isBuiltinPlugin(name) {
	var isNpmPluginName = /^(?:babel-plugin-)/;
	var availablePlugins = babel.availablePlugins;

	// if the full npm plugin name was set in `babelOptions.plugins`, use the
	// shorthand to check whether the plugin is included in babel-standalone;
	// shorthand plugin names are used internally by babel-standalone
	var shorthand = isNpmPluginName.test(name) ?
		name.replace("babel-plugin-", "") :
		name;

	return !!availablePlugins[shorthand] || !!availablePlugins[name];
}
