var path = require("path");
var assert = require("assert");
var comparify = require("comparify");
var denodeify = require("pdenodeify");
var rmdir = denodeify(require("rimraf"));
var multiBuild = require("../lib/build/multi");

var testHelpers = require("./helpers");
var open = testHelpers.popen;
var find = testHelpers.pfind;

/**
 * Pipes promises in a waterfall pattern
 * @param {Array.<string>} main An array of main module identifiers
 * @param {Function} cb A function to be called for each main
 * @return {Promise} A promise that resolves when all mains are processed
 */
function waterfall(mains, cb) {
	return mains.reduce(
		function(promise, main) {
			return promise.then(function() {
				return cb(main);
			});
		},
		Promise.resolve()
	);
}

describe("multi main builds", function() {
	this.timeout(5000);

	it("should work", function(done) {
		var mains = ["app_a", "app_b", "app_c", "app_d"];
		var ab = { name: "a_b" };
		var cd = { name: "c_d" };
		var all = {name: "all"};
		var results = {
			app_a: {
				name: "a", ab: ab, all: all
			},
			app_b: {
				name: "b", ab: ab, all: all
			},
			app_c:{
				name: "b", cd: cd, all: all
			},
			app_d:{
				name: "d", cd: cd, all: all
			}
		};

		rmdir(path.join(__dirname, "multi-main", "dist"))
			.then(function() {
				return multiBuild({
					config: path.join(__dirname, "multi-main", "config.js"),
					main: mains.slice()
				}, {
					quiet: true,
					minify: false
				});
			})
			.then(function() {
				var checkMain = function(main) {
					var close;
					var page = main + ".html";

					return open(path.join("test", "multi-main", page))
						.then(function(args) {
							close = args.close;

							return find(args.browser, "app");
						})
						.then(function(app) {
							assert(!!app, "got app");
							comparify(results[main], app);
							close();
						});
				};

				return waterfall(mains, checkMain);
			})
			.then(done, done);
	});

	it("works with npm plugin", function(done) {
		var mains = ["app_a", "app_b", "app_c", "app_d"];
		var ab = { name: "a_b" };
		var cd = { name: "c_d" };
		var all = { name: "all" };
		var results = {
			app_a: {
				name: "a", ab: ab, all: all
			},
			app_b: {
				name: "b", ab: ab, all: all
			},
			app_c:{
				name: "b", cd: cd, all: all
			},
			app_d:{
				name: "d", cd: cd, all: all
			}
		};

		rmdir(path.join(__dirname, "multi-main", "dist"))
			.then(function() {
				return multiBuild({
					config: path.join(__dirname, "multi-main", "package.json!npm"),
					main: mains.slice()
				}, {
					quiet: true,
					minify: false
				});
			})
			.then(function() {
				var checkMain = function(main) {
					var close;
					var page = "npm_" + main + ".html";

					return open(path.join("test", "multi-main", page))
						.then(function(args) {
							close = args.close;
							return find(args.browser, "app");
						})
						.then(function(app) {
							assert(!!app, "got app");
							comparify(results[main], app);
							close();
						});
				};

				return waterfall(mains, checkMain);
			})
			.then(done, done);
	});

	it("works with steal bundled", function(done) {
		var mains = ["app_a", "app_b", "app_c", "app_d"];
		var ab = { name: "a_b" };
		var cd = { name: "c_d" };
		var all = { name: "all"};
		var results = {
			app_a: {
				name: "a", ab: ab, all: all
			},
			app_b: {
				name: "b", ab: ab, all: all
			},
			app_c:{
				name: "b", cd: cd, all: all
			},
			app_d:{
				name: "d", cd: cd, all: all
			}
		};

		rmdir(path.join(__dirname, "multi-main", "dist"))
			.then(function() {
				return multiBuild({
					config: path.join(__dirname, "multi-main", "config.js"),
					main: mains.slice(0)
				}, {
					bundleSteal: true,
					quiet: true,
					minify: false
				});
			})
			.then(function() {
				var checkMain = function(main) {
					var close;
					var page = "bundle_" + main + ".html";

					return open(path.join("test", "multi-main", page))
						.then(function(args) {
							close = args.close;

							return find(args.browser, "app");
						})
						.then(function(app) {
							assert(!!app, "got app");
							comparify(results[main], app);
							close();
						});
				};

				return waterfall(mains, checkMain);
			})
			.then(done, done);
	});

	describe("package.json builds", function() {
		var ab = { name: "a_b" };
		var cd = { name: "c_d" };
		var all = { name: "all" };
		var results = {
			app_a: {
				name: "a", ab: ab, all: all
			},
			app_b: {
				name: "b", ab: ab, all: all
			},
			app_c:{
				name: "c", cd: cd, all: all
			},
			app_d:{
				name: "d", cd: cd, all: all
			}
		};

		it("with a multimain (single) package-module", function(done) {
			var close;

			rmdir(path.join(__dirname, "npm-multi-main", "dist"))
				.then(function() {
					return multiBuild({
						main: ["multi-main/app_b"],
						config: path.join(__dirname, "npm-multi-main", "package.json!npm")
					}, {
						quiet: true,
						minify: false
					});
				})
				.then(function() {
					return open(path.join("test", "npm-multi-main", "app_b.html"));
				})
				.then(function(args) {
					close = args.close;
					return find(args.browser, "app");
				})
				.then(function(app) {
					assert(!!app, "app found");
					assert.equal(app.name, "b", "app loaded");
					assert.deepEqual(app, results.app_b, "deps are all loaded");
					close();
				})
				.then(done, done);
		});

		it("with a multimain and progressive loaded module", function(done){
			var close;

			rmdir(path.join(__dirname, "npm-multi-main", "dist"))
				.then(function() {
					return multiBuild({
						config: path.join(__dirname, "npm-multi-main", "package.json!npm"),
						main: ["multi-main/app_a"],
						bundle: ["multi-main/app_c"]
					}, {
						quiet: true,
						minify: false,
					});
				})
				.then(function() {
					return open(path.join("test", "npm-multi-main", "app_c.html"));
				})
				.then(function(args) {
					close = args.close;
					return find(args.browser, "app");
				})
				.then(function(app) {
					assert(!!app, "app found");
					assert.equal(app.name, "c", "app loaded");
					assert.deepEqual(app, results.app_c, "dependencies are all loaded");
					close();
				})
				.then(done, done);
		});

		it("package.json with multimain package-modules", function(done) {
			rmdir(path.join(__dirname, "npm-multi-main", "dist"))
				.then(function() {
					return multiBuild({
						config: path.join(__dirname, "npm-multi-main", "package.json!npm"),
						main: ["multi-main/app_a", "multi-main/app_b"],
						bundle: ["multi-main/app_c"]
					}, {
						quiet: true,
						minify: false
					});
				})
				.then(function() {
					function checkMain(main) {
						var close;
						var page = main.replace("multi-main/", "") + ".html";

						return open(path.join("test", "npm-multi-main", page))
							.then(function(args) {
								close = args.close;
								return find(args.browser, "app");
							})
							.then(function(app) {
								assert(!!app, "app found");
								assert.equal(app.name, main.substr(-1), "main loaded");
								assert.deepEqual(app, results[main.substr(-5)], "dependencies are all loaded");
								close();
							});
					}

					return checkMain("multi-main/app_a")
						.then(function() {
							return checkMain("multi-main/app_b");
						})
						.then(function() {
							return checkMain("multi-main/app_c");
						});
				})
				.then(done, done);
		});

		it("with multimain package-modules and bundled steal", function(done) {
			rmdir(path.join(__dirname, "npm-multi-main", "dist"))
				.then(function() {
					return multiBuild({
						config: path.join(__dirname, "npm-multi-main", "package.json!npm"),
						main: ["multi-main/app_a", "multi-main/app_b"]
					}, {
						quiet: true,
						minify: false,
						bundleSteal: true
					});
				})
				.then(function() {
					var checkMain = function(main) {
						var close;
						var page = main.replace("multi-main/", "") + "_bundled.html";

						return open(path.join("test", "npm-multi-main", page))
							.then(function(args) {
								close = args.close;
								return find(args.browser, "app");
							})
							.then(function(app) {
								assert(!!app, "app found");
								assert.equal(app.name, main.substr(-1), "main loaded");
								assert.deepEqual(app, results[main.substr(-5)], "dependencies are all loaded");
								close();
							});
					};

					return checkMain("multi-main/app_a")
						.then(function() {
							return checkMain("multi-main/app_b");
						});
				})
				.then(done, done);
		});

		it("with a main that depends on another main", function() {
			var base = path.join(__dirname, "multi-main-dep");

			return rmdir(path.join(base, "dist"))
				.then(function() {
					return multiBuild({
						config: path.join(base, "package.json!npm"),
						main: ["multi-main-dep/main1", "multi-main-dep/main2"]
					}, {
						quiet: true,
						minify: false
					});
				})
				.then(function() {
					assert.ok(true, "build should be successful");
				});
		});
	});

	describe("multi-main with bundled steal", function() {
		it("set main automatically", function(done) {
			var close;
			var browser;

			rmdir(path.join(__dirname, "multi-main-bundled", "dist"))
				.then(function() {
					return multiBuild({
						config: path.join(__dirname, "multi-main-bundled", "package.json!npm"),
						main: [
							"multi-main-bundled/app_a",
							"multi-main-bundled/app_b"
						]
					}, {
						bundleSteal: true,
						quiet: true,
						minify: false
					});
				})
				.then(function() {
					return open(path.join("test", "multi-main-bundled",
						"bundle_app_a.html"));
				})
				.then(function(args) {
					close = args.close;
					browser = args.browser;
					return find(browser, "app");
				})
				.then(function(app) {
					assert(!!app, "got app");
					assert.equal(app.name, "a", "got the module");
					assert.equal(app.ab.name, "a_b", "a got ab");
					assert.equal(app.all.name, "all", "a got all");

					assert.equal(browser.window["System"]["main"],
						"multi-main-bundled@1.0.0#app_a");
					close();
				})
				.then(function() {
					return open(path.join("test", "multi-main-bundled",
						"bundle_app_b.html"));
				})
				.then(function(args) {
					close = args.close;
					browser = args.browser;
					return find(browser, "app");
				})
				.then(function(app) {
					assert(!!app, "got app");
					assert.equal(app.name, "b", "got the module");
					assert.equal(app.ab.name, "a_b", "a got ab");
					assert.equal(app.all.name, "all", "a got all");

					assert.equal(browser.window["System"]["main"],
						"multi-main-bundled@1.0.0#app_b");
					close();
				})
				.then(done, done);
		});
	});
});
