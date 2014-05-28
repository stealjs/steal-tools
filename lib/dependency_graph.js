var trace = require("./trace");
var steal = require("steal");


module.exports = function(config){
	
	var localSteal =  steal.clone( steal.addFormat( steal.System.clone() ) );
	localSteal.config(config);
	
	var graph = {},
		depPromises = [],
		graphPromise = new Promise();
	
	trace(localSteal.System, function(load, deps){
		
		var loadNode = graph[load.name] = {};
		loadNode.load = load;
		
		loadNode.deps = deps;
		
		var depPromise = Promise.all(deps.map(function(dep){
			return Promise.resolve( localSteal.System.normalize(dep, load.name, load.address) );
		})).then(function(dependencies){
			loadNode.dependencies = dependencies;
		}, function(){
			console.log("unable to resolve dependency");
		});
		depPromises.push(depPromise);
	});
	global.steal = localSteal;
	var appPromise = localSteal.startup();
	
	
	
	return appPromise.then(function(){
		return Promise.all(depPromises).then(function(){
			return graph;
		});
	}, function(e){
		setTimeout(function(){
			throw e
		}, 1);
	});
};
