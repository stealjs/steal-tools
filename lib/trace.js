var steal = require('steal'),
	traceur = require('traceur');

function throwError(e) {
	setTimeout(function(){
		throw e;
	},1);
}

function traverse(object, iterator, parent, parentProperty) {
  var key, child;
  if (iterator(object, parent, parentProperty) === false)
    return;
  for (key in object) {
    if (!object.hasOwnProperty(key))
      continue;
    if (key == 'location' || key == 'type')
      continue;
    child = object[key];
    if (typeof child == 'object' && child !== null)
      traverse(child, iterator, object, key);
  }
}

// given a syntax tree, return the import list
function getImports(moduleTree) {
  var imports = [];

  function addImport(name) {
    if ([].indexOf.call(imports, name) == -1)
      imports.push(name);
  }

  traverse(moduleTree, function(node) {
    // import {} from 'foo';
    // export * from 'foo';
    // export { ... } from 'foo';
    // module x from 'foo';
    if (node.type == 'EXPORT_DECLARATION') {
      if (node.declaration.moduleSpecifier)
        addImport(node.declaration.moduleSpecifier.token.processedValue);
    }
    else if (node.type == 'IMPORT_DECLARATION')
      addImport(node.moduleSpecifier.token.processedValue);
    else if (node.type == 'MODULE_DECLARATION')
      addImport(node.expression.token.processedValue);
  });
  return imports;
}

function getESModuleImports(load){
	load.address = load.address || 'anon' + ++anonCnt;
    var parser = new traceur.syntax.Parser(new traceur.syntax.SourceFile(load.address, load.source));
    var body = parser.parseModule();
    return getImports(body);
}



var trace = function(System, BuildSystem, onFulfilled, onRejected){
	System.pluginLoader = BuildSystem;
	
	// We might need to include the source of the plugin
	var buildLoads = {};
	var buildInstantiate = BuildSystem.instantiate;
	BuildSystem.instantiate = function(load){
		buildLoads[load.name] = load;
		return buildInstantiate.apply(this, arguments);
	};
	
	// O
	var systemInstantiate = System.instantiate;
	System.instantiate = function(load){
		var plugin = load.metadata.plugin,
			includeInBuild = plugin && plugin.includInBuild,
			pluginName;
		if( includeInBuild ) {
			pluginName = load.metadata.pluginName;
			// TODO: this should be made to support `includInBuild` plugins with dependencies.
			onFulfilled(buildLoads[pluginName], []);
		}
		
		var res = systemInstantiate.apply(this, arguments);
		return Promise.resolve(res).then(function(instantiateResult){
			
			if(!instantiateResult) {
				var imports = getESModuleImports(load);
				if( includeInBuild ) {
					imports.push(pluginName);
				}
				onFulfilled(load, imports );
				return {
					deps: imports,
					execute: function(){
						return new System.global.Module({});
					}
				};
			} else {
				if( includeInBuild ) {
					instantiateResult.deps.push(pluginName);
				}
				onFulfilled(load, instantiateResult.deps);
				
				if(load.name === "stealconfig") {
					return instantiateResult;
				} else {
					return {
							deps: instantiateResult.deps,
							execute: function(){
								return new System.global.Module({});
							}
						};
					}
				}
			
		}, onRejected)["catch"](throwError);
		
	};
};

module.exports = trace;