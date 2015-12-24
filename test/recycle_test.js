var assert = require("assert"),
	bundle = require("../lib/graph/make_graph_with_bundles"),
	logging = require("../lib/logger"),
	mockFs = require("mock-fs"),
	path = require("path"),
	recycle = require("../lib/graph/recycle");

describe("Recycle", function(){
	beforeEach(function() {
		logging.setup({ quiet: true });
	});

	afterEach(mockFs.restore);

	it("Creates an error message when there is an es6 syntax error", function(done){
		var config = {
			config: path.join(__dirname, "stealconfig.js"),
			main: "basics/basics",
			logLevel: 3
		};

		var depStream = bundle.createBundleGraphStream(config);
		var recycleStream = recycle(config);

		depStream.pipe(recycleStream);

		// Wait for it to initially finish loading.
		recycleStream.once("data", function(data){
			var node = data.graph["basics/es6module"];
			var mockOptions = {};
			// Fake string as the source.
			mockOptions[node.load.address.replace("file:", "")] = "syntax error";
			mockFs(mockOptions);

			recycleStream.write(node.load.name);

			recycleStream.once("error", function(err){
				assert(err instanceof Error, "we got an error");
				done();
			});
		});

		depStream.write(config.main);

	});

	it("Works with a project using live-reload", function(done){
		var config = {
			config: __dirname + "/live_reload/package.json!npm",
			logLevel: 3
		};
		var options = {
			localStealConfig: {
				env: "build-development"
			}
		};

		var depStream = bundle.createBundleGraphStream(config, options);
		var recycleStream = recycle(config, options);

		depStream.pipe(recycleStream);

		// Wait for it to initially finish loading.
		recycleStream.once("data", function(data){
			var node = data.graph.foo;
			var mockOptions = {};
			// Fake string as the source.
			mockOptions[node.load.address.replace("file:", "")] = "module.exports = 'foo'";
			mockFs(mockOptions);

			recycleStream.once("data", function(data){
				var node = data.graph.main;

				assert(/foo/.test(node.load.source), "Source changed");
				done();
			});

			recycleStream.write(node.load.name);
		});

		depStream.write(config.main);

	});

	it("Detects dynamic imports added when no static dependencies have changed", function(done){
		var config = {
			config: path.join(__dirname, "/recycle_dynamic/config.js"),
			main: "something.txt!plug",
			logLevel: 3,
			map: { "@dev": "@empty" }
		};

		var depStream = bundle.createBundleGraphStream(config);
		var recycleStream = recycle(config);

		depStream.pipe(recycleStream);

		// Wait for it to initially finish loading.
		recycleStream.once("data", function(data){
			var node = data.graph["something.txt!plug"];

			// Update the module so that it has a dynamic import. This should
			// be added to the loader's bundle and the graph reloaded.
			var mockOptions = {};
			Object.keys(data.graph).forEach(function(moduleName){
				var load = data.graph[moduleName].load;
				mockOptions[load.address.replace("file:", "")] = load.source;
			});
			mockOptions[node.load.address.replace("file:", "")] =
				'System.import("another");';
			mockOptions[path.resolve(__dirname + "/recycle_dynamic/another.js")]
				= 'var dep = require("./dep");';
			mockOptions[path.resolve(__dirname + "/recycle_dynamic/dep.js")]
				= 'module.exports = "dep";';
			mockFs(mockOptions);

			recycleStream.write(node.load.name);
			recycleStream.once("data", function(data){
				var graph = data.graph;
				assert(graph["another"], "this bundle was added to the graph");
				assert(graph["dep"], "the bundle's dependency was also added");
				done();
			});
		});

		depStream.write(config.main);

	});
});

