var chokidar = require("chokidar");

module.exports = function(buildStream, rebuildStream, callback){
	var watcher, addresses, allNodes;

	function buildComplete(bundles){
		allNodes = invert(bundles);
		addresses = Object.keys(allNodes);
		setupWatch();
	}

	function changed(event, address){
		var node = allNodes[address];
		callback(node);
	}

	function setupWatch(){
		if(!watcher) {
			watcher = chokidar.watch(addresses, { ignoreInitial: true });
			watcher.on("all", changed);
		} else {
			watcher.unwatch(addresses);
			watcher.add(addresses);
		}
	}

	buildStream.on("data", buildComplete);

	rebuildStream.on("error", function(error){
		// If this is a missing file add it to our watch.
		if(error.code === "ENOENT" && error.path) {
			console.log("File not found:", error.path);
			watcher.add(error.path);
		}
	});
};

// Given an array of bundles, inverts them into a table of addresses to nodes
function invert(bundles){
	var table = {};
	bundles.forEach(function(bundle){
		bundle.nodes.forEach(function(node){
			if(node.load.address){
				table[node.load.address.replace("file:", "")] = node;
			}
		});
	});
	return table;
}

