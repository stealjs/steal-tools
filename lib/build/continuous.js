var createBundleGraphStream = require("../graph/make_graph_with_bundles").createBundleGraphStream;
var regraph = require("../graph/regraph");
var multiBuild = require("../stream/build");
var createWriteStream = require("../bundle/write_bundles").createWriteStream;
var watch = require("../stream/watch");
var defaults = require("lodash").defaults;

module.exports = function(config, options){
	defaults(options, {
		sourceMaps: true,
		minify: false,
		quiet: true
	});

	var start = new Date(), moduleName;

	// A function that is called whenever a module is found by the watch stream.
	// Called with the name of the module and used to rebuild.
	function rebuild(node){
		start = new Date();
		moduleName = node ? node.load.name : "";
		rebuildStream.write(moduleName);
	}

	function log(){
		var ms = new Date() - start;
		var rebuiltPart = "";
		if(moduleName) {
			rebuiltPart = "[" + moduleName + "]";
		}
		console.log(rebuiltPart.red + (moduleName ? ":" : ""), ms.toString().green, "ms");
	}

	// Create an initial dependency graph for this config.
	var graphStream = createBundleGraphStream(config);
	// Create a stream that is used to regenerate a new graph on file changes.
	var rebuildStream = regraph(config);

	// Create a build stream that does everything; creates a graph, bundles,
	// and writes the bundles to the filesystem.
	var buildStream = graphStream
		.pipe(rebuildStream)
		.pipe(multiBuild(config, options))
		.pipe(createWriteStream());

	// Watch the build stream and call rebuild whenever it changes.
	watch(buildStream, rebuildStream, rebuild);
	buildStream.on("data", log);
	
	// Writing into the graph stream is what triggers the process to start.
	graphStream.write(config.main);
	return buildStream;
};
