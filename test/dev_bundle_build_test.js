var path = require("path");
var fs = require("fs-extra");
var assert = require("assert");
var denodeify = require("pdenodeify");
var testHelpers = require("./helpers");
var devBundleBuild = require("../lib/build/bundle");

var open = testHelpers.popen;
var rmdir = denodeify(require("rimraf"));

describe("dev bundle build", function() {

	// what should I assert here?
	it.skip("app without npm dependencies?", function() {
		return rmdir(path.join(__dirname, "bundle", "dist"))
			.then(function() {
				return devBundleBuild({
					config: path.join(__dirname, "bundle", "stealconfig.js"),
					main: "bundle"
				});
			});
	});

	// what should I assert here?
	it("should work", function() {
		this.timeout(5000);

		var config = {
			config: path.join(__dirname, "npm", "package.json!npm"),
			main: "src/main"
		};

		var options = {
			minify: false
		};

		var devBundlePath = path.join(__dirname, "npm", "dev-bundle.js");

		return devBundleBuild(config, options)
			.then(function() {
				var exists = fs.existsSync(devBundlePath);
				assert(exists, "dev bundle should be created");
			})
			.then(function() {
				return open(path.join(__dirname, "npm"), "dev-bundle-main.html");
			})
			.then(function({ browser, close }) {
				var h1s = browser.window.document.getElementsByTagName('h1');
				assert.equal(h1s.length, 1, "Wrote H!.");
				close();
			})
			.then(function() {
				return rmdir(devBundlePath);
			});
	});

});

