var path = require("path"),
	assert = require("assert"),
	bundle = require("../lib/graph/make_graph_with_bundles"),
	findbundle = require("../lib/loader/find_bundle");
	logging = require("../lib/logger"),
	comparify = require("comparify");

describe("find bundle", function () {
	var fakeLoader = {
		baseURL: path.join(__dirname, "bundle")
		// baseURL: "file:/Users/julian/PhpstormProjects/steal-tools/test"
	};

	it("with given string", function () {
		// fakeLoader.bundle = [
		// 	"**/*",
		// 	"app_?"
		// ];

		fakeLoader.bundle = "app_a";

		var bundles = findbundle(fakeLoader);
		assert.deepEqual(["app_a"], bundles)
	});

	it("with given string and file extension", function () {
		fakeLoader.bundle = "app_a.js";

		var bundles = findbundle(fakeLoader);
		assert.deepEqual(["app_a"], bundles)
	});

	it("with pattern string", function () {
		fakeLoader["bundle"] = "app_?";

		var bundles = findbundle(fakeLoader);
		assert.deepEqual(["app_a", "app_b", "app_c", "app_d"], bundles);
	});

	it("with pattern and filename included", function () {
		fakeLoader["bundle"] = "+(app_a.js|bundle.js)";

		var bundles = findbundle(fakeLoader);
		// assert.deepEqual(["app_a", "bundle"], bundles);
	});

	it("with glob", function () {
		fakeLoader["baseURL"] = path.join(__dirname, "basics");
		fakeLoader["bundle"] = "*";

		var bundles = findbundle(fakeLoader);
		assert.deepEqual(['amdmodule', 'basics', 'es6module', 'pathed'], bundles);
	});

	it("with globstar", function () {
		fakeLoader["baseURL"] = path.join(__dirname, "basics");
		fakeLoader["bundle"] = "**/*";

		var bundles = findbundle(fakeLoader);
		assert.deepEqual(['amdmodule', 'basics', 'es6module', 'module/module', 'pathed'], bundles);
	});

	it("with array of filenames", function () {
		fakeLoader["baseURL"] = path.join(__dirname, "bundle");
		fakeLoader["bundle"] = [
			"app_a",
			"app_b",
			"src/not/found"
		];
		var bundles = findbundle(fakeLoader);
		assert.deepEqual(['app_a', 'app_b'], bundles);
	});

	it("with array of globs and pattern", function () {
		fakeLoader["baseURL"] = path.join(__dirname, "bundle");
		fakeLoader["bundle"] = [
			"src-glob-test/bar/**/*",
			"src-glob-test/foo/**/*"
		];
		var bundles = findbundle(fakeLoader);
		assert.deepEqual([
			'src-glob-test/bar/app_c',
			'src-glob-test/bar/app_d',
			'src-glob-test/foo/app_a',
			'src-glob-test/foo/app_b'
		], bundles);
	});

});

describe("find npm bundle", function () {
	it("with array and appname or tidle", function (done) {

		bundle({
			config: __dirname+"/npm-bundle/package.json!npm",
			main: "npm-test/main",
			logLevel: 3,
			bundle: [
				"~/site/site3",
				"npm-test/site/site4"
			]
		}).then(function(data){
			var modules = Object.keys(data.graph);
			assert.ok(~modules.indexOf("npm-test@0.0.1#site/site3"));
			assert.ok(~modules.indexOf("npm-test@0.0.1#site/site4"));
			done();

		}).catch(function(e){
			done(e)
		});
	});

	it("with array and full modulename", function (done) {

		bundle({
			config: __dirname+"/npm-bundle/package.json!npm",
			main: "npm-test/main",
			logLevel: 3,
			bundle: [
				"npm-test@0.0.1#site/site3"
			]
		}).then(function(data){
			var modules = Object.keys(data.graph);
			assert.ok(~modules.indexOf("npm-test@0.0.1#site/site3"));
			done();

		}).catch(function(e){
			done(e)
		});
	});
});

describe("bundle", function(){
	beforeEach(function(){
		logging.setup({ quiet: true });
	});

	it("should work", function(done){

		bundle({
			config: __dirname+"/bundle/stealconfig.js",
			main: "bundle",
			logLevel: 3
		}).then(function(data){
			var graphCompare = require('./bundle/bundle_graph');
			comparify(data.graph, graphCompare, true);
			done();

		}).catch(function(e){
			done(e)
		});
	});

	it("works with globs", function(done){
		bundle({
			config: __dirname+"/bundle/stealconfig.js",
			main: "bundle",
			logLevel: 3,
			bundle: "app_*"
		}).then(function(data){
			var graphCompare = require('./bundle/bundle_graph');
			comparify(data.graph, graphCompare, true);
			done();

		}).catch(function(e){
			done(e)
		});
	});

	it("localSteal run in 'build' platform", function(done){
		var system = {
			config: __dirname + "/live_reload/package.json!npm"
		};
		var options = {
			quiet: true
		};
		bundle(system, options).then(function(data){
			assert.equal('build', data.loader.getPlatform());
			done();
		}).catch(function(e){
			done(e)
		});
	});

});
