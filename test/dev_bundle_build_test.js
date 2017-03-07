var _ = require("lodash");
var path = require("path");
var fs = require("fs-extra");
var assert = require("assert");
var denodeify = require("pdenodeify");
var testHelpers = require("./helpers");
var devBundleBuild = require("../lib/build/bundle");

var open = testHelpers.popen;
var readFile = denodeify(fs.readFile);
var rmdir = denodeify(require("rimraf"));

describe("dev bundle build", function() {
	this.timeout(5000);

	var baseOptions =  {
		quiet: true,
		minify: false
	};

	it("should work with defaults", function() {
		var config = {
			config: path.join(__dirname, "npm", "package.json!npm")
		};

		var devBundlePath = path.join(__dirname, "npm", "dev-bundle.js");

		return devBundleBuild(config, baseOptions)
			.then(function() {
				var exists = fs.existsSync(devBundlePath);
				assert(exists, "dev bundle should be created");
			})
			.then(function() {
				return open(path.join(__dirname, "npm"), "dev-bundle-main.html");
			})
			.then(function(params) {
				var close = params.close;
				var browser = params.browser;
				var h1s = browser.window.document.getElementsByTagName('h1');
				assert.equal(h1s.length, 1, "Wrote H!.");
				close();
			})
			.then(function() {
				return rmdir(devBundlePath);
			});
	});

	it("allows filtering modules through a glob pattern", function() {
		var config = {
			main: "bundle",
			config: path.join(__dirname, "bundle", "stealconfig.js"),
		};

		var options = _.assign({}, baseOptions, {
			filter: "**/*"
		});

		var bundlePath = path.join(__dirname, "bundle", "dev-bundle.js");

		return devBundleBuild(config, options)
			.then(function() {
				var exists = fs.existsSync(bundlePath);
				assert(exists, "should create dev bundle");
			})
			.then(function() {
				return rmdir(bundlePath);
			});
	});

	it("allows filtering modules through multiple glob patterns", function() {
		var config = {
			main: "app_a",
			config: path.join(__dirname, "bundle", "stealconfig.js"),
		};

		var options = _.assign({}, baseOptions, {
			filter: [
				"**/*.js",
				"!dep_a_b.js",
				"!dep_all.js"
			]
		});

		var bundlePath = path.join(__dirname, "bundle", "dev-bundle.js");

		return devBundleBuild(config, options)
			.then(function(buildResult) {
				var graph = buildResult.graph;

				assert(_.isUndefined(graph['dep_a_b']), "should not be in the graph");
				assert(_.isUndefined(graph['dep_all']), "should not be in the graph");
			})
			.then(function() {
				return rmdir(bundlePath);
			});
	});

	it("allows setting the bundle destination", function() {
		var config = {
			main: "bundle",
			config: path.join(__dirname, "bundle", "stealconfig.js"),
		};

		var options = _.assign({}, baseOptions, {
			filter: "**/*",
			dest: "folder/"
		});

		var bundlePath = path.join(__dirname, "bundle", "folder", "dev-bundle.js");

		return devBundleBuild(config, options)
			.then(function() {
				var exists = fs.existsSync(bundlePath);
				assert(exists, "should create dev bundle");
			})
			.then(function() {
				return rmdir(bundlePath);
			});
	});

	it("includes plugins in the build", function() {
		var config = {
			main: "main",
			config: path.join(__dirname, "plugins", "config.js")
		};

		var options = _.assign({}, baseOptions, {
			filter: "**/*"
		});

		var bundlePath = path.join(__dirname, "plugins", "dev-bundle.js");

		return devBundleBuild(config, options)
			.then(function() {
				return readFile(bundlePath);
			})
			.then(function(contents) {
				var empty = "define('plug', [], function(){ return {}; });";
				var regexp = new RegExp(_.escapeRegExp(empty));

				assert(!regexp.test(contents), "plugin code should be included");
			})
			.then(function() {
				return rmdir(bundlePath);
			});
	});

	it("adds node to preload npm packages to deps bundles", function() {
		var config = {
			config: path.join(__dirname, "npm", "package.json!npm")
		};

		var options = _.assign({}, baseOptions, {
			filter: "node_modules/**/*" // only bundle npm deps
		});

		var devBundlePath = path.join(__dirname, "npm", "dev-bundle.js");

		return devBundleBuild(config, options)
			.then(function() {
				var exists = fs.existsSync(devBundlePath);
				assert(exists, "dev bundle should be created");
			})
			.then(function() {
				return readFile(devBundlePath);
			})
			.then(function(contents) {
				var nodeName = "[steal-add-npm-packages]";
				var regexp = new RegExp(_.escapeRegExp(nodeName));

				assert(regexp.test(contents), "bundle should include npm node");
			})
			.then(function() {
				return rmdir(devBundlePath);
			});
	});

	it("DOES NOT add npm node to bundles including @config", function() {
		var config = {
			config: path.join(__dirname, "npm", "package.json!npm")
		};

		var options = _.assign({}, baseOptions, {
			filter: [ "node_modules/**/*", "package.json" ]
		});

		var devBundlePath = path.join(__dirname, "npm", "dev-bundle.js");

		return devBundleBuild(config, options)
			.then(function() {
				var exists = fs.existsSync(devBundlePath);
				assert(exists, "dev bundle should be created");
			})
			.then(function() {
				return readFile(devBundlePath);
			})
			.then(function(contents) {
				var nodeName = "[steal-add-npm-packages]";
				var regexp = new RegExp(_.escapeRegExp(nodeName));

				assert(!regexp.test(contents), "bundle should include npm node");
			})
			.then(function() {
				return rmdir(devBundlePath);
			});
	});
});

