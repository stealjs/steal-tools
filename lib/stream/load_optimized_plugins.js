var keys = require("lodash/keys");
var through = require("through2");
var assign = require("lodash/assign");
var cloneDeep = require("lodash/cloneDeep");

module.exports = function() {
	return through.obj(function(data, enc, next) {
		loadPlugins(data)
			.then(function(newGraph) {
				next(null, assign(data, { graph: newGraph }));
			})
			.catch(next);
	});
};

/**
 * Replaces plugin's source with its `pluginBuilder` module
 * @param {Object} data - The stream's data object
 * @return {Promise.<graph>}
 */
function loadPlugins(data) {
	var loader = data.loader;
	var graph = cloneDeep(data.graph);

	var promises = keys(graph).map(function(nodeName) {
		var node = graph[nodeName];

		// pluginBuilder points to another module to use instead of
		// the current plugin during runtime
		var pluginBuilder = node.value && node.value.pluginBuilder;

		if (node.isPlugin && pluginBuilder) {
			return (
				loader
					.normalize(pluginBuilder)
					.then(function(name) {
						return Promise.all([
							name,
							loader.locate({ name: name, metadata: {} })
						]);
					})
					// [ name, address ]
					.then(function(data) {
						return Promise.all([
							data[1],
							loader.fetch({ name: data[0], address: data[1], metadata: {} })
						]);
					})
					// [ address, source ]
					.then(function(data) {
						node.load = assign(node.load, {
							address: data[0],
							source: data[1],
							metadata: {}
						});
					})
			);
		}
	});

	return Promise.all(promises).then(function() {
		return graph;
	});
}
