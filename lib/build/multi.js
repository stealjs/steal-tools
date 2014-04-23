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
      name: "jQuery",
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

var makeBundleGraph = require("../graph/make_graph_with_bundles"),
	order = require("../graph/order"),
	transpile = require("../graph/transpile"),
	minifyGraph = require("../graph/minify"),
	pluck = require("../graph/pluck"),
	makeBundle = require("../bundle/make_bundle"),
	nameBundle = require("../bundle/name"),
	flattenBundle = require("../bundle/flatten"),
	writeBundles = require("../bundle/write_bundles"),
	makeBundlesConfig = require("../bundle/make_bundles_config");

var fs = require('fs');

module.exports = function(config){

	// Get the merged dependency graphs for each System.bundle.
	return makeBundleGraph(config).then(function(data){

		var dependencyGraph = data.graph,
			baseURL = data.loader.baseURL,
			main = data.loader.main;
		
		// Remove stealconfig so it is not transpiled.  It is a global,
		// but we will want it to run ASAP.
		var stealconfig = pluck(dependencyGraph,"stealconfig");
		// Remove steal dev from production builds.
		var stealdev = pluck(dependencyGraph,"steal/dev/dev");
		
		// Adds an `order` property to each `Node` so we know which modules.  
		// The lower the number the lower on the dependency tree it is.
		// For example, jQuery might have `order: 0`.
		( data.steal.config("bundle") || []).forEach(function(moduleName){
			order(dependencyGraph, moduleName);
		});
		
		// Transpile each module to amd. Eventually, production builds
		// should be able to work without steal.js.
		transpile(dependencyGraph, "amd");
		
		// Minify every file in the graph
		minifyGraph(dependencyGraph);
		
		// Pull out the main module and its dependencies. They will be
		// in their own bundle.
		var stealConfigAndMain = stealconfig.concat( pluck(dependencyGraph, main) );
		
		// Create a master bundle with all the minified "main" modules.
		var masterBundle =  {
			nodes: minifyGraph( stealConfigAndMain ),
			bundles: [main]
		};
		nameBundle(masterBundle,{});
		
		// Put everything into unique bundle graphs that have no waste. The
		// modules are grouped by repeatedly taking the "most shared" set of
		// modules out of the dependency graph.  
		// The "most shared" set is the collection of modules that are shared 
		// by the most number of applications who's total minified length
		// is the largest.  Read more about this in `makeBundle`.
		var bundles = makeBundle(dependencyGraph),
			bundleNames = {};
		
		// It's possible that the number of bundles an endpoint would need to load
		// is quite large.  `flattenBundle` merges bundles to create
		// as little "waste" as possible. Waste means loading some modules that are not
		// needed.
		flattenBundle(bundles,config.bundleDepth || 3);
		
		// Name each bundle so we know what to call the bundle.
		bundles.forEach(nameBundle);
		
		// Add the master to bundles so it will be written out
		bundles.unshift(masterBundle);
		
		// Make config JS code so System knows where to look for bundles.
		var configNode = makeBundlesConfig(bundles);
		
		// add that config to the masterBundle
		masterBundle.nodes.unshift(configNode);

		// Write bundles to the file system
		writeBundles(bundles, baseURL);
	}).catch(function(e){
		console.log(e)
	});
};
