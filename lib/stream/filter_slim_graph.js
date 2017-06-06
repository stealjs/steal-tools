var keys = require("lodash/keys");
var omit = require("lodash/omit");
var through = require("through2");
var assign = require("lodash/assign");
var includes = require("lodash/includes");

module.exports = function() {
	return through.obj(function(data, enc, done) {
		try {
			done(null, filterGraph(data));
		} catch (err) {
			done(err);
		}
	});
};

var blackList = [
	"npm",
	"npm-convert",
	"npm-crawl",
	"npm-extension",
	"npm-load",
	"npm-utils",
	"semver",
	"@dev"
];

function filterGraph(data) {
	var visited = {};
	var filtered = {};
	var graph = data.graph;

	keys(graph).forEach(function visit(name) {
		// don't visit a node twice
		if (visited[name]) return;

		visited[name] = true;

		if (!includes(blackList, name)) {
			filtered[name] = graph[name];
		}
	});

	return assign({}, omit(data, "graph"), { graph: filtered });
}
