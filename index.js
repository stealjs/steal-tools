var path = require("path");

var steal = module.exports = require("stealjs");

// Steal everything we are going to export.
steal("build", function(build){

	steal.build = build;

	steal.config({
		moduleRoot: path.resolve(__dirname, "../..")
	});

});
