var path = require("path");
var fs = require("fs-extra");
var rimraf = require("rimraf");
var assert = require("assert");
var denodeify = require("pdenodeify");
var testHelpers = require("./helpers");
var multiBuild = require("../lib/build/multi");

describe("build app using babel plugins", function() {
	var find = testHelpers.find;
	var open = testHelpers.open;
	var rmdir = denodeify(rimraf);

	beforeEach(function() {
		copyDependencies();
	});

	it("npm plugin works with default babel environment", function(done) {
		var base = path.join(__dirname, "babel_npm_plugins");

		rmdir(path.join(base, "dist"))
			.then(function() {
				return multiBuild({
					config: path.join(base, "package.json!npm")
				}, {
					minify: false,
					quiet: true
				});
			})
			.then(function() {
				var page = path.join("test", "babel_npm_plugins", "prod.html");

				open(page, function(browser, close) {
					find(browser, "foo", function(foo) {
						assert.equal(foo, "default", "babel npm plugin should work");
						done();
					}, close);
				}, done);
			});
	});

	it("npm plugin works with others babel environments too", function(done) {
		process.env.BABEL_ENV = "test";
		var base = path.join(__dirname, "babel_env_plugins");

		rmdir(path.join(base, "dist"))
			.then(function() {
				return multiBuild({
					config: path.join(base, "package.json!npm")
				}, {
					minify: false,
					quiet: true
				});
			})
			.then(function() {
				var page = path.join("test", "babel_env_plugins", "prod.html");

				open(page, function(browser, close) {
					find(browser, "foo", function(foo) {
						assert.equal(foo, "default", "babel npm plugin should work");
						delete process.env.BABEL_ENV;
						done();
					}, close);
				}, done);
			});
	});

	it("local babel plugins work", function(done) {
		var base = path.join(__dirname, "babel_local_plugins");

		rmdir(path.join(base, "dist"))
			.then(function() {
				return multiBuild({
					config: path.join(base, "package.json!npm")
				}, {
					minify: false,
					quiet: true
				});
			})
			.then(function() {
				var page = path.join("test", "babel_local_plugins", "prod.html");

				open(page, function(browser, close) {
					find(browser, "foo", function(foo) {
						assert.equal(foo, "bar", "local babel plugin should work");
						done();
					}, close);
				}, done);
			});
	});
});

function copyDependencies() {
	var testFolders = [
		"babel_npm_plugins",
		"babel_env_plugins"
	];

	var pluginName = "babel-plugin-steal-test";

	testFolders.forEach(function(folder) {
		fs.copySync(
			path.join(__dirname, "..", "node_modules", pluginName),
			path.join(__dirname, folder, "node_modules", pluginName)
		);
	});
}
