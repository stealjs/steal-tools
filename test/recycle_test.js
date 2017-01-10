var assert = require("assert");
var bundle = require("../lib/graph/make_graph_with_bundles");
var fs = require("fs-extra");
var logging = require("../lib/logger");
var mockFs = require("mock-fs");
var path = require("path");
var recycle = require("../lib/graph/recycle");
var through = require("through2");
var pluck = require("../lib/graph/pluck");

function urlPathToFSPath(pth) {
	return pth.replace("file:", "")
		.replace(/\//g, path.sep);
}

describe("Recycle", function() {
	beforeEach(function() {
		logging.setup({ quiet: true });
	});

	afterEach(function() {
		mockFs.restore();
	});

	it("clones stream data before piping into other streams", function(done) {
		var failed = false;

		var config = {
			config: __dirname + "/live_reload/package.json!npm",
			logLevel: 3
		};

		var options = {
			localStealConfig: {
				env: "build-development"
			},
			quiet: true
		};

		var mutateStream = function() {
			return through.obj(function(data, enc, next) {
				var dependencyGraph = data.graph;

				if (!dependencyGraph[data.loader.configMain]) {
					failed = true;
					done(new Error("config should not be removed from the graph"));
				}

				pluck(dependencyGraph, data.loader.configMain || "@config");
				next(null, data);
			});
		};

		var depStream = bundle.createBundleGraphStream(config, { quiet: true });
		var recycleStream = recycle(config, options);

		depStream
			.pipe(recycleStream)
			.pipe(mutateStream());

		recycleStream.once("data", function(data) {
			var mockConfig = {};
			var graph = data.graph;
			var node = graph["live-app@1.0.0#foo"];

			Object.keys(graph).forEach(function(moduleName){
				var load = graph[moduleName].load;
				mockConfig[load.address.replace("file:", "")] = load.source;
			});

			mockConfig[node.load.address.replace("file:", "")] =
				"module.exports = 'foo';";
			mockFs(mockConfig);

			recycleStream.write(node.load.name);
			recycleStream.once("data", function(data) {
				var graph = data.graph;
				var node = graph["live-app@1.0.0#foo"];

				recycleStream.write(node.load.name);
				recycleStream.once("data", function() {
					if (!failed) done();
				});
			});
		});
	});

	it("Works with a project using live-reload", function(done){
		var config = {
			config: __dirname + "/live_reload/package.json!npm",
			logLevel: 3
		};
		var options = {
			localStealConfig: {
				env: "build-development"
			},
			quiet: true
		};

		var depStream = bundle.createBundleGraphStream(config, options);
		var recycleStream = recycle(config, options);

		depStream.pipe(recycleStream);

		// Wait for it to initially finish loading.
		recycleStream.once("data", function(data){
			var node = data.graph["live-app@1.0.0#foo"];
			var mockOptions = {};
			// Fake string as the source.
			mockOptions[node.load.address.replace("file:", "")] = "module.exports = 'foo'";
			mockFs(mockOptions);

			recycleStream.once("data", function(data){
				var node = data.graph["live-app@1.0.0#main"];

				assert(/foo/.test(node.load.source), "Source changed");
				done();
			});

			recycleStream.write(node.load.name);
		});
	});

	it("Detects dynamic imports added when no static dependencies have changed", function(done) {
		var config = {
			config: path.join(__dirname, "/recycle_dynamic/config.js"),
			main: "something.txt!plug",
			logLevel: 3,
			map: { "@dev": "@empty" }
		};

		var depStream = bundle.createBundleGraphStream(config, { quiet: true });
		var recycleStream = recycle(config);

		depStream.pipe(recycleStream);

		// Wait for it to initially finish loading.
		recycleStream.once("data", function(data){
			var node = data.graph["something.txt!plug"];

			// Update the module so that it has a dynamic import. This should
			// be added to the loader's bundle and the graph reloaded.
			var mockConfig = {};
			Object.keys(data.graph).forEach(function(moduleName){
				var load = data.graph[moduleName].load;
				mockConfig[load.address.replace("file:", "")] = load.source;
			});
			mockConfig[node.load.address.replace("file:", "")] =
				'System.import("another");';
			mockConfig[path.resolve(__dirname + "/recycle_dynamic/another.js")] =
				'var dep = require("./dep");';
			mockConfig[path.resolve(__dirname + "/recycle_dynamic/dep.js")] =
				'module.exports = "dep";';
			mockFs(mockConfig);

			recycleStream.write(node.load.name);
			recycleStream.once("data", function(data) {
				try {
					var graph = data.graph;
					assert(graph["another"], "'another' bundle should be added to the graph");
					assert(graph["dep"], "the bundle's dependency should be also added");
					done();
				} catch(e) {
					done(e);
				}
			});
		});
	});

	it("Detects dependencies in virtual modules created", function(done){
		var config = {
			config: path.join(__dirname, "virtual_recycle", "config.js"),
			main: "main",
			logLevel: 3
		};
		var fileSystem = {};

		var depStream = bundle.createBundleGraphStream(config, { quiet: true });
		var recycleStream = recycle(config);

		depStream.pipe(recycleStream);

		function updateFileSystem(graph) {
			// we need to restore `fs` otherwise the fs.readFileSync call will
			// fail to read the file
			mockFs.restore();

			Object.keys(graph).forEach(function(name) {
				var node = graph[name];
				if(node.load.address) {
					var pth = path.resolve(node.load.address.replace("file:", ""));
					if(!fileSystem[pth]) {
						fileSystem[pth] = fs.readFileSync(pth, "utf8");
					}
				}
			});
		}

		function updateDep(data) {
			updateFileSystem(data.graph);

			var node = data.graph["other.txt!comp"];
			// Fake string as the source.
			fileSystem[urlPathToFSPath(node.load.address)] =
				"require('bit-tabs');\nmodule.exports='hello';";
			fileSystem[path.resolve(__dirname+"/virtual_recycle/tabs.js")] =
				"exports.tabs = function(){};";
			mockFs(fileSystem);

			recycleStream.write(node.load.name);

			recycleStream.once("data", function(data){
				try {
					assert(data.graph["tabs"], "tabs is now in the graph");
					done();
				} catch(e) {
					done(e);
				}
			});

			recycleStream.once("error", function(err){
				done(err);
			});
		}

		function updateConfig(data){
			var node = data.graph["config.js"];
			fileSystem[urlPathToFSPath(node.load.address)] =
				"System.config({ map: { 'bit-tabs': 'tabs' } });";
			mockFs(fileSystem);

			recycleStream.write(node.load.name);
			recycleStream.once("data", updateDep);
		}

		// Wait for it to initially finish loading.
		recycleStream.once("data", updateConfig);
	});
});

