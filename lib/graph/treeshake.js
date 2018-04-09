var clone = require("lodash/clone");
var { moduleNameFromSpecifier, moduleSpecifierFromName } = require("../node/dependency_resolver");
var rollup = require("rollup");
var source = require("../node/source");
var transformActiveSource = require("../node/transform_active_source");

function treeshake2(data, options) {
	let graph = data.graph;

	return rollup.rollup({
		entry: data.mains[0],
		acorn: {
			allowReserved: true,
			ecmaVersion: 8
		},
		experimentalPreserveModules: true,
		plugins: [{
			resolveId: function(id, importer, options) {
				if(importer) {
					let node = graph[importer];
					return moduleNameFromSpecifier(node, id);
				}
				return id;
			},
			load: function(id, options) {
				let node = graph[id];
				if(!node || node.load.metadata.format !== "es6") {
					return "export default {}";
				}
				return source.node(node);
			}
		}],
		onwarn: function(){}
	}).then(function(bundle){
		return bundle.generate({
			format:'es',
			paths: chunkNameToSpecifierResolver.bind(null, bundle, graph)
		}).then(function(out){
			var chunks = bundle.chunks;
			for(let [chunkName, source] of Object.entries(out)) {
				let id = chunks[chunkName].modules[0].id;
				let node = graph[id];
				if(!node || node.load.metadata.format !== "es6") {
					continue;
				}

				transformActiveSource(node, "treeshake", () => source);
			}
		});

	});
}

function chunkNameToSpecifierResolver(bundle, graph, chunkName, parentChunkName) {
	let chunks = bundle.chunks;
	let moduleName = chunks[chunkName].modules[0].id;
	let parentModuleName = chunks[parentChunkName].modules[0].id;

	let parentNode = graph[parentModuleName];
	if(!parentNode) {
		return moduleName;
	}
	let specifier = moduleSpecifierFromName(parentNode, moduleName);
	return specifier || moduleName;
}

module.exports = treeshake2;
