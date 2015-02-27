/*

# lib/build/multi.js

The bundled build works by loading the _main_ module and all of its
dependencies and then all of the `System.bundle` modules 
and their dependencies. It makes a dependency graph that looks like:

```js
{
  moduleName: Node({
    load: Load({
      name: moduleName,
      source: SOURCE
    }),
    dependencies: [moduleName],
    bundles: [bundleName],
  })
}
```

Here's an example:

```js
{
  "jquery": {
    load: {
      name: "jquery",
      source: "jQuery = function(){ ... }"
    },
    dependencies: [],
    bundles: ["profile","settings","login", ...]
  },
  "can/util": {
    load: {
      name: "can/util",
      source: "define(['jquery'], function($){ ... })" 
    },
    dependencies: ["jquery"],
    bundles: ["profile","login"]
  }
}
```

A `Load` is a ES6 load record.

A `Node` is an object that contains the load and other 
useful information. The build tools only write to `Node` to keep `Load` from being changed.

It manipulates this graph and eventually creates "bundle" graphs.  Bundle graphs look like:

     {
       size: 231231,
       nodes: [node1, node2, ...],
       bundles: [bundleName1, bundleName2]	
     }
     
The nodes in those bundles are written to the filesystem.

*/
var winston = require('winston');

var makeBundleGraph = require("../graph/make_graph_with_bundles"),
	order = require("../graph/order"),
	transpile = require("../graph/transpile"),
	minifyGraph = require("../graph/minify"),
	pluck = require("../graph/pluck"),
	makeBundle = require("../bundle/make_bundle"),
	nameBundle = require("../bundle/name"),
	flattenBundle = require("../bundle/flatten"),
	writeBundles = require("../bundle/write_bundles"),
	makeBundlesConfig = require("../bundle/make_bundles_config"),
	splitByBuildType = require("../bundle/split_by_build_type"),
	addStealToBundle = require("../bundle/add_steal"),
	_ = require("lodash"),
	logging = require("../logger"),
	hasES6 = require("../graph/has_es6"),
	clean = require("../graph/clean"),
	addTraceurRuntime = require("../bundle/add_traceur_runtime"),
	makeConfiguration = require("../configuration/make"),
	splitGraphByModuleNames = require("../graph/split"),
	getBundleForOnly = require("../bundle/get_for_only"),
	findBundles = require("../loader/find_bundle");

module.exports = function(config, options){
	options = _.assign({ // Defaults
		minify: true,
		bundleSteal: false,
		uglifyOptions: {},
		cleanCSSOptions: {},
		removeDevelopmentCode: true,
		namedDefines: true
	}, options);

	// Setup logging
	logging.setup(options, config);

	// Minification is optional
	var minify = options.minify = options.minify !== false;

	// Get the merged dependency graphs for each System.bundle.
	return makeBundleGraph(config).then(function(data){
		var dependencyGraph = data.graph,
			// the apps we are building
			mains = Array.isArray(config.main) ? config.main.slice(0) : [data.loader.main],
			configuration = makeConfiguration(data.loader, data.buildLoader, options);

		// Remove @config so it is not transpiled.  It is a global,
		// but we will want it to run ASAP.
		var stealconfig = pluck(dependencyGraph,data.loader.configMain ||"@config");
		transpile(stealconfig, "amd", options, data);

		// Remove steal dev from production builds.
		pluck(dependencyGraph,"@dev");
		
		// Adds an `order` property to each `Node` so we know which modules.  
		// The lower the number the lower on the dependency tree it is.
		// For example, jQuery might have `order: 0`.
		mains.forEach(function(moduleName){
			order(dependencyGraph, moduleName);
		});
		
		findBundles(data.loader).forEach(function(moduleName){
			order(dependencyGraph, moduleName);
		});

		// Clean development code if the option was passed
		if(options.removeDevelopmentCode) {
			clean(dependencyGraph, options);
		}
		
		// Transpile each module to amd. Eventually, production builds
		// should be able to work without steal.js.
		winston.info('Transpiling...');
		transpile(dependencyGraph, "amd", options, data);
		
		// Minify every file in the graph
		if(minify) {
			winston.info('Minifying...');
			minifyGraph(dependencyGraph, options);
			minifyGraph(stealconfig, options);
		}

		// Split the graph into two smaller graphs. One will contain the
		// "mains" and their dependencies that need to be loaded right away.  
		// The other will will be the bundles that are progressively loaded.
		var splitGraphs = splitGraphByModuleNames(dependencyGraph, mains),
			mainsGraph = splitGraphs["with"],
			bundledGraph = splitGraphs.without;

		winston.info('Calculating main bundle(s)...');
		// Put everything into unique bundle graphs that have no waste. 
		var mainBundles = makeBundle(mainsGraph);
		// Combine bundles to reduce the number of total bundles that will need to be loaded
		winston.info('Flattening main bundle(s)...');
		flattenBundle(mainBundles,config.mainDepth || config.bundleDepth || 3);
		// Break up bundles by buildType
		var splitMainBundles = splitByBuildType(mainBundles);

		var splitBundles = [];
		if(!_.isEmpty(bundledGraph)) {
			winston.info('Calculating progressively loaded bundle(s)...');
			// Put everything into unique bundle graphs that have no waste. 
			var bundles = makeBundle(bundledGraph);
			// Combine bundles to reduce the number of total bundles that will need to be loaded
			winston.info('Flattening progressively loaded bundle(s)...');
			flattenBundle(bundles,config.bundleDepth || 3);
			// Break up bundles by buildType
			splitBundles = splitByBuildType(bundles);
		}

		
		
		// Every mainBundle needs to have @config and bundle configuration to know
		// where everything is. Lets get those main bundles here while there is less to go through.

		var mainJSBundles = mains.map(function(main){
			return getBundleForOnly(splitMainBundles,main,"js");
		});
		
		// Combine all bundles
		var allBundles = splitMainBundles.concat(splitBundles);
		// Name each bundle so we know what to call the bundle.
		allBundles.forEach(nameBundle);
		// Make sure the main bundle doesn't have an npm-normalized name
		mainJSBundles.forEach(nameBundle.denpmed);

		// Create a lookup object of the main bundle names so that they are
		// excluded from the Bundles config
		var mainJSBundleNames = {};
		mainJSBundles.forEach(function(mainJSBundle){
			mainJSBundleNames[mainJSBundle.name] = true;
		});
		
		// Add @config and the bundleConfigNode to each main
		mainJSBundles.forEach(function(mainJSBundle){
			[].unshift.apply(mainJSBundle.nodes, stealconfig );
			// Make config JS code so System knows where to look for bundles.
			var configNode = makeBundlesConfig(allBundles, configuration, mainJSBundle, {
				excludedBundles: mainJSBundleNames
			});
			mainJSBundle.nodes.unshift(configNode);
			
			if(options.bundleSteal) {
				addStealToBundle(mainJSBundle, mainJSBundle.bundles[0], configuration);
			}
			// Traceur code requires a runtime.
			var hasES6modules = hasES6(dependencyGraph);
			if( hasES6modules ) {
				addTraceurRuntime(mainJSBundle);
			}
			
		});
		
		return writeBundles(allBundles, configuration );
		
	}).catch(function(e){
		winston.error(e.message, e.stack);
		throw e;
	});
};
