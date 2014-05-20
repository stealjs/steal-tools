var fs = require("fs");
var path = require("path");
var builder = require("../lib/build/builder");
var pluginify = require("../index").pluginify;

module.exports = function (grunt) {
	var _ = grunt.util._;

	/**
	 * Save out configurations to their final resting place
	 */
	function saveConfigurations(options, file, configurations, callback) {
		var keys = Object.keys(configurations);
		var dest = file.dest;

		keys.forEach(function(name){
			var configuration = configurations[name];
			var library = configuration.library;

			if(configuration.hidden) {
				return;
			}

			// The destination for this file
			var filename = path.join(dest, (options.prefix || "") +
															 name.toLowerCase() + ".js");

			console.log("Saving...", filename);

			// Get the content for this one.
			var pluginify = configuration.pluginify;
			/*var content = pluginify(null, {
				ignore: library ? [ library ] : []											 
			});*/
		 	var content = pluginify();

			grunt.file.write(filename, content);
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
			saveConfigurations(options, file, configurations, function(){

				// TODO Save out the plugin files

			});

			done();
		});

	});

};
