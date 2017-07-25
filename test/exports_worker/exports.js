var path = require("path");
var stealExport = require("../../lib/build/export");
var rmdir = require("pdenodeify")(require("rimraf"));

rmdir(path.join(__dirname, "dist"))
	.then(function() {
		return stealExport({
			steal: {
				config: path.join(__dirname, "stealconfig.js")
			},
			options: {
				quiet: true
			},
			"outputs": {
				"basics standalone": {
					minify: false,
					modules: ["main"],
					dest: path.join(__dirname, "dist", "out.js")
				}
			}
		});
	});
