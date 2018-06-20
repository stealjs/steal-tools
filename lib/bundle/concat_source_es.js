var dependencyResolver = require("../node/dependency_resolver");
var pluginCommonjs = require("rollup-plugin-commonjs");
var rollup = require("steal-rollup");
var sourceNode = require("../node/source").node;

const moduleNameFromSpecifier = dependencyResolver.moduleNameFromSpecifier;
const CJS_PROXY_PREFIX = '\0commonjs-proxy:';

module.exports = function(bundle, sourceProp, excludePlugins){
	let main = bundle.bundles[0];

	let nodeMap = new Map();
	for(let node of bundle.nodes) {
		nodeMap.set(node.load.name + ".js", node);
	}
	let getNode = nodeMap.get.bind(nodeMap);

	return rollup.rollup({
		input: main,

		plugins: [
			loadFromGraph(getNode, sourceProp, excludePlugins),
			pluginCommonjs({})
		]
	})
	.then(function(bundle){
		return bundle.generate({
			format:'es',
			sourcemap: true
		});
	})
	.then(function(chunk){
		bundle.source = {
			code: chunk.code,
			map: chunk.map
		};
	});
};

function loadFromGraph(getNode, sourceProp) {
	return {
		resolveId: function(id, importer) {
			if(id.startsWith(CJS_PROXY_PREFIX)) {
				id = id.substr(CJS_PROXY_PREFIX.length);
			}
			if(importer) {
				let node = getNode(importer);
				var outId = moduleNameFromSpecifier(node, id);
				return (outId === "@empty" ? id : outId) + ".js";
			}
			return id + ".js";
		},
		load(id) {
			let node = getNode(id);
			let source = sourceNode(node, sourceProp);

			return source;
		}
	};
}
