var _ = require("lodash");
var path = require("path");
var babel = require("babel-standalone");

/**
 * Returns a map of plugin names and function not bundled in babel-standalone
 *
 * @param {string} baseURL The loader's baseURL
 * @param {{}} babelOptions The babelOptions object
 * @return {{}} A key/value pair where the key is the plugin name and the value
 *              the plugin function, this is intended to be used by transpile to
 *              use plugins not bundled in babel-standalone
 */
module.exports = function loadCustomBabelPlugins(baseURL, babelOptions) {
	var custom = {};
	var isPath = /\//;
	var plugins = babelOptions.plugins || [];
	var isNpmPluginName = /^(?:babel-plugin-)/;

	// path.resolve does not work correctly if baseURL starts with "file:"
	baseURL = baseURL.replace("file:", "");

	plugins.forEach(function(plugin) {
		var name = getPluginName(plugin);

		// if the full npm plugin name was set in `babelOptions.plugins`, use the
		// shorthand to check whether the plugin is included in babel-standalone;
		// shorthand plugin names are used internally by babel-standalone
		var shorthand = isNpmPluginName.test(name) ?
			name.replace("babel-plugin-", "") :
			name;

		if (!isPluginBundled(shorthand)) {
			var npmPluginNameOrPath = isPath.test(shorthand) ?
				path.resolve(baseURL, shorthand) :
				"babel-plugin-" + shorthand;

			// use the plugin name set in `babelOptions.plugins` as the key to
			// this object becasue this is the name to be used when registering
			// the plugins through babel-standalone `registerPlugin` method.
			custom[name] = require(npmPluginNameOrPath);
		}
	});

	return custom;
};

/**
 * Whether the plugin is bundled in babel-standalone
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
function isPluginBundled(name) {
	return !!babel.availablePlugins[name];
}

/**
 * Gets the plugin name
 *
 * Plugins can be defined either by using a string or an array where the first
 * position is the plugin name string and the second an object of options
 *
 * @param {string|array} plugin An item inside of `babelOptions.plugins`
 * @return {string} The plugin name
 */
function getPluginName(plugin) {
	return _.isArray(plugin) ? _.head(plugin) : plugin;
}
