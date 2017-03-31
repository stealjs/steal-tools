var path = require("path");
var fs = require("fs-extra");
var rimraf = require("rimraf");
var assert = require("assert");
var denodeify = require("pdenodeify");
var testHelpers = require("./helpers");
var multiBuild = require("../lib/build/multi");

describe("build app using babel presets", function() {
	var find = testHelpers.find;
	var open = testHelpers.open;
	var rmdir = denodeify(rimraf);

	before(function() {
		copyDependencies();
	});

	it("npm presets work with default babel environment", function(done) {
		var base = path.join(__dirname, "babel_npm_presets");

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
				var page = path.join("test", "babel_npm_presets", "prod.html");

				open(page, function(browser, close) {
					find(browser, "foo", function(foo) {
						assert.equal(foo, "default", "babel npm preset should work");
						done();
					}, close);
				}, done);
			});
	});

	it("npm presets work with others babel environments too", function(done) {
		process.env.BABEL_ENV = "test";
		var base = path.join(__dirname, "babel_env_presets");

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
				var page = path.join("test", "babel_env_presets", "prod.html");

				open(page, function(browser, close) {
					find(browser, "foo", function(foo) {
						assert.equal(foo, "default", "babel env presets should work");
						delete process.env.BABEL_ENV;
						done();
					}, close);
				}, done);
			});
	});

	it("local presets work with default babel environment", function(done) {
		var base = path.join(__dirname, "babel_local_presets");

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
				var page = path.join("test", "babel_local_presets", "prod.html");

				open(page, function(browser, close) {
					find(browser, "foo", function(foo) {
						assert.equal(foo, "bar", "local babel preset should work");
						done();
					}, close);
				}, done);
			});
	});
});

function copyDependencies() {
	var testFolders = [
		"babel_npm_presets",
		"babel_env_presets"
	];

	var deps = [
		"babel-preset-steal-test",
		"babel-plugin-steal-test"
	];

	var root = path.join(__dirname, "..", "node_modules");

	testFolders.forEach(function(folder) {
		deps.forEach(function(dep) {
			fs.copySync(
				path.join(root, dep),
				path.join(__dirname, folder, "node_modules", dep)
			);
		});
	});
}

