var fs = require("fs");
var path = require("path");
var pluginify = require("../index").pluginify;

module.exports = function (grunt) {
	var _ = grunt.util._;

	grunt.registerMultiTask("builder", "Pluginify using the download builder configuration", function () {
		var done = this.async();
		var options = this.options();
		var builder = options.builder;
		var modules = builder.modules;

		var pluginifyOptions = options.pluginify;

		this.files.forEach(function(f){
			var src = f.src[0];
			var folderPath = fs.realpathSync(src);
		

			// Build each module
			/*_.each(modules, function(module, name){
				console.log("Module is:", name);

			});*/

			var name = "can/component";
			var module = modules[name];

			pluginify({
				system: {
					config: folderPath + "/stealconfig.js",
					main: "can/component/component"
				},
				exports: {}
			}).then(function(pluginify){
				console.log("Pluginify?", pluginify());

				// Get the resulting string.
				//var result = pluginify();


			});
		});


	});

};
