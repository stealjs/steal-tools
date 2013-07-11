var path = require("path");

var steal = module.exports = require("stealjs");

// Steal everything we are going to export.
steal("build",
	"install",
	function(){

	// Export all of the things that are part of the public API.
	var exporting = [ "build", "install" ];
	for(var idx in exporting) {
		steal[exporting[idx]] = arguments[idx];
	}

	steal.config({
		moduleRoot: path.resolve(__dirname, "../..")
	});

});
