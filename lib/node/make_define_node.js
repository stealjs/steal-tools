

var makeDefine = function(global) {
  

  function prepareDeps(deps, meta) {
    for (var i = 0; i < deps.length; i++)
      if (deps.lastIndexOf(deps[i]) != i)
        deps.splice(i--, 1);

    // remove system dependencies
    var index;
    if ((index = deps.indexOf('require')) != -1) {
      meta.requireIndex = index;
      deps.splice(index, 1);
    }
    if ((index = deps.indexOf('exports')) != -1) {
      meta.exportsIndex = index;
      deps.splice(index, 1);
    }
    if ((index = deps.indexOf('module')) != -1) {
      meta.moduleIndex = index;
      deps.splice(index, 1);
    }

    return deps;
  }
  function makeRequire(parentName, deps, depsNormalized) {
    return function(names, callback, errback) {
      if (typeof names == 'string' && deps.indexOf(names) != -1) {
      	return loader.getModule(depsNormalized[deps.indexOf(names)]);
      }
      return require(names, callback, errback, { name: parentName });
    };
  }
  function prepareExecute(depNames, load) {
    var meta = load.metadata;
    var deps = [];
    for (var i = 0; i < depNames.length; i++) {
      var module = loader.get(depNames[i]);
      if (module.__useDefault) {
        module = module['default'];
      }
      else if (!module.__esModule) {
        // compatibility -> ES6 modules must have a __esModule flag
        // we clone the module object to handle this
        var moduleClone = { __esModule: true };
        for (var p in module)
          moduleClone[p] = module[p];
        module = moduleClone;
      }
      deps[i] = module;
    }

    var module, exports;

    // add back in system dependencies
    if (meta.moduleIndex !== undefined)
      deps.splice(meta.moduleIndex, 0, exports = {}, module = { id: load.name, uri: load.address, config: function() { return {}; }, exports: exports });
    if (meta.exportsIndex !== undefined)
      deps.splice(meta.exportsIndex, 0, exports = exports || {});
    if (meta.requireIndex !== undefined)
      deps.splice(meta.requireIndex, 0, makeRequire(load.name, meta.deps, depNames));

    return {
      deps: deps,
      module: module || exports && { exports: exports }
    };
  }


  return function(name, _deps, factory) {
      	
        if (typeof name != 'string') {
          factory = _deps;
          _deps = name;
          name = null;
        }

        if (!(_deps instanceof Array)) {
          factory = _deps;
          // CommonJS AMD form
          var load = {
          	source: factory.toString(),
          	metadata: {},
          	name: name
          };
          _deps = ['require', 'exports', 'module'].concat(System.format.cjs.deps(load, window));
        }
        
        if (typeof factory != 'function')
          factory = (function(factory) {
            return function() { return factory; }
          })(factory);
        
        if ( name ) {
          // named define for a bundle describing another module
          var _load = {
            name: name,
            address: name,
            metadata: {}
          };
          _load.metadata.deps = _deps = prepareDeps(_deps, _load.metadata);
          
          System.defined[name] = {
            deps: _deps,
            execute: function() {
              var execs = prepareExecute(Array.prototype.splice.call(arguments, 0, arguments.length), _load);
              var output = factory.apply(global, execs.deps) || execs.module && execs.module.exports;

              if (output instanceof global.Module)
                return output;
              else
                return System.newModule(output && output.__esModule ? output : { __useDefault: true, 'default': output });
            }
          };
        }
      };
};



module.exports = function(){
	return {
		load: {
			metadata: {format: "global"},
			source: "window.define = ("+makeDefine.toString()+")(window);",
			name: "define"
		},
		dependencies: [],
		deps: []
	};
};

