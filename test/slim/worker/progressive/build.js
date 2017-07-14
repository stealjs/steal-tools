var path = require("path");
var rimraf = require("rimraf");
var denodeify = require("pdenodeify");
var optimize = require("../../../../lib/build/slim");

var rmdir = denodeify(rimraf);
var config = { config: path.join(__dirname, "stealconfig.js") };

rmdir(path.join(__dirname, "dist")).then(function() {
	return optimize(config, {
		quiet: true,
		minify: false,
		target: "worker"
	});
});
