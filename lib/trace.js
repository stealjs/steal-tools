var getESModuleImports = require("./load/get_es_module_imports");

function throwError(e) {
	setTimeout(function(){
		throw e;
	},1);
}

var trace = function(System, BuildSystem, onFulfilled, onRejected){

	System.pluginLoader = BuildSystem;
	
	// The BuildSystem loader will execute modules, but wait for the value to come through
	var buildInstantiate = BuildSystem.instantiate;
	BuildSystem.instantiate = function(load){
		
		var res = buildInstantiate.apply(this, arguments),
			deps;
		
		// Get the deps
		Promise.resolve(res).then(function(instantiateResult){
			if(!instantiateResult) {
				deps = getESModuleImports(load);
			} else {
				deps = instantiateResult.deps ? instantiateResult.deps.slice(0) : [];
			}
		},onRejected);

		// Get the value of the plugin (this will let us check for includeInBuild)
		BuildSystem.import(load.name).then(function(pluginValue){
			onFulfilled(load, deps, pluginValue);
		}, function(err){
			console.log("\n\nSOMETHING WENT WRONG", err);
		});
		
		return res;
		
	};
	
	// O
	var systemInstantiate = System.instantiate;
	System.instantiate = function(load){
		// Figure out if there's a plugin
		var pluginName = load.metadata.pluginName;

		var res = systemInstantiate.apply(this, arguments);

		return Promise.resolve(res).then(function fullfill(instantiateResult){
			// If the config is a global mark it as cjs so that it will be converted
			// to AMD by transpile. Needed because of this bug:
			// https://github.com/ModuleLoader/es6-module-loader/issues/231
			if(load.name === System.configMain && load.metadata.format === "global") {
				load.metadata.format = "cjs";
			}

			if(!instantiateResult) {
				var imports = getESModuleImports(load);
				onFulfilled(load, pluginName ? imports.concat(pluginName) : imports.slice(0) );

				if(load.name === System.configMain) {
					return;
				} else {
					return {
						deps: imports,
						execute: emptyExecute
					};
				}
			} else {
				onFulfilled(load, pluginName ? instantiateResult.deps.concat(pluginName) : instantiateResult.deps.slice(0) );
				
				if(load.name === System.configMain) {
					return instantiateResult;
				} else {
					return {
							deps: instantiateResult.deps,
							execute: emptyExecute
						};
					}
				}
			
		}, onRejected)["catch"](throwError);
	};
	
	var emptyExecute = function(){
		return new System.newModule({});
	};
};

module.exports = trace;

