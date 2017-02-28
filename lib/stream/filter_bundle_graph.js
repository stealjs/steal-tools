var _ = require("lodash");
var path = require("path");
var winston = require("winston");
var through = require("through2");
var multimatch = require("multimatch");

module.exports = function() {
	return through.obj(function(data, enc, done) {
		try {
			done(null, filterGraph(data));
		} catch(err) {
			done(err);
		}
	});
};

function getGlobPattern(data) {
	var options = data.options;

	return options.filter || "**";
}

function filterGraph(data) {
	var visited = {};
	var filtered = {};
	var graph = data.graph;
	var baseUrl = data.loader.baseURL;

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
		var relative = address.replace(baseUrl, "");

		if (multimatch(relative, pattern).length) {
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
