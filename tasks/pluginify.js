var pluginifier = require("../index").pluginifier;

module.exports = function(grunt){

	grunt.registerMultiTask("stealPluginify", "Create a 'plugin' version of your project which is not dependent on Steal.", function(){
		var done = this.async();
		var options = this.options();
		var dest = this.files[0].dest;

		pluginifier(options.system).then(function(pluginify){

			// pluginify is a function that is called to return the content string.
			var content = pluginify(null, {
				ignore: options.ignore || []
			});

			// Write the file
			grunt.file.write(dest, content);

			done();
		});
	});

};
