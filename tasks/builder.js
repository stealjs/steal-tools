var fs = require("fs");
var path = require("path");
var builder = require("../lib/build/builder");
var pluginify = require("../index").pluginify;

module.exports = function (grunt) {

	function saveFile(item, filename, ignores, dev) {
		console.log("Saving...", filename);

		// Get the content for this one.
		var moduleName = item.moduleName || null;
		if(moduleName) {
			var parts = moduleName.split("/");
			moduleName += "/" + parts[parts.length - 1];
		}

		var pluginify = item.pluginify;
		var content = pluginify(moduleName, {
			ignore: ignores || [],
			keepDevTags: !!dev
		});

		grunt.file.write(filename, content);
	}

	/**
	 * Save out configurations to their final resting place
	 */
	function saveConfigurations(options, file, configurations) {
		var keys = Object.keys(configurations);
		var dest = file.dest;

		keys.forEach(function(name){
			var configuration = configurations[name];
			var library = configuration.library;
			var libraryModule = "can/" + library;
			libraryModule = libraryModule.substr(0, libraryModule.indexOf(".js"));

			if(configuration.hidden) {
				return;
			}

			// The destination for this file
			var filename = path.join(dest, (options.prefix || "") +
															 name.toLowerCase() + ".js");

			// Save out the default build
			saveFile(configuration, filename, [libraryModule]);

			// Save a dev version if needed
			if(options.dev) {
				filename = path.join(dest, (options.prefix || "") + name.toLowerCase() +
														 ".dev.js");
				saveFile(configuration, filename, [libraryModule], null, true);
			}
		});
	}

	function savePlugins(options, file, plugins, ignores) {
		var main = options.main;
		var keys = Object.keys(plugins);
		var dest = file.dest;

		keys.forEach(function(name){
			var plugin = plugins[name];
			plugin.moduleName = name;

			if(plugin.hidden) {
				return;
			}

			var filename = path.join(dest, plugin.name.toLowerCase() + ".js");
			saveFile(plugin, filename, ignores);
		});
	}


	grunt.registerMultiTask("builder", "Pluginify using the download builder configuration", function () {
		var done = this.async();
		var options = this.options();
		var file = this.files[0];
		options.main = file.src[0].substr(0, file.src[0].length - 3);

		builder(options, function(info){
			var configurations = info.configurations;
			var plugins = builder.getPlugins(info.modules);

			// Save out the configuration files
			saveConfigurations(options, file, configurations);

			// Get the core modules so that we can ignore them.
			var defaultConfiguration = configurations[Object.keys(configurations)[0]];
			var graph = defaultConfiguration.pluginify.graph;
			var ignores = pluginify.getAllIgnores([options.main], graph);

			// Save out the plugin files
			savePlugins(options, file, plugins, ignores);

			done();
		});

	});

};
