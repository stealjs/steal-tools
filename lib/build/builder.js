var _ = require("lodash");
//var async = require('async');
var path = require('path');
var fs = require('fs');
//var opener = require('./open');
var pluginify = require('./pluginifier');
//var steal = require('../steal');
//var beautify = require('js-beautify');

var utilities = {
	/**
	 * A small deep extend helper.
	 *
	 * @param {Object} destination The object to recursively extend into
	 * @param {Object} source The object to extend from
	 * @returns {Object} The destination object
	 */
	deepExtend: function (destination, source) {
		for (var property in source) {
			if (source[property] && source[property].constructor &&
				source[property].constructor === Object) {
				destination[property] = destination[property] || {};
				utilities.deepExtend(destination[property], source[property]);
			} else {
				destination[property] = source[property];
			}
		}
		return destination;
	},

	/**
	 * @method getPlugins
	 *
	 * Get the plugins from a builder.json file's modules
	 *
	 * @param {Object} modules The modules
	 * @return {Object} Modules that are plugins.
	 */
	getPlugins: function(modules){
		var keys = Object.keys(modules);
		var plugins = {};

		keys.forEach(function(moduleName) {
			var module = modules[moduleName];
			if(module.type === "plugin") {
				plugins[moduleName] = module;
			}
		});

		return plugins;
	},

	/**
	 * Load configurations and generate pluginify functions for each
	 *
	 * @method loadConfigurations
	 * @param {Object} info The info object
	 * @param {Function} callback
	 */
	loadConfigurations: function(info, callback){
		var configurations = info.configurations;
		var keys = _.keys(configurations);
		var modules = _.keys(info.modules);

		function pluginifier() {
			var name = keys.shift();
			if(!name) {
				// We have reached the end, call the callback with the configurations
				return callback(configurations);
			}

			var configuration = configurations[name];
			var stealConfig = configuration.steal || {};
			var system = _.extend({}, info.system, stealConfig);

			pluginify({
				system: system
			}).then(function(pluginify){
				// Attach the pluginify function to the configuration
				configuration.pluginify = pluginify;

				// Recurse, doing the next pluginify function
				pluginifier();
			});
		}

		pluginifier();

	},

	/**
	 * Load plugins and generate pluginify functions for each
	 */
	loadPlugins: function(info, callback){
		var modules = info.modules;
		var plugins = utilities.getPlugins(modules);
		var keys = Object.keys(plugins);

		function pluginifier() {
			var name = keys.shift();
			if(!name) {
				return callback(plugins);
			}

			var module = plugins[name];

			// If this module is hidden, skip it.
			if(module.hidden) {
				return pluginifier();
			}

			var parts = name.split("/");
			var moduleName = name + "/" + parts[parts.length - 1];

			var system = _.extend({}, info.system, {
				main: moduleName
			});

			pluginify({
				system: system
			}).then(function(pluginify){
				module.pluginify = pluginify;

				pluginifier();
			});
		}

		pluginifier();
	},

	/**
	 * @method maybeGetInfo
	 *
	 * Get an options object, either `builder.json` or `package.json` or return
	 * false if it's not found.
	 *
	 * @param {Object} options The options object to get
	 * @param {String} name
	 * @param {String} file The file to load
	 */
	maybeGetInfo: function(options, name, file){
		var info = options[name];
		if(info) return info;

		var filePath = path.join(options.path, "/" + file);
		if(!fs.existsSync(filePath)) {
			return false;
		}

		// It exists, return the json.
		return require(filePath);
	}
}

/**
 * Load the download builder information which will contain:
 *
 * - `package.json`
 * - `builder.json`
 * - All Steal dependencies (and file contents) for every available download builder configuration
 *
 * This will be used throughout most of the download builder.
 * The callback data will be `undefined` if any of the JSON configuration files
 * isn't available.
 *
 * @param {String|Object} options The resource path or a more detailed configuration.
 * @param {Function} callback Callback with the information object
 * @returns {*}
 */
var builder = function (options, callback) {
	var settings = typeof options === 'string' ? { path: options } : options;
	var filePath = settings.path;

	var builder = utilities.maybeGetInfo(settings, "builder", "builder.json");
	var pkg = utilities.maybeGetInfo(settings, "pkg", "package.json");

	if (!builder || !pkg) {
		return callback(null, null);
	}

	var info = _.extend({
		path: filePath,
		configurations: {},
	}, builder, pkg, {
		system: _.extend(options.steal, {
			config: options.config,
			main: options.main
		})
	});

	utilities.loadConfigurations(info, function(configurations){
		console.log("Loaded configurations.");

		utilities.loadPlugins(info, function(plugins){
			console.log("Loaded plugins");

			callback(info);
		});
	});
};

_.extend(builder, utilities);

module.exports = builder;
