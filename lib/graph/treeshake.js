var babel = require("babel-standalone");
var clone = require("lodash/clone");
var { moduleNameFromSpecifier, moduleSpecifierFromName } = require("../node/dependency_resolver");
var processBabelPlugins = require("../process_babel_plugins");
var processBabelPresets = require("../process_babel_presets");
var rollup = require("rollup");
var source = require("../node/source");
var transformActiveSource = require("../node/transform_active_source");

function treeshake2(data, options) {
	let graph = data.graph;
	let getNode = Reflect.get.bind(null, data.graph);

	return rollup.rollup({
		entry: data.mains[0],
		acorn: {
			allowReserved: true,
			ecmaVersion: 9
		},
		experimentalPreserveModules: true,
		plugins: [
			loadFromGraph(getNode),
			transpile(getNode, data)
		],
		onwarn: function(){}
	}).then(function(bundle){
		return bundle.generate({
			format:'es',
			paths: chunkNameToSpecifierResolver.bind(null, bundle, graph)
		}).then(function(out){
			var chunks = bundle.chunks;
			for(let [chunkName, source] of Object.entries(out)) {
				let id = chunks[chunkName].modules[0].id;
				let node = getNode(id);
				if(notESModule(node)) {
					continue;
				}

				transformActiveSource(node, "treeshake", () => source);
			}
		});

	});
}

function loadFromGraph(getNode) {
	return {
		resolveId: function(id, importer, options) {
			if(importer) {
				let node = getNode(importer);
				return moduleNameFromSpecifier(node, id);
			}
			return id;
		},
		load: function(id, options) {
			let node = getNode(id);

			if(notESModule(node)) {
				let needToExport = new Set();
				let dependants = (node && node.load.metadata.dependants) || [];

				// Determine what to export by looking at dependants imports
				for(let depName of dependants) {
					let localNode = getNode(depName);
					let subgraph = localNode.load.metadata.subgraph;
					if(!subgraph) {
						continue;
					}

					for(let imp of subgraph.imports) {
						let depName = moduleNameFromSpecifier(localNode, imp.source);
						if(depName !== id) {
							continue;
						}

						for(let spec of imp.specifiers) {
							needToExport.add(spec.imported);
						}
					}
				}

				// Expose named exports so that dependant modules will tree-shake properly.
				if(needToExport.size) {
					let code = '';
					for(let exp of needToExport) {
						if(exp === "default") {
							code += "export default {};\n";
						} else {
							code += `export let ${exp} = {};\n`;
						}
					}

					return code;
				} else {
					return "export default {}";
				}
			}

			return source.node(node);
		}
	};
}

function transpile(getNode, data) {
	let loader = data.loader;
	let opts = loader.babelOptions || {};
	let required = ["es2015", {loose: false, modules: false}];

	opts.presets = processBabelPresets({
		baseURL: loader.baseURL,
		babelOptions: opts,
		loaderEnv: loader.getEnv()
	});

	opts.plugins = processBabelPlugins({
		baseURL: loader.baseURL,
		babelOptions: opts,
		loaderEnv: loader.getEnv()
	});

	if(opts.presets && opts.presets.length) {
		opts.presets = [required].concat(opts.presets);
	} else {
		opts.presets = [
			"react",
			"stage-0",
			required
		];
	}

	opts.sourceMaps = true;

	return {
		transform: function(code, id) {
			let node = getNode(id);
			if(notESModule(node)) {
				return code;
			}

			let result = babel.transform(code, opts);

			let deps = node.load.metadata.dependencies;
			for(let depName of node.load.metadata.dependencies) {
				let localNode = getNode(depName);
				if(!localNode) {
					continue;
				}
				if(!localNode.load.metadata.dependants) {
					localNode.load.metadata.dependants = [];
				}
				localNode.load.metadata.dependants.push(id);
			}

			// Update metadata with specifiers
			node.load.metadata.subgraph = result.metadata.modules;

			return {
				code: result.code,
				map: result.map
			};
		}
	}
}

function notESModule(node) {
	return !node || node.load.metadata.format !== "es6";
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
