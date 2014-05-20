var fs = require("fs");
var path = require("path");
var builder = require("../lib/build/builder");
var pluginify = require("../index").pluginify;

module.exports = function (grunt) {
	var _ = grunt.util._;

	grunt.registerMultiTask("builder", "Pluginify using the download builder configuration", function () {
		var done = this.async();
		var options = this.options();
		var file = this.files[0];
		options.main = file.src[0].substr(0, file.src[0].length - 3);

		builder(options, function(){
			console.log("All done");
			done();
		});

		// Process all of the modules one at a time
		/*function processModules() {
			var moduleId = keys.shift();
			// We've finished the last module
			if(!moduleId) {
				done();
			}

			var module = modules[moduleId];

			console.log("Building", module.name);

			var src = file.src[0];
			var folderPath = path.resolve(fs.realpathSync(src));

			// Pluginify the module
			pluginify({
				system: {
					config: folderPath + "/stealconfig.js",
					main: "component/component"
				},
				exports: {}
			}).then(function(pluginify){
				var content = pluginify();
				
				var filename = path.resolve(file.dest, module.name.toLowerCase() + ".js");
				//grunt.file.write(filename, content);
				
				processModules();
			});

		}*/

		//processModules(file);
		
	});

};
