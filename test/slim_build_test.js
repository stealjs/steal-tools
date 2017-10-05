var path = require("path");
var assert = require("assert");
var keys = require("lodash/keys");
var denodeify = require("pdenodeify");
var testHelpers = require("./helpers");
var optimize = require("../index").optimize;
var intersection = require("lodash/intersection");
var escapeRegExp = require("lodash/escapeRegExp");

var fs = require("fs-extra");
var rimraf = require("rimraf");
var rmdir = denodeify(rimraf);
var readFile = denodeify(fs.readFile);

describe("slim builds", function() {
	var open = testHelpers.popen;
	var find = testHelpers.pfind;

	// allow `find` to reject before mocha timeout kicks in
	this.timeout(3000);

	it("basics + cjs source", function() {
		var base = path.join(__dirname, "slim", "basics");
		var config = { config: path.join(base, "stealconfig.js") };

		return rmdir(path.join(base, "dist"))
			.then(function() {
				return optimize(config, { quiet: true, minify: false });
			})
			.then(function() {
				return open(path.join("test", "slim", "basics", "index.html"));
			})
			.then(function(args) {
				return Promise.all([args.close, find(args.browser, "foo")]);
			})
			.then(function(data) {
				assert.equal(data[1], "foo");
				data[0]();
			});
	});

	it("filters out configMain from the graph", function() {
		var base = path.join(__dirname, "slim", "basics");
		var config = { config: path.join(base, "stealconfig.js") };

		return rmdir(path.join(base, "dist"))
			.then(function() {
				return optimize(config, { quiet: true, minify: false });
			})
			.then(function() {
				return readFile(path.join(base, "dist", "bundles", "main.js"));
			})
			.then(function(data) {
				var rx = new RegExp(escapeRegExp("stealconfig.js"));
				assert(!rx.test(data.toString()), "configMain should be removed");
			});
	});

	it("minification is on by default", function() {
		var base = path.join(__dirname, "slim", "basics");
		var config = { config: path.join(base, "stealconfig.js") };

		return rmdir(path.join(base, "dist"))
			.then(function() {
				return optimize(config, { quiet: true });
			})
			.then(function() {
				return readFile(path.join(base, "dist", "bundles", "main.js"));
			})
			.then(function(data) {
				var rx = new RegExp(escapeRegExp("/*[slim-loader-config]*/"));

				assert(
					!rx.test(data.toString()),
					"module name comments should be removed"
				);
			})
			.then(function() {
				return open(path.join("test", "slim", "basics", "index.html"));
			})
			.then(function(args) {
				return Promise.all([args.close, find(args.browser, "foo")]);
			})
			.then(function(data) {
				assert.equal(data[1], "foo");
				data[0]();
			});
	});

	it("works with progressively loaded bundles", function() {
		var base = path.join(__dirname, "slim", "progressive");
		var config = { config: path.join(base, "stealconfig.js") };

		return rmdir(path.join(base, "dist"))
			.then(function() {
				return optimize(config, { quiet: true, minify: false });
			})
			.then(function() {
				return Promise.all([
					readFile(path.join(base, "dist", "bundles", "main.js")),
					readFile(path.join(base, "dist", "bundles", "baz.js"))
				]);
			})
			.then(function(bundles) {
				var mainBundle = bundles[0].toString();
				var bazBundle = bundles[1].toString();
				var includesLoaderRegEx = new RegExp(
					escapeRegExp("/*[slim-loader-shim]*/")
				);

				assert.ok(
					includesLoaderRegEx.test(mainBundle),
					"the main bundle should include the loader"
				);
				assert.ok(
					!includesLoaderRegEx.test(bazBundle),
					"other bundles do not include the loader shim"
				);
			})
			.then(function() {
				return open(path.join("test", "slim", "progressive", "index.html"));
			})
			.then(function(args) {
				return Promise.all([args.close, find(args.browser, "baz")]);
			})
			.then(function(data) {
				assert.equal(data[1], "baz", "progressively loaded baz correctly");
				data[0]();
			});
	});

	it("can build apps using npm plugin", function() {
		var options = { quiet: true, minify: false };
		var base = path.join(__dirname, "slim", "npm");
		var config = { config: path.join(base, "package.json!npm") };

		return optimize(config, options);
	});

	it("plugins work", function() {
		var options = { quiet: true, minify: false };
		var base = path.join(__dirname, "slim", "plugins");
		var config = { config: path.join(base, "package.json!npm") };

		return rmdir(path.join(base, "dist"))
			.then(function() {
				return optimize(config, options);
			})
			.then(function() {
				return open(path.join("test", "slim", "plugins", "index.html"));
			})
			.then(function(args) {
				return Promise.all([args.close, find(args.browser, "bundleAddress")]);
			})
			.then(function(result) {
				result[0](); // close
				assert.deepEqual(
					result[1].split(path.sep).join("/"), // normalize windows path
					"dist/bundles/plugins/main.css"
				);
			});
	});

	it("writes bundle manifest when option is passed in", function() {
		var base = path.join(__dirname, "slim", "progressive");
		var config = { config: path.join(base, "stealconfig.js") };
		var options = { quiet: true, bundleManifest: true, minify: false };

		return rmdir(path.join(base, "dist"))
			.then(function() {
				return optimize(config, options);
			})
			.then(function() {
				return readFile(path.join(base, "dist", "bundles.json"));
			})
			.then(function(data) {
				assert.deepEqual(JSON.parse(data.toString()), {
					main: {
						"dist/bundles/main.js": {
							weight: 2,
							type: "script"
						}
					},
					baz: {
						"dist/bundles/main.js": {
							weight: 2,
							type: "script"
						},
						"dist/bundles/baz.js": {
							weight: 2,
							type: "script"
						}
					}
				});

				return rmdir(path.join(base, "dist"));
			});
	});

	it("loader code can be put in its own bundle", function() {
		this.timeout(1000);

		var base = path.join(__dirname, "slim", "progressive");
		var config = { config: path.join(base, "stealconfig.js") };

		return rmdir(path.join(base, "dist"))
			.then(function() {
				return optimize(config, {
					quiet: true,
					minify: false,
					splitLoader: true
				});
			})
			.then(function() {
				return open(path.join("test", "slim", "progressive", "split.html"));
			})
			.then(function(args) {
				return Promise.all([args.close, find(args.browser, "baz")]);
			})
			.then(function(data) {
				assert.equal(data[1], "baz", "progressively loaded baz correctly");
				data[0]();
			});
	});

	it("loader serves module from cache correctly", function() {
		var base = path.join(__dirname, "slim", "cache");
		var config = { config: path.join(base, "stealconfig.js") };

		return rmdir(path.join(base, "dist"))
			.then(function() {
				return optimize(config, { quiet: true, minify: false });
			})
			.then(function() {
				return open(path.join("test", "slim", "cache", "index.html"));
			})
			.then(function(args) {
				return Promise.all([args.close, find(args.browser, "_props")]);
			})
			.then(function(data) {
				assert.deepEqual(
					data[1],
					{
						foo: "foo",
						bar: "bar"
					},
					"module cache works"
				);
				data[0]();
			});
	});

	it("can build globals correctly", function() {
		var base = path.join(__dirname, "slim", "globals");
		var config = { config: path.join(base, "stealconfig.js") };

		return rmdir(path.join(base, "dist"))
			.then(function() {
				return optimize(config, { quiet: true, minify: false });
			})
			.then(function() {
				return open(path.join("test", "slim", "globals", "index.html"));
			})
			.then(function(args) {
				return Promise.all([args.close, find(args.browser, "selector")]);
			})
			.then(function(data) {
				assert.equal(data[1], "#container", "globals work");
				data[0]();
			});
	});

	it("remove nodes flagged from the build", function() {
		var base = path.join(__dirname, "slim", "exclude");
		var config = { config: path.join(base, "stealconfig.js") };

		return rmdir(path.join(base, "dist"))
			.then(function() {
				return optimize(config, { quiet: true, minify: false });
			})
			.then(function() {
				return readFile(path.join(base, "dist", "bundles", "main.js"));
			})
			.then(function(data) {
				assert(
					!/thisShouldNotBeInTheBundle/.test(data.toString()),
					"should remove plugin code from build"
				);
			});
	});

	it("works with async progressively loaded bundles", function() {
		var base = path.join(__dirname, "slim", "async");
		var config = { config: path.join(base, "stealconfig.js") };

		// allow `find` to reject before mocha timeout kicks in
		this.timeout(3000);

		return rmdir(path.join(base, "dist"))
			.then(function() {
				return optimize(config, { quiet: true, minify: false });
			})
			.then(function() {
				return open(path.join("test", "slim", "async", "index.html"));
			})
			.then(function(args) {
				return Promise.all([args.close, find(args.browser, "baz")]);
			})
			.then(function(data) {
				assert.equal(data[1], "baz", "progressively loaded baz correctly");
				data[0]();
			});
	});

	it("*supports circular dependencies", function() {
		var base = path.join(__dirname, "circular");
		var config = { config: path.join(base, "package.json!npm") };

		return rmdir(path.join(base, "dist"))
			.then(function() {
				return optimize(config, { minify: false, quiet: true });
			})
			.then(function() {
				return open(path.join("test", "circular", "slim.html"));
			})
			.then(function(args) {
				return Promise.all([args.close, find(args.browser, "circularWorks")]);
			})
			.then(function(data) {
				assert.ok(data[1], "circularWork should be true");
				data[0](); // close();
			});
	});

	it("ESM named imports work", function() {
		var base = path.join(__dirname, "slim", "esm_named_imports");
		var config = { config: path.join(base, "stealconfig.js") };

		return rmdir(path.join(base, "dist"))
			.then(function() {
				return optimize(config, { minify: false, quiet: true });
			})
			.then(function() {
				return open(
					path.join("test", "slim", "esm_named_imports", "index.html")
				);
			})
			.then(function(args) {
				return Promise.all([args.close, find(args.browser, "result")]);
			})
			.then(function(data) {
				assert.equal(data[1], 2, "should work");
				data[0](); // close();
			});
	});

	it("has partial support for @loader usage", function() {
		var base = path.join(__dirname, "slim", "at_loader");
		var config = { config: path.join(base, "stealconfig.js") };

		return rmdir(path.join(base, "dist"))
			.then(function() {
				return optimize(config, { minify: false, quiet: true });
			})
			.then(function() {
				return open(path.join("test", "slim", "at_loader", "index.html"));
			})
			.then(function(args) {
				return Promise.all([args.close, find(args.browser, "window")]);
			})
			.then(function(data) {
				var w = data[1];
				var close = data[0];
				assert.ok(w.paths == null, "should be filtered out");
				assert.ok(w.stealPath == null, "should be filtered out");
				assert.equal(w.serviceBaseUrl, "/api/production", "should work");
				close();
			});
	});

	it("rejects build promise if unknown target passed in", function(done) {
		var base = path.join(__dirname, "slim", "basics");
		var config = { config: path.join(base, "stealconfig.js") };

		optimize(config, { quiet: true, target: "electron" })
			.then(function() {
				done(new Error("build promise should not resolve"));
			})
			.catch(function(error) {
				assert(/Cannot create slim build/.test(error.message));
				done();
			});
	});

	it("config argument is optional", function(done) {
		// passing options to force the rejection due to unknown target
		optimize(undefined, { quiet: true, target: "electron" })
			.then(
				function() {
					done(new Error("build promise should not resolve"));
				},
				function(error) {
					assert(
						/Cannot create slim build/.test(error.message),
						"Incorrect error message: " + error.message
					);
					done();
			})
			.catch(done);
	});

	it("writes targets in folders matching the target name", function() {
		var base = path.join(__dirname, "slim", "basics");
		var config = { config: path.join(base, "stealconfig.js") };

		return rmdir(path.join(base, "dist"))
			.then(function() {
				return optimize(config, {
					quiet: true,
					minify: false,
					target: "web"
				});
			})
			.then(function() {
				return open(path.join("test", "slim", "basics", "web.html"));
			})
			.then(function(args) {
				return Promise.all([args.close, find(args.browser, "foo")]);
			})
			.then(function(data) {
				assert.equal(data[1], "foo");
				data[0]();
			});
	});

	it("target can be passed as an array", function() {
		var base = path.join(__dirname, "slim", "basics");
		var config = { config: path.join(base, "stealconfig.js") };

		return rmdir(path.join(base, "dist"))
			.then(function() {
				return optimize(config, {
					quiet: true,
					minify: false,
					target: ["web"]
				});
			})
			.then(function() {
				return open(path.join("test", "slim", "basics", "web.html"));
			})
			.then(function(args) {
				return Promise.all([args.close, find(args.browser, "foo")]);
			})
			.then(function(data) {
				assert.equal(data[1], "foo");
				data[0]();
			});
	});

	it("single bundle nodejs build", function() {
		var base = path.join(__dirname, "slim", "node", "single");
		var config = { config: path.join(base, "stealconfig.js") };

		return rmdir(path.join(base, "dist"))
			.then(function() {
				return optimize(config, {
					quiet: true,
					minify: false,
					target: "node"
				});
			})
			.then(function() {
				var main = require(path.join(base, "dist", "bundles", "node", "main"));

				assert.deepEqual(main, { foo: "foo" });
			});
	});

	it("progressively loaded bundles nodejs build", function() {
		var base = path.join(__dirname, "slim", "node", "progressive");
		var config = { config: path.join(base, "stealconfig.js") };

		return rmdir(path.join(base, "dist"))
			.then(function() {
				return optimize(config, {
					quiet: true,
					minify: false,
					target: "node"
				});
			})
			.then(function() {
				var main = require(path.join(base, "dist", "bundles", "node", "main"));
				return main.foo; // dynamic import promise
			})
			.then(function(foo) {
				assert.equal(foo, "foo");
			});
	});

	it("can write multiple targets", function() {
		var base = path.join(__dirname, "slim", "node", "single");
		var config = { config: path.join(base, "stealconfig.js") };

		return rmdir(path.join(base, "dist"))
			.then(function() {
				return optimize(config, {
					quiet: true,
					minify: false,
					target: ["web", "node"]
				});
			})
			.then(function() {
				return Promise.all([
					readFile(path.join(base, "dist", "bundles", "node", "main.js")),
					readFile(path.join(base, "dist", "bundles", "web", "main.js"))
				]);
			})
			.then(function(mains) {
				var rx = new RegExp(escapeRegExp("module.exports = stealRequire"));

				assert(rx.test(mains[0]), "node build should export main");
				assert(!rx.test(mains[1]), "web build should not use module.exports");
			});
	});

	it("buildResult returned from slim build with no target", function() {
		var base = path.join(__dirname, "slim", "basics");
		var config = { config: path.join(base, "stealconfig.js") };

		return rmdir(path.join(base, "dist"))
			.then(function() {
				return optimize(config, { quiet: true, minify: false });
			})
			.then(function(buildResult) {
				assert(
					intersection(keys(buildResult), [
						"bundles",
						"graph",
						"loader",
						"steal"
					]).length > 0
				);
			});
	});

	it("buildResult is labeled with the target name", function() {
		var base = path.join(__dirname, "slim", "basics");
		var config = { config: path.join(base, "stealconfig.js") };

		return rmdir(path.join(base, "dist"))
			.then(function() {
				return optimize(config, {
					quiet: true,
					minify: false,
					target: "web"
				});
			})
			.then(function(targets) {
				assert.deepEqual(keys(targets), ["web"]);
				assert(
					intersection(keys(targets.web), [
						"bundles",
						"graph",
						"loader",
						"steal"
					]).length > 0
				);
			});
	});

	it("has the correct buildType in buildResult", function() {
		var base = path.join(__dirname, "slim", "basics");
		var config = {config: path.join(base, "stealconfig.js")};

		return optimize(config, {quiet: true, minify: false})
			.then(function (buildResult) {
				assert.equal(buildResult.buildType, "optimize");
			});
	});

	it("works with multi main apps", function() {
		var base = path.join(__dirname, "multi-main");
		var mains = ["app_a", "app_b", "app_c", "app_d"];

		var ab = { name: "a_b" };
		var cd = { name: "c_d" };
		var all = { name: "all" };
		var expected = {
			app_a: {
				name: "a", ab: ab, all: all
			},
			app_b: {
				name: "b", ab: ab, all: all
			},
			app_c: {
				name: "c", cd: cd, all: all
			},
			app_d: {
				name: "d", cd: cd, all: all
			}
		};

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

		return rmdir(path.join(base, "dist"))
			.then(function() {
				return optimize({
					config: path.join(__dirname, "multi-main", "config.js"),
					main: mains.slice()
				}, {
					quiet: true,
					minify: false
				});
			})
			.then(function() {
				return waterfall(mains, function(main) {
					var close;
					var page = `slim_${main}.html`;

					return open(path.join("test", "multi-main", page))
						.then(function(args) {
							close = args.close;
							return find(args.browser, "app");
						})
						.then(function(app) {
							assert.deepEqual(
								expected[main],
								app,
								`should get the global exposed by ${main}`
							);
							close();
						});
				});
			});
	});

	it("has partial support for @steal usage", function() {
		var base = path.join(__dirname, "slim", "at_steal");
		var config = { config: path.join(base, "stealconfig.js") };

		return rmdir(path.join(base, "dist"))
			.then(function() {
				return optimize(config, { minify: false, quiet: true });
			})
			.then(function() {
				return open(path.join("test", "slim", "at_steal", "index.html"));
			})
			.then(function(args) {
				return Promise.all([args.close, find(args.browser, "atSteal")]);
			})
			.then(function(data) {
				var close = data[0];
				var atSteal = data[1];

				assert.ok(
					typeof steal.done === "function",
					"should include a .done function"
				);

				assert.equal(
					atSteal.loader.serviceBaseURL,
					"/api/production",
					"should include @loader properties"
				);

				close();
			});
	});

	it("supports 'module' imports in AMD modules", function() {
		var base = path.join(__dirname, "slim", "module");
		var config = { config: path.join(base, "stealconfig.js") };

		return rmdir(path.join(base, "dist"))
			.then(function() {
				return optimize(config, { minify: false, quiet: true });
			})
			.then(function() {
				return open(path.join("test", "slim", "module", "index.html"));
			})
			.then(function(args) {
				return Promise.all([args.close, find(args.browser, "moduleId")]);
			})
			.then(function(data) {
				var close = data[0];
				var moduleId = data[1];

				assert.equal(moduleId, "main", "should set module.id");
				close();
			});
	});

	it("keeps @loader in the graph when using the npm plugin", function() {
		var base = path.join(__dirname, "slim", "at_loader");
		var config = { config: path.join(base, "package.json!npm") };

		return rmdir(path.join(base, "dist"))
			.then(function() {
				return optimize(config, { minify: false, quiet: true });
			})
			.then(function() {
				return open(path.join("test", "slim", "at_loader", "npm.html"));
			})
			.then(function(args) {
				return Promise.all([args.close, find(args.browser, "window")]);
			})
			.then(function(data) {
				var w = data[1];
				var close = data[0];
				assert.equal(w.serviceBaseUrl, "/api/production", "should work");
				close();
			});
	});

	it("supports UMD/AMD that depend on 'exports'", function() {
		var base = path.join(__dirname, "slim", "rollup_umd");
		var config = { config: path.join(base, "stealconfig.js") };

		return rmdir(path.join(base, "dist"))
			.then(function() {
				return optimize(config, { minify: false, quiet: true });
			})
			.then(function() {
				return open(path.join("test", "slim", "rollup_umd", "index.html"));
			})
			.then(function(args) {
				return Promise.all([args.close, find(args.browser, "bar")]);
			})
			.then(function(data) {
				var bar = data[1];
				var close = data[0];
				assert.equal(bar, "bar", "should work");
				close();
			});
	});

	it("supports webpack UMD flagged as global", function() {
		var base = path.join(__dirname, "slim", "webpack_umd");
		var config = { config: path.join(base, "stealconfig.js") };

		return rmdir(path.join(base, "dist"))
			.then(function() {
				return optimize(config, { minify: false, quiet: true });
			})
			.then(function() {
				return open(path.join("test", "slim", "webpack_umd", "index.html"));
			})
			.then(function(args) {
				return Promise.all([args.close, find(args.browser, "window")]);
			})
			.then(function(data) {
				var w = data[1];
				var close = data[0];
				assert.equal(w.dep, "io", "should export the global correctly");
				close();
			});
	});
});
