
module.exports = function(grunt){

	grunt.initConfig({
		stealBuild: {
			all: {
				options: {
					config: __dirname + "/bundle/stealconfig.js",
					main: "bundle"
				}
			}
		}
	});

	grunt.loadTasks("../tasks");

	grunt.registerTask("build", ["stealBuild"]);

};
