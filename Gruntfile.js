
module.exports = function (grunt) {

global.steal = {
	nodeRequire: require,
	root: require("path").resolve(__dirname, "..")
};

	grunt.registerTask("test", function(){
		var done = this.async(),
			flags = Object.keys(this.flags);

		var testFiles = {
			build: [
				"build/test/build_test.js",
				"build/test/api.js",
				"build/test/api2.js",
				"build/test/alt_folder/test.js"
			],
			open: ["build/open/test/open_test.js"],
			js: ["build/js/js_test.js"],
			css: ["build/css/test/css_test.js"],
			apps: ["build/apps/test/apps_test.js"],
			packages: ["build/packages/test/packages_test.js"],
			pluginify: ["build/pluginify/test/pluginify_test.js"],
			install: ["install/test/install_test.js"]
		};

		var allFiles = (function(){
			var items = flags.length ? flags : Object.keys(testFiles);
			var files = [];

			items.forEach(function(i){
				files = files.concat(testFiles[i]);
			});

			return files;
		})();


		var Mocha = require('mocha');
		//Add the interface
		Mocha.interfaces["qunit-mocha-ui"] = require("qunit-mocha-ui");
		//Tell mocha to use the interface.
		var mocha = new Mocha({ui:"qunit-mocha-ui", reporter:"spec"});
		//Add your test files
		allFiles.forEach(mocha.addFile.bind(mocha));
		//Run your tests
		mocha.run(function(failures){
			process.exit(failures);
		});
	});

	grunt.initConfig({});

	grunt.registerTask('default', ['test']);
};
