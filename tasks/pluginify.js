var pluginifierBuilder = require("../lib/build/pluginifier_builder");

module.exports = function(grunt){

	grunt.registerMultiTask("stealPluginify", "Create a 'plugin' version of your project which is not dependent on Steal.", function(){
		var done = this.async();
		var options = this.options();

		pluginifierBuilder(options, grunt.config('meta.modules'), grunt.config('meta.defaults'), done);
	});

};
