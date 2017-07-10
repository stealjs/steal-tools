var path = require("path");
var fs = require("fs-extra");
var rmdir = require("rimraf");
var assert = require("assert");
var denodeify = require("pdenodeify");
var testHelpers = require("./helpers");
var fileExists = require("./file_exists");
var multiBuild = require("../lib/build/multi");

describe("build app using steal-conditional", function() {
    this.timeout(30000);

	var find = testHelpers.find;
	var open = testHelpers.open;
	var prmdir = denodeify(rmdir);
	var basePath = path.join(__dirname, "conditionals");

	before(function() {
		return copyDependencies();
	});

	it("simple substitution works", function(done) {
		var bundles = path.join(basePath, "substitution", "dist", "bundles");

		var config = {
			config: path.join(basePath, "substitution", "package.json!npm")
		};

		prmdir(path.join(basePath, "substitution", "dist"))
			.then(function() {
				return multiBuild(config, { minify: false, quiet: true });
			})
			.then(function() {
				// creates bundles for each possible string substitution
				return fileExists(path.join(bundles, "message", "en.js"));
			})
			.then(function() {
				// creates bundles for each possible string substitution
				return fileExists(path.join(bundles, "message", "es.js"));
			})
			.then(function() {
				var page = path.join(
					"test", "conditionals", "substitution", "index.html"
				);

				open(page, function(browser, close) {
					find(browser, "translations", function(translations) {
						assert.equal(translations.en, "hello, world!");
						assert.equal(translations.es, "hola, mundo!");
						close();
					}, close);
				}, done);
			})
			.catch(done);
	});

	it("simple boolean conditional works", function(done) {
		this.timeout(20000);
		var bundles = path.join(basePath, "boolean", "dist", "bundles");

		var config = {
			config: path.join(basePath, "boolean", "package.json!npm")
		};

		prmdir(path.join(basePath, "boolean", "dist"))
			.then(function() {
				return multiBuild(config, { minify: false, quiet: true });
			})
			.then(function() {
				// each module that might be conditionally loaded once the
				// built app is run on the browser gets its own module
				return fileExists(path.join(bundles, "foo.js"));
			})
			.then(function() {
				return fileExists(path.join(bundles, "bar.js"));
			})
			.then(function() {
				var page = path.join(
					"test", "conditionals", "boolean", "index.html"
				);

				open(page, function(browser, close) {
					find(browser, "variable", function(variable) {
						assert.equal(variable, "foo");
						close();
					}, close);
				}, done);
			})
			.catch(done);
	});

	it("substitution using `~` lookup scheme works", function(done) {
		var config = {
			config: path.join(basePath, "substitution-tilde", "package.json!npm")
		};

		var bundles = path.join(
			basePath, "substitution-tilde", "dist", "bundles", "conditionals"
		);

		prmdir(path.join(basePath, "substitution-tilde", "dist"))
			.then(function() {
				return multiBuild(config, { minify: false, quiet: true });
			})
			.then(function() {
				// should create bundle for `en` variation
				return fileExists(path.join(bundles, "message", "en.js"));
			})
			.then(function() {
				// should create bundle for `es` variation
				return fileExists(path.join(bundles, "message", "es.js"));
			})
			.then(function() {
				var page = path.join(
					"test", "conditionals", "substitution-tilde", "index.html"
				);

				open(page, function(browser, close) {
					find(browser, "translations", function(translations) {
						assert.equal(translations.es, "hola, mundo!");
						assert.ok(!translations.en,
							"only the `es` translation should be loaded");
						close();
					}, close);
				}, done);
			})
			.catch(done);
	});

	it("substitution and steal plugins (less, stache, etc...)", function() {
		var base = path.join(basePath, "substitution-ext");
		var bundle = path.join(base, "dist", "bundles", "conditionals");

		return prmdir(path.join(base, "dist"))
			.then(function() {
				return multiBuild({
					config: path.join(base, "package.json!npm")
				}, {
					quiet: true,
					minify: false
				});
			})
			.then(function() {
				// make sure each variation is detected
				return fileExists(path.join(bundle, "blue.css"));
			})
			.then(function() {
				// make sure each variation is detected
				return fileExists(path.join(bundle, "red.css"));
			});
	});

	it("substitution and subfolders", function() {
		var base = path.join(basePath, "substitution-folders");
		var bundle = path.join(base, "dist", "bundles", "conditionals");

		return prmdir(path.join(base, "dist"))
			.then(function() {
				return multiBuild({
					config: path.join(base, "package.json!npm")
				}, {
					quiet: true,
					minify: false
				});
			})
			.then(function() {
				// make sure each variation is detected
				return fileExists(path.join(bundle, "en", "message.js"));
			})
			.then(function() {
				// make sure each variation is detected
				return fileExists(path.join(bundle, "es", "message.js"));
			});
	});

	it("condition module should not be evaluated during build", function() {
		this.timeout(20000);

		var bundles = path.join(basePath, "condition-module", "dist", "bundles");

		var config = {
			config: path.join(basePath, "condition-module", "package.json!npm")
		};

		return prmdir(path.join(basePath, "boolean", "dist"))
			.then(function() {
				return multiBuild(config, { minify: false, quiet: true });
			})
			.then(function() {
				// each module that might be conditionally loaded once the
				// built app is run on the browser gets its own module
				return fileExists(path.join(bundles, "foo.js"));
			});
	});

	function copyDependencies() {
		var copy = denodeify(fs.copy);
		var src = path.join(__dirname, "..", "node_modules");

		var folders = [
			path.join(basePath, "boolean"),
			path.join(basePath, "substitution"),
			path.join(basePath, "substitution-ext"),
			path.join(basePath, "substitution-tilde"),
			path.join(basePath, "substitution-folders"),
			path.join(basePath, "condition-module")
		];

		var promises = folders.map(function(dest) {
			return copy(
				path.join(src, "steal-conditional"),
				path.join(dest, "node_modules", "steal-conditional")
			);
		});

		return Promise.all(promises);
	}
});
