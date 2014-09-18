var winston = require('winston');
var trace = require("../trace");
var steal = require("steal");
var _ = require("lodash");
var makePredefinedPluginDependencies = require('./make_predefined_plugin_dependencies');
var SystemRegistry = global.SystemRegistry = {};

module.exports = function(config){
	winston.info('OPENING: ' + (config.main || config.startId));
	var oldGlobalSystem = global.System;

	// This version of steal, and it's System, will be configured exactly like 
	// a page that might run will be configured. 
	// However, `trace` will prevent its "code" from actually running.
	var localSteal =  steal.clone( steal.addSteal( steal.System.clone() ) );
	localSteal.System.config(config);
	localSteal.System.systemName += "-local";
	// This version of steal, and it's System can be used to load
	// modules that need to actually run code. The most common example is 
	// plugins that transform their code.
	var buildSteal =  steal.clone( steal.addSteal( steal.System.clone() ) );
	// It should be confured exactly like `localSteal`
	buildSteal.System.config(config);	
	buildSteal.System.systemName += "-build";
	
	// Except that it does not have a System.main so `startup` will 
	// not load the main module.  But it will load @config and @dev.
	delete buildSteal.System.main;
	
	// Set the build as the global objects
	global.steal = buildSteal;
	global.System = buildSteal.System;

	// And kick off startup to get @config and @dev.
	var buildPromise = buildSteal.startup();
	SystemRegistry[buildSteal.System.systemName] = buildSteal.System;
	SystemRegistry[localSteal.System.systemName] = localSteal.System;
	
	return buildPromise.then(function(){
		// When the build has loaded, update its config with any `buildConfig`
		// options found.
		buildSteal.System.config(buildSteal.System.buildConfig || {});
		
		// The graph object we are creating.
		var graph = {},
			depPromises = [];
		
		// Setup trace to callback when a module is found.
		
		trace(localSteal.System, buildSteal.System, function(load, deps, pluginValue){
			winston.debug(localSteal.System.systemName +'+ ' + load.name+"-"+localSteal.System.bundle);

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
			}, function(err){
				winston.warn("unable to resolve dependency ", err);
			});
			depPromises.push(depPromise);
		});
		
		// Set the instantiate-less version of steal and System as global.
		global.steal = localSteal;
		global.System = localSteal.System;
		// Kickoff loading @config, @dev, and System.main modules.
		
		// set config one more time on startup.  This is to make sure the final values
		// are these values.
		var localConfig = _.omit(config, ["config","systemName"]);
		
		var appPromise = localSteal.startup(localConfig);

		return appPromise.then(function(){
			return Promise.all(depPromises).then(function(){
				global.System = oldGlobalSystem;
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
			throw e;
		}, 1);
	});
	
	
	
};
