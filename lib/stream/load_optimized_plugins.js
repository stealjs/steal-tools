var keys = require("lodash/keys");
var through = require("through2");
var assign = require("lodash/assign");
var denodeify = require("pdenodeify");
var cloneDeep = require("lodash/cloneDeep");
var readFile = denodeify(require("fs").readFile);

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
			return loader
				.normalize(pluginBuilder)
				.then(function(name) {
					return loader.locate({ name: name, metadata: {} });
				})
				.then(function(address) {
					return Promise.all([address, readFile(address.replace("file:", ""))]);
				})
				.then(function(result) {
					node.load = assign(node.load, {
						address: result[0],
						source: result[1].toString(),
						metadata: {}
					});
				});
		}
	});

	return Promise.all(promises).then(function() {
		return graph;
	});
}
