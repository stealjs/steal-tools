var _ = require('lodash');
var	fs = require('fs-extra');
var path = require('path');
var eachGraph = require("../graph/each_dependencies");
var pluginifier = require("../build/pluginifier");
var helpers = require('./helpers/helpers');
var winston = require('winston');
var logging = require("../logger");

var mergeModules = function(items, modules){
	var i = 0,
		item;
	while(i < items.length) {
		item = items[i];
		if(typeof item === "object" && !(item instanceof RegExp) ) {
			var moduleNames = _.map( _.where(modules, item), "moduleName");
			items.splice.apply(items,[i,1].concat(moduleNames));
			i = i + moduleNames.length;
		} else {
			i++;
		}
	}
};

var addDefaults = function(name, obj, defaults){
	var helpers = [];

	name.replace(/\+([\w-]+)/g,function(whole, part){
		var defs = defaults[part];
		if(defs) {
			if(typeof defs === "function") {
				defs = defs(obj);
				_.assign(obj, defs);
			} else {
				_.defaults(obj, defs);
			}
			helpers.push(part);
		}
		
	});
	
	if(helpers.length) {
		winston.debug("  added helpers: "+helpers.join(","));
	}
};


// config {system: {}, options: {}, outputs: {}}
module.exports = function(config, modules, defaults, cb){
	logging.setup(config.options || {}, config.system || {});
	
	// allow defaults that overwrite our helpers
	var defaultHelpers = _.clone(helpers);
	_.assign(defaultHelpers, defaults);
	
	// converts to an array of outputs
	config.outputs = _.map(config.outputs || config.pluginify, function(output, name){
		
		addDefaults(name, output, defaultHelpers || {}, config.options || {});
		// merge modules and graphs
		mergeModules(output.modules || [], modules);
		mergeModules(output.eachModule || [], modules);
		mergeModules(output.graphs || [], modules);
		mergeModules(output.ignore || [], modules);
		
		
		return {
			name: name,
			output: output
		};
	});
	
	var modulesMap = _.indexBy(modules,"moduleName");
	
	// writing utils
	var fileWrites = 0,
		errors = [],
		writeFile = function(filename, data){
			fileWrites++;
			fs.mkdirs(path.dirname(filename), function(err){
				if(err) {
					errors.push(err);
					fileWrites--;
					if(fileWrites === 0) {
						cb(errors.length ? errors: undefined);
					}
				} else {
					fs.writeFile(filename, data, function(err){
						if(err) {
							errors.push(err);
						}
						fileWrites--;
						if(fileWrites === 0) {
							cb(errors.length ? errors: undefined);
						}
					});
				}
			});
		};
	
	
	var pluginify,
		pluginifyAndWriteOut = function(moduleNames, out, extraOptions){
			var outputOptions = _.assign(extraOptions||{},out.output);
			var result = pluginify(moduleNames, outputOptions ),
				filePath;
			
			if(typeof out.output.dest === "string") {
				filePath = out.output.dest;
			} else {
				// pull out the moduleNames
				var loads = ( typeof moduleNames === "string" ?
					pluginify.graph[moduleNames].load :
					moduleNames.map(function(moduleName){
						return pluginify.graph[moduleName].load;
					}) );
				
				
				filePath = out.output.dest(moduleNames, modulesMap[moduleNames], loads, pluginify.loader);
			}
			winston.info("> "+filePath);
			writeFile(filePath, result);
		};
		
	var processOutput = function(out){
		winston.info("OUTPUT: "+out.name);
		
		var mods;
		// write out each module and its dependencies in the list
		if(out.output.eachModule) {
			if(Array.isArray( out.output.eachModule) ) {
				mods = out.output.eachModule;
			} else {
				mods = _.map( _.where(modules, out.output.eachModule), "moduleName");
			}
			mods.forEach(function(mod){
				pluginifyAndWriteOut(mod, out);
			});
			
		// write out the graphs
		} else if(out.output.graphs){
			if(typeof out.output.graphs === "function") {
				mods = out.output.graphs(pluginify.loader);
			} else {
				mods = out.output.graphs;
			}

			var ignores = pluginifier.getAllIgnores(out.output.ignore, pluginify.graph);
			
			eachGraph(pluginify.graph, mods, function(name, node){
				if(!pluginifier.matches(ignores, name, node.load)) {
					pluginifyAndWriteOut(name, out, {ignoreAllDependencies: true});
				}
			});
		// write out all the modules combined
		} else {
			if(Array.isArray( out.output.modules) ) {
				mods = out.output.modules;
			} else if(typeof out.output.modules === "function"){
				mods = out.output.modules(pluginify.loader);
			} else {
				mods = [out.output.modules];
			}
			pluginifyAndWriteOut(mods, out);
		}
		
	};
		
	fileWrites++;
	pluginifier(config.system, config.options).then(function(configPluginify){
		fileWrites--;
		pluginify = configPluginify;
		config.outputs.forEach(processOutput);
		
	})["catch"](function(e){
		cb(e);
	});	
	
};
