var _ = require("lodash");
var path = require("path");
var winston = require("winston");
var through = require("through2");
var minimatch = require("minimatch");

module.exports = function() {
	return through.obj(function(data, enc, done) {
		try {
			done(null, filterGraph(data));
		} catch(err) {
			done(err);
		}
	});
};

function filterGraph(data) {
	var visited = {};
	var filtered = {};
	var graph = data.graph;

	_.keys(graph).forEach(function visit(name) {
		// don't visit a node twice
		if (visited[name]) return;

		visited[name] = true;
		var node = graph[name];

		if (!node) {
			if (name && name[0] !== "@") {
				winston.warn("Can't find dependency", name, "in graph.");
			}
			return;
		}

		var address = node.load.address;
		var pattern = getGlobPattern(data);

		if (minimatch(address, pattern)) {
			node.dependencies.forEach(visit);
			filtered[name] = node;
		}
	});

	return _.assign(
		{},
		_.omit(data, "graph"),
		{ graph: filtered }
	);
}

function getGlobPattern(data) {
	var options = data.options;
	var baseUrl = data.loader.baseURL;
	var filter = options.filter || "node_modules/**/*";

	return path.join(baseUrl, filter);
}
