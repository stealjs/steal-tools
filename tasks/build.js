var build = require("../index").build;

module.exports = function(grunt){

	grunt.registerMultiTask("stealBuild", "Build a steal project into bundles.", function(){
		var done = this.async();
		var options = this.options();

		// Run the build with the provided options
		build(options).then(function(){
			grunt.log.writeln("Build was successful.");

			done();
		});
		
	});

};
