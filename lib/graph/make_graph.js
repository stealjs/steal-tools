var trace = require("../trace");
var steal = require("steal");
var _ = require("lodash");
var makePredefinedPluginDependencies = require('./make_predefined_plugin_dependencies');

module.exports = function(config){
	var oldGlobalSystem = global.System;

	var localSteal =  steal.clone( steal.addFormat( steal.System.clone() ) );

	localSteal.config(config);

	// Create a build System that has the special configuration.
	var buildSteal =  steal.clone( steal.addFormat( steal.System.clone() ) );
	buildSteal.config(config);	
	
	delete buildSteal.System.main;
	
	global.steal = buildSteal;
	global.System = buildSteal.System;
	
	var buildPromise = buildSteal.startup();

	return buildPromise.then(function(){
		
		buildSteal.config(buildSteal.System.buildConfig);
		
		var graph = {},
		depPromises = [],
		graphPromise = new Promise();
		
		trace(localSteal.System, buildSteal.System, function(load, deps, pluginValue){
			var loadNode = graph[load.name] = {};
			loadNode.load = load;
			
			loadNode.deps = deps;
			
			if(pluginValue){
				loadNode.isPlugin = true;
				loadNode.value = pluginValue;
			} 
			
			var depPromise = Promise.all(deps.map(function(dep){
				return Promise.resolve( localSteal.System.normalize(dep, load.name, load.address) );
			})).then(function(dependencies){
				loadNode.dependencies = dependencies;
			}, function(){
				console.log("unable to resolve dependency ",dep);
			});
			depPromises.push(depPromise);
		});
		
		global.steal = localSteal;
		global.System = localSteal.System;

		var localConfig = _.omit(config, "config");
		var appPromise = localSteal.startup(localConfig);

		return appPromise.then(function(){
			return Promise.all(depPromises).then(function(){
				global.System = oldGlobalSystem;
				debugger;
				makePredefinedPluginDependencies(graph);
				
				return { 
					graph: graph, 
					steal: localSteal, 
					loader: localSteal.System,
					buildLoader: buildSteal.System
				};
			});
		});
		
		
	}, function(e){
		setTimeout(function(){
			throw e
		}, 1);
	});
	
	
	
};
