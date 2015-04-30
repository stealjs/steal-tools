var chokidar = require("chokidar");
var ReadableStream = require("stream").Readable;

module.exports = function(graphStream){
	var watcher, addresses, allNodes;
	var stream = new ReadableStream({ objectMode: true });
	stream._read = function(){};

	function updateWatch(data){
		allNodes = invert(data.graph);
		addresses = Object.keys(allNodes);

		watcher.add(addresses);
	}

	function changed(event, address){
		var node = allNodes[address] || "";
		stream.push(node || "");
	}

	watcher = chokidar.watch(null, { ignoreInitial: true });
	watcher.on("all", changed);

	graphStream.on("data", updateWatch);

	return stream;
};

// Given an array of bundles, inverts them into a table of addresses to nodes
function invert(graph){
	var table = {};
	Object.keys(graph).forEach(function(moduleName){
		var node = graph[moduleName];
		if(node.load.address){
			table[node.load.address.replace("file:", "")] = node;
		}

	});
	return table;
}
