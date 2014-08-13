var _ = require('lodash');
var	fs = require('fs-extra');
var path = require('path');
var eachGraph = require("../graph/each_dependencies");
var pluginifier = require("../build/pluginifier");
var winston = require('winston');

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
	var parts = name.match(/ ([\w\+]+)$/);
	if(parts) {
		parts[1].replace(/\+(\w+)/g,function(whole, part){
			if(defaults[part]);
			_.assign(obj, defaults[part]);
		});
	}
};


// {system: {}, options: {}, outputs: {}}
module.exports = function(config, modules, defaults, cb){
	
	// converts to an array of outputs
	config.outputs = _.map(config.outputs || config.pluginify, function(output, name){
			
		addDefaults(name, output, defaults || {});
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
		pluginifyAndWriteOut = function(moduleName, out, extraOptions){
			var result = pluginify(moduleName, _.assign(extraOptions||{},out.output) ),
				filePath;
			
			if(typeof out.output.dest === "string") {
				filePath = out.output.dest;
			} else {
				filePath = out.output.dest(moduleName, modulesMap[moduleName]);
			}
			winston.info("> "+filePath);
			writeFile(filePath, result);
		};
		
	var processOutput = function(out){
		winston.info("OUTPUT: "+out.name);
		
		if(out.output.eachModule) {
			var mods;
			if(Array.isArray( out.output.eachModule) ) {
				mods = out.output.eachModule;
			} else {
				mods = _.map( _.where(modules, out.output.eachModule), "moduleName");
			}
			mods.forEach(function(mod){
				pluginifyAndWriteOut(mod, out);
			});
		} else if(out.output.graphs){
			var mods = out.output.graphs;
			
			var ignores = pluginifier.getAllIgnores(out.output.ignore, pluginify.graph);
			
			eachGraph(pluginify.graph, mods, function(name, node){
				if(!pluginifier.matches(ignores, name)) {
					pluginifyAndWriteOut(name, out, {ignoreAllDependencies: true});
				}
			});
		} else {
			var mods;
			if(Array.isArray( out.output.modules) ) {
				mods = out.output.modules;
			} else if(out.output.modules){
				mods = _.map( _.where(modules, out.output.eachModules), "moduleName");
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
