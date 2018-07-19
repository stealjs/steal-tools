const dependencyResolver = require("../node/dependency_resolver");
const isProcessShim = require("../node/is_process_shim");
const pluginCommonjs = require("rollup-plugin-commonjs");
const rollup = require("steal-rollup");

const moduleNameFromSpecifier = dependencyResolver.moduleNameFromSpecifier;
const CJS_PROXY_PREFIX = '\0commonjs-proxy:';

module.exports = function(bundle) {
	let main = bundle.bundles[0];
	let firstNode = bundle.nodes[0];

	let nodeMap = new Map();
	for(let node of bundle.nodes) {
		nodeMap.set(node.load.name + ".js", node);
	}
	let getNode = nodeMap.get.bind(nodeMap);

	return rollup.rollup({
		input: main,

		plugins: [
			loadFromGraph(getNode),
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
		let sourceCode = chunk.code;
		if(isProcessShim(firstNode)) {
			sourceCode = firstNode.load.source + "\n" + sourceCode;
		}

		bundle.source = {
			code: sourceCode,
			map: chunk.map
		};
	});
};

function loadFromGraph(getNode) {
	return {
		resolveId: function(id, importer) {
			if(id.startsWith(CJS_PROXY_PREFIX)) {
				id = id.substr(CJS_PROXY_PREFIX.length);
			}
			if(importer) {
				let node = getNode(importer);
				var outId = moduleNameFromSpecifier(node, id);
				// Likely one of the commonjs plugins' weird internal modules
				if(!outId) {
					return undefined;
				}
				return (outId === "@empty" ? id : outId) + ".js";
			}
			return id + ".js";
		},
		load(id) {
			let node = getNode(id);

			// Likely one of the commonjs plugins' weird internal modules
			if(!node) {
				return undefined;
			}

			let source = node.load.source;
			return source;
		}
	};
}
