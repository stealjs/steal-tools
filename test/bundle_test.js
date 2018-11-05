var assert = require("assert"),
	path = require("path"),
	bundle = require("../lib/graph/make_graph_with_bundles"),
	findbundle = require("../lib/loader/find_bundle"),
	logging = require("../lib/logger"),
	comparify = require("comparify");

describe("find bundle", function () {
	var fakeLoader = {
		baseURL: path.join(__dirname, "bundle")
	};

	it("with given names", function () {
		fakeLoader["bundle"] = ["app_a", "app_b"];
		var bundles = findbundle(fakeLoader);
		assert.deepEqual(["app_a", "app_b"], bundles);
	});

	it("with a glob string", function () {
		fakeLoader["bundle"] = "app_*";
		var bundles = findbundle(fakeLoader);
		assert.deepEqual([
			'app_a',
			'app_b',
			'app_c',
			'app_d'
		], bundles);
	});

	it("wildcard with extension", function() {
		fakeLoader["bundle"] = ["pages/*.component"];
		var bundles = findbundle(fakeLoader);
		assert.deepEqual([
			'pages/cart.component',
		], bundles);
	});

	it("the steal convention trailing slash", function() {
		fakeLoader["bundle"] = ["pages/**/"];
		var bundles = findbundle(fakeLoader);
		assert.deepEqual([
			'pages/home/home',
		], bundles);
	});

	it("trailing slash and wildcard extension", function() {
		fakeLoader["bundle"] = ["pages/**/", "pages/*.component"];
		var bundles = findbundle(fakeLoader);
		assert.deepEqual([
			'pages/home/home',
			'pages/cart.component'
		], bundles);
	});
});

describe("bundle", function () {
	beforeEach(function () {
		logging.setup({quiet: true});
	});

	it("should work", function (done) {

		bundle({
			config: __dirname + "/bundle/stealconfig.js",
			main: "bundle",
			logLevel: 3
		}).then(function (data) {
			var graphCompare = require('./bundle/bundle_graph');
			comparify(data.graph, graphCompare, true);
			done();

		}).catch(function (e) {
			done(e)
		});
	});

	it("works with globs", function (done) {
		bundle({
			config: __dirname + "/bundle/stealconfig.js",
			main: "bundle",
			logLevel: 3,
			bundle: "app_*"
		}).then(function (data) {
			var graphCompare = require('./bundle/bundle_graph');
			comparify(data.graph, graphCompare, true);
			done();

		}).catch(function (e) {
			done(e)
		});
	});

	it("localSteal run in 'build' platform", function (done) {
		var system = {
			config: __dirname + "/live_reload/package.json!npm"
		};
		var options = {
			quiet: true
		};
		bundle(system, options).then(function (data) {
			assert.equal('build', data.loader.getPlatform());
			done();
		}).catch(function (e) {
			done(e)
		});
	});

	describe("npm", function () {
		it("with bundle array", function (done) {

			bundle({
				config: __dirname + "/npm-bundle/package.json!npm",
				bundle: [
					"npm-bundle/components/component-1/",
					"npm-bundle/components/component-2/"
				]
			}).then(function (data) {
				var modules = Object.keys(data.graph);
				assert.ok(~modules.indexOf("npm-bundle@0.0.1#components/component-1/component-1"));
				assert.ok(~modules.indexOf("npm-bundle@0.0.1#components/component-2/component-2"));
				done();

			}).catch(function (e) {
				done(e)
			});
		});

		it("with globs in bundle array", function (done) {
			bundle({
				config: __dirname + "/npm-bundle/package.json!npm",
				bundle: [
					"npm-bundle/sites/**/*"
				]
			}).then(function (data) {
				var modules = Object.keys(data.graph);
				assert.ok(~modules.indexOf("npm-bundle@0.0.1#sites/site-1"));
				assert.ok(~modules.indexOf("npm-bundle@0.0.1#sites/site-2"));
				done();

			}).catch(function (e) {
				done(e)
			});
		});

		it("with negative glob patterns", function (done) {
			bundle({
				config: __dirname + "/npm-bundle/package.json!npm",
				bundle: [
					"npm-bundle/components/**/*",
					"!npm-bundle/components/**/*-test.js"
				]
			}).then(function (data) {
				var modules = Object.keys(data.graph);
				assert.ok(~modules.indexOf("npm-bundle@0.0.1#components/component-1/component-1"));
				assert.ok(~modules.indexOf("npm-bundle@0.0.1#components/component-2/component-2"));
				assert.ok(~modules.indexOf("npm-bundle@0.0.1#components/component-3/component-3"));
				assert.ok(!~modules.indexOf("npm-bundle@0.0.1#components/component-3/component-3-test"));
				done();

			}).catch(function (e) {
				done(e)
			});
		})
	});

});
