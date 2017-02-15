var _ = require("lodash");
var winston = require("winston");
var through = require("through2");
var npmUtils = require("steal/ext/npm-utils");

var isNpm = npmUtils.moduleName.isNpm;

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

	function visit(name) {
		if (!visited[name]) {

			visited[name] = true;
			var node = graph[name];

			if (!node) {
				if (name && name[0] !== "@") {
					winston.warn("Can't find dependency", name, "in graph.");
				}
				return;
			}

			node.dependencies.forEach(visit);
			filtered[name] = node;
		}
	}

	_.keys(graph).forEach(function(name) {
		if (isNpm(name)) visit(name);
	});

	return _.assign(
		{},
		_.omit(data, "graph"),
		{ graph: filtered }
	);
}
