var omit = require("lodash/omit");
var through = require("through2");
var assign = require("lodash/assign");

module.exports = function() {
	return through.obj(function(data, enc, done) {
		try {
			done(null, convertSlimConfig(data));
		} catch (err) {
			done(err);
		}
	});
};

function convertSlimConfig(data) {
	var map = {};
	var graph = data.graph;
	var config = data.loader.slimConfig;

	function getSlimId(id) {
		if (graph[id]) {
			return graph[id].load.uniqueId;
		} else {
			throw new Error("Cannot find module: " + id + " in graph.");
		}
	}

	config.toMap.forEach(function(id) {
		map[id] = getSlimId(id);
	});

	// mutates the slimConfig property!
	data.loader.slimConfig = assign({}, omit(config, ["toMap"]), {
		map: map,
		extensions: config.extensions.map(getSlimId)
	});

	return data;
}
