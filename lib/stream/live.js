var watch = require("./watch");
var createBundleGraphStream = require("../graph/make_graph_with_bundles").createBundleGraphStream;
var recycle = require("../graph/recycle");
var createServer = require("../create_websocket_server");

module.exports = function(config, options){
	// Create an initial dependency graph for this config.
	var graphStream = createBundleGraphStream(config);
	// Create a stream that is used to regenerate a new graph on file changes.
	var recycleStream = recycle(config);

	// Pipe the graph stream into the recycleStream so it can get the initial
	// graph.
	graphStream.pipe(recycleStream);

	// Setup the websocket connection.
	var wss = createServer(options);
	var port = wss.options.server.address().port;

	var watchStream = watch(recycleStream);
	watchStream.on("data", onChange);

	function onChange(node) {
		var moduleName = node ? node.load.name : "";

		if(moduleName) {
			console.error("Reloading", moduleName.green);

			// Alert all clients of the change
			wss.clients.forEach(function(ws){
				ws.send(moduleName);
			});
		}

		// Update our dependency graph
		recycleStream.write(moduleName);
	}
	
	recycleStream.once("data", function(){
		console.error("Live-reload server listening on port", port);
	});

	graphStream.write(config.main);

	return recycleStream;
};
