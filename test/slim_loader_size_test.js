var path = require("path");
var denodeify = require("pdenodeify");
var optimize = require("../index").optimize;
var checkSizeSnapshot = require("./check_size_snapshot");

var rimraf = require("rimraf");
var rmdir = denodeify(rimraf);

describe("loader size benchmarks", function() {
	it("single bundle", function() {
		var base = path.join(__dirname, "slim", "basics");
		var config = { config: path.join(base, "stealconfig.js") };

		return rmdir(path.join(base, "dist"))
			.then(function() {
				return optimize(config, { quiet: true });
			})
			.then(function() {
				return checkSizeSnapshot(
					path.join(base, "dist", "bundles", "main.js"),
					base
				);
			});
	});

	it("progressively loaded bundles", function() {
		var base = path.join(__dirname, "slim", "progressive");
		var config = { config: path.join(base, "stealconfig.js") };

		return rmdir(path.join(base, "dist"))
			.then(function() {
				return optimize(config, { quiet: true });
			})
			.then(function() {
				return Promise.all([
					checkSizeSnapshot(
						path.join(base, "dist", "bundles", "main.js"),
						base
					),
					checkSizeSnapshot(
						path.join(base, "dist", "bundles", "baz.js"),
						base
					)
				]);
			});
	});

	it("using plugins", function() {
		var base = path.join(__dirname, "slim", "plugins");
		var config = { config: path.join(base, "package.json!npm") };

		return rmdir(path.join(base, "dist"))
			.then(function() {
				return optimize(config, { quiet: true });
			})
			.then(function() {
				return checkSizeSnapshot(
					path.join(base, "dist", "bundles", "plugins", "main.js"),
					base
				);
			});
	});
});
