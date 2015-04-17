var createBundleGraphStream = require("../graph/make_graph_with_bundles").createBundleGraphStream;
var regraph = require("../graph/regraph");
var multiBuild = require("../stream/build");
var createWriteStream = require("../bundle/write_bundles").createWriteStream;
var watch = require("../stream/watch");
var defaults = require("lodash").defaults;

module.exports = function(config, options){
	var moment = require("moment");

	defaults(options, {
		sourceMaps: true,
		minify: false,
		quiet: true
	});

	var moduleName;

	// A function that is called whenever a module is found by the watch stream.
	// Called with the name of the module and used to rebuild.
	function rebuild(node){
		moduleName = node ? node.load.name : "";
		rebuildStream.write(moduleName);
	}

	function log(){
		var rebuiltPart = moduleName ? moduleName : "";
		var time = "[" + moment().format("LTS") + "]";
		console.log(time.red + (moduleName ? ":" : ""), rebuiltPart.green);
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
	buildStream.once("data", function(){
		console.log("Watch mode ready.");
	});
	
	// Writing into the graph stream is what triggers the process to start.
	graphStream.write(config.main);
	return buildStream;
};
