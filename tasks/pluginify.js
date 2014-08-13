var pluginifierBuilder = require("../lib/build/pluginifier_builder");

module.exports = function(grunt){

	grunt.registerMultiTask("stealPluginify", "Create a 'plugin' version of your project which is not dependent on Steal.", function(){
		var done = this.async();
		var options = this.data;
		["system","outputs"].forEach(function(name){
			if(!options[name]) {
				grunt.fail.warn("stealPluginify needs a "+name+" property.");
			}
		});
		pluginifierBuilder(options, grunt.config('meta.modules'), grunt.config('meta.defaults'), done);
	});

};
