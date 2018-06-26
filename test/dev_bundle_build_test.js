var path = require("path");
var fs = require("fs-extra");
var assert = require("assert");
var assign = require("lodash/assign");
var denodeify = require("pdenodeify");
var testHelpers = require("./helpers");
var isUndefined = require("lodash/isUndefined");
var escapeRegExp = require("lodash/escapeRegExp");
var devBundleBuild = require("../lib/build/bundle");

var open = testHelpers.popen;
var find = testHelpers.pfind;
var readFile = denodeify(fs.readFile);
var rmdir = denodeify(require("rimraf"));

describe("dev bundle build", function() {
	this.timeout(10000);

	var baseOptions = {
		quiet: true
	};

	it("should not be minified by default", function() {
		var config = {
			main: "bundle",
			config: path.join(__dirname, "bundle", "stealconfig.js"),
		};

		var bundlePath = path.join(__dirname, "bundle", "dev-bundle.js");

		return devBundleBuild(config, baseOptions)
			.then(function() {
				return readFile(bundlePath);
			})
			.then(function(contents) {
				// comments are removed during minification
				var rx = new RegExp(escapeRegExp("/*[system-bundles-config]*/"));
				var rx2 = new RegExp(escapeRegExp("/*stealconfig.js*/"));

				assert(rx.test(contents), "bundle should not be minified");
				assert(rx2.test(contents), "bundle should not be minified");
			})
			.then(function() {
				return rmdir(bundlePath);
			});
	});

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

		var options = assign({}, baseOptions, {
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

		var options = assign({}, baseOptions, {
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

				assert(isUndefined(graph['dep_a_b']), "should not be in the graph");
				assert(isUndefined(graph['dep_all']), "should not be in the graph");
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

		var options = assign({}, baseOptions, {
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

		var options = assign({}, baseOptions, {
			filter: "**/*"
		});

		var bundlePath = path.join(__dirname, "plugins", "dev-bundle.js");

		return devBundleBuild(config, options)
			.then(function() {
				return readFile(bundlePath);
			})
			.then(function(contents) {
				var empty = "define('plug', [], function(){ return {}; });";
				var regexp = new RegExp(escapeRegExp(empty));

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

		var options = assign({}, baseOptions, {
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
				var regexp = new RegExp(escapeRegExp(nodeName));

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

		var options = assign({}, baseOptions, {
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
				var regexp = new RegExp(escapeRegExp(nodeName));

				assert(!regexp.test(contents), "bundle should include npm node");
			})
			.then(function() {
				return rmdir(devBundlePath);
			});
	});

	it("Does not remove development code", function() {
		var config = {
			config: path.join(__dirname, "dev_bundle_app", "package.json!npm")
		};

		var devBundlePath = path.join(__dirname, "dev_bundle_app", "dev-bundle.js");

		return devBundleBuild(config, baseOptions)
			.then(function() {
				return readFile(devBundlePath);
			})
			.then(function(contents) {
				var nodeName = "it worked";
				var regexp = new RegExp(escapeRegExp(nodeName));

				assert(regexp.test(contents), "bundle should dev code");
			})
			.then(function() {
				return rmdir(devBundlePath);
			});
	});

	it("loads css from custom destination", function() {
		var base = path.join(__dirname, "dev_bundle_css");
		var devBundleDest = path.join(base, "custom_dest");

		var config = {
			main: "main",
			config: path.join(base, "package.json!npm")
		};

		var options = assign({}, baseOptions, {
			filter: "**/*",
			dest: "custom_dest/"
		});

		return rmdir(devBundleDest)
			.then(function() {
				return devBundleBuild(config, options);
			})
			.then(function () {
				return open(base, "dev.html");
			})
			.then(function(p) {
				p.browser.assert.success();
				p.close();
			})
			.then(function() {
				return rmdir(devBundleDest);
			});
	});

	it("works with plugins using metadata.useLocalDeps", function() {
		var pcopy = denodeify(fs.copy);
		var base = path.join(__dirname, "dev_bundle_less");
		var devBundlePath = path.join(base, "custom_dest");

		var config = {
			main: "main",
			config: path.join(base, "package.json!npm")
		};

		var options = assign({}, baseOptions, {
			filter: "node_modules/**/*",
			dest: "custom_dest/"
		});

		function copyDependencies() {
			var src = path.join(__dirname, "..", "node_modules");
			var dest = path.join(base, "node_modules");

			return rmdir(dest)
				.then(function () {
					return pcopy(
						path.join(src, "steal-less"),
						path.join(dest, "steal-less")
					);
				})
				.then(function() {
					return pcopy(
						path.join(src, "steal-css"),
						path.join(dest, "steal-css")
					);
				})
				.then(function () {
					// node v4 nests deps, "less" will be inside steal-less
					if (fs.existsSync(path.join(src, "less"))) {
						return pcopy(
							path.join(src, "less"),
							path.join(dest, "less")
						);
					}
				});
		}

		return copyDependencies()
			.then(function() {
				return rmdir(devBundlePath);
			})
			.then(function() {
				return devBundleBuild(config, options);
			})
			.then(function () {
				return open(base, "dev.html");
			})
			.then(function(p) {
				p.browser.assert.success();
				p.close();
			})
			.then(function() {
				return rmdir(devBundlePath);
			});
	});

	it("minified dev bundles work", function(done) {
		var dir = path.join(__dirname, "dev_bundles_minify");
		var devBundlePath = path.join(dir, "dev-bundle.js");

		var config = {
			config: path.join(dir, "package.json!npm")
		};

		var options = assign({}, baseOptions, {
			minify: true,
			filter: "node_modules/**/*" // only bundle npm deps
		});

		var clean = function(err) {
			rmdir(devBundlePath).then(function() {
				done(err);
			});
		};
		devBundleBuild(config, options)
			.then(function() {
				var exists = fs.existsSync(devBundlePath);
				assert(exists, "dev bundle should be created");
			})
			.then(function() {
				return open("test/dev_bundles_minify/dev.html");
			})
			.then(function(p) {
				p.close();
				p.browser.assert.element("h1");
			})
			.then(clean)
			.catch(clean);
	});

	it("works in a project using the folder/index convention", function(done) {
		var dir = path.join(__dirname, "dev_bundle_forward");
		var devBundlePath = path.join(dir, "dev-bundle.js");

		var config = {
			config: path.join(dir, "package.json!npm")
		};

		var options = assign({}, baseOptions, {
			minify: false,
			filter: ["node_modules/**/*", "package.json"] // only bundle npm deps
		});

		var clean = function(err) {
			rmdir(devBundlePath).then(function() {
				done(err);
			});
		};

		devBundleBuild(config, options)
			.then(function() {
				return open("test/dev_bundle_forward/dev.html");
			})
			.then(function(p) {
				return find(p.browser, "APP");
			})
			.then(function(app){
				assert.equal(app.folder, "works");
			})
			.then(clean)
			.catch(clean);
	});
});
