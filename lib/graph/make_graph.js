var winston = require('winston');
var trace = require("../trace");
var steal = require("steal");
var _ = require("lodash");
var addParseAMD = require("system-parse-amd");

var formatMap = {
	'amd-parse' : 'amd'
};


var makePredefinedPluginDependencies = require('./make_predefined_plugin_dependencies');
var SystemRegistry = global.SystemRegistry = {};

module.exports = function(config, options){
	options = options || {};
	winston.info('OPENING: ' + (config.main || config.startId || config.config));
	var oldGlobalSystem = global.System;
	// get all modules that are configured in the metadata object
	var configMetas = (config.meta) ? Object.getOwnPropertyNames(config.meta) : [];

	// This version of steal, and it's System, will be configured exactly like
	// a page that might run will be configured.
	// However, `trace` will prevent its "code" from actually running.
	var localSteal = steal.clone();
	addParseAMD( localSteal.System );

	localSteal.System.config({ env: "development" });
	localSteal.System.config(_.omit(config, ["meta"]));
	if(options.localStealConfig) {
		localSteal.System.config(options.localStealConfig);
	}

	localSteal.System.systemName = (localSteal.System.systemName||"")+"-local";
	// This version of steal, and it's System can be used to load
	// modules that need to actually run code. The most common example is
	// plugins that transform their code.
	var buildSteal = steal.clone();

	// TODO: add test that fails if the following is uncommented.
	// Special types don't work that write to AMD if we add parseAMD to this.
	//addParseAMD( buildSteal.System );
	// It should be confured exactly like `localSteal`
	buildSteal.System.config(_.omit(config, ["meta"]));
	buildSteal.System.systemName = (buildSteal.System.systemName ||"")+ "-build";

	if(options.system) {
		buildSteal.System.config(options.system);
		localSteal.System.config(options.system);
	}

	// Except that it does not have a System.main so `startup` will
	// not load the main module.  But it will load @config and @dev.
	delete buildSteal.System.main;
	buildSteal.System.config({ env: "build" });

	// Set the build as the global objects
	global.steal = buildSteal;
	global.System = buildSteal.System;

	// And kick off startup to get @config and @dev.
	var buildPromise = buildSteal.startup();
	SystemRegistry[buildSteal.System.systemName] = buildSteal.System;
	SystemRegistry[localSteal.System.systemName] = localSteal.System;

	// The graph object we are creating.
	var graph = {},
		depPromises = [];

	// Setup trace to callback when a module is found.

	trace(localSteal.System, buildSteal.System, function(load, deps, dependencies, pluginValue){
		if(formatMap[load.metadata.format]) {
			load.metadata.format= formatMap[load.metadata.format];
		}

		winston.debug( (localSteal.System.systemName||"") +'+ ' + load.name+ (
		localSteal.System.bundle ? "-"+localSteal.System.bundle : ""));
		// there could have been an old load from the BuildSystem
		var oldLoad = graph[load.name];

		var loadNode = graph[load.name] = {};
		loadNode.load = load;
		loadNode.deps = deps;
		loadNode.dependencies = dependencies;

		if(arguments.length === 4){
			// only mark as plugin if there was an oldLoad
			loadNode.isPlugin = !oldLoad;
			loadNode.value = pluginValue;
		}
	});

	return buildPromise.then(function(){

		var normalizedMetaPromises = _.map(configMetas, function(module){
			return buildSteal.System.normalize(module).then(function(nmodule) {
				return Promise.resolve([module, nmodule]);
			});
		});

		// at this point the npm config should be imported by System
		// now we can merge the meta information from your build config
		// this is be necessary because, we wont overwrite the metadata http://stealjs.com/docs/load.metadata.html
		// that can be set in the package.json file
		Promise.all(normalizedMetaPromises).then(function(module) {
			_.forEach(module, function(module) {
				if(buildSteal.System.meta[module[1]] != undefined ){
					buildSteal.System.meta[module[1]] = _.extend(buildSteal.System.meta[module[1]], config.meta[module[0]]);
				}else{
					buildSteal.System.meta[module[1]] = config.meta[module[0]];
				}
			});
		});

		buildSteal.System.config(buildSteal.System.buildConfig || {});

		// Set the instantiate-less version of steal and System as global.
		global.steal = localSteal;
		global.System = localSteal.System;
		// Kickoff loading @config, @dev, and System.main modules.

		// set config one more time on startup.  This is to make sure the final values
		// are these values.
		var localConfig = _.omit(config, ["config","systemName","meta"]);
		localConfig['meta'] = buildSteal.System.meta;

		var appPromise = localSteal.startup(localConfig);

		return appPromise.then(function(){
			return Promise.all(depPromises)
				.then(function() {
					var main = localSteal.System.main;
					var mains = Array.isArray(main) ? main : [main];
					var normalizedPromises = mains.map(function(main){
						return Promise.resolve(localSteal.System.normalize(main));
					});
					return Promise.all(normalizedPromises).then(function(main) {
						localSteal.System.main = main.length > 1 ? main : main[0];
					});
				})
				.then(function(){
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

	});

};
