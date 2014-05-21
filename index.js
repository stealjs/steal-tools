var multiBuild = require("./lib/build/multi");
var pluginify = require("./lib/build/pluginifier");

module.exports = {
	build: multiBuild,
	pluginify: pluginify,
	graph: {
		each: require("./lib/graph/each_dependencies"),
		map: require("./lib/graph/map_dependencies"),
		make: require("./lib/graph/make_graph"),
		makeOrderedTranspiledMinified: require("./lib/graph/make_ordered_transpiled_minified_graph.js")
	}
};
