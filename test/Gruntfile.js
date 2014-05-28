
module.exports = function(grunt){

	grunt.initConfig({
		stealBuild: {
			all: {
				options: {
					config: __dirname + "/bundle/stealconfig.js",
					main: "bundle"
				}
			}
		},

		stealPluginify: {
			all: {
				options: {
					system: {
						config: __dirname + "/stealconfig.js",
						main: "basics/basics"
					},
					ignore: []
				},
				files: [{
					dest: __dirname + "/pbasics.js"
				}]
			}
		}
	});

	grunt.loadTasks("../tasks");

	grunt.registerTask("build", ["stealBuild"]);
	grunt.registerTask("pluginify", ["stealPluginify"]);

};
