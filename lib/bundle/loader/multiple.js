var template = require("lodash/template");

module.exports = template(`
(function(modules) {
  var resolves = [];
  var loadedBundles = {};
  var loadedModules = {};

  // bundles would push to this array during eval
  __steal_bundles__ = window.__steal_bundles__ || [];

  var LOADED = 0;
  var SCRIPT_TIMEOUT = 120000;

  // register bundles executed before the main bundle finished loading
  __steal_bundles__.forEach(function(bundle) {
    var bundleId = bundle[0];
    var bundleModules = bundle[1];

    Object.keys(bundleModules).forEach(function(moduleId) {
      modules[moduleId] = bundleModules[moduleId];
    });

    loadedBundles[bundleId] = LOADED;
  });

  // handle bundles loading after main has loaded
  __steal_bundles__.push = function(bundle) {
    var bundleId = bundle[0];
    var bundleModules = bundle[1];

    if (loadedBundles[bundleId]) {
      resolves.push(loadedBundles[bundleId].resolve);
      loadedBundles[bundleId] = LOADED;
    }

    Object.keys(bundleModules).forEach(function(moduleId) {
      modules[moduleId] = bundleModules[moduleId];
    });

    // resolve each promise, first in first out
    while (resolves.length) resolves.shift()();
    return Array.prototype.push.call(this, bundle);
  };

  function makeScript() {
    var script = document.createElement("script");

    script.type = "text/javascript";
    script.charset = "utf-8";
    script.async = true;
    script.timeout = SCRIPT_TIMEOUT;

    return script;
  }

  function makeDeferred() {
    var def = Object.create(null);

    def.promise = new Promise(function(resolve, reject) {
      def.resolve = resolve;
      def.reject = reject;
    });

    return def;
  }

  function stealRequire(moduleId) {
    if (loadedModules[moduleId]) {
      return loadedModules[moduleId];
    }

    var mod = (loadedModules[moduleId] = {
      exports: {}
    });

    modules[moduleId].call(mod.exports, stealRequire, mod.exports, mod);
    return mod.exports;
  }

  function getBundleScript(src) {
    var len = document.scripts.length;

    for (var i = 0; i < len; i += 1) {
      var script = document.scripts[i];

      if (script.src.indexOf(src) !== -1) {
        return script;
      }
    }
  }

  stealRequire.dynamic = function(bundleId) {
    if (loadedBundles[bundleId] === LOADED) {
      return Promise.resolve();
    }

    // the bundle is loading, return its promise
    if (loadedBundles[bundleId]) {
      return loadedBundles[bundleId].promise;
    }

    // add deferred to the bundles cache
    var deferred = makeDeferred();
    loadedBundles[bundleId] = deferred;

    // check in case the bundle is being loaded using a script tag
    var script = getBundleScript(steal.paths[bundleId]);
    var scriptAttached = true;

    // load the bundle using a script tag otherwise
    if (!script) {
      script = makeScript();
      script.src = steal.paths[bundleId];
      scriptAttached = false;
    }

    var head = document.getElementsByTagName("head")[0];
    var timeout = setTimeout(onScriptLoad, SCRIPT_TIMEOUT);

    function onScriptLoad() {
      // avoid memory leaks in IE.
      script.onerror = script.onload = null;
      clearTimeout(timeout);

      var bundle = loadedBundles[bundleId];
      if (bundle !== LOADED) {
        if (bundle) {
          bundle.reject(new Error("Failed to load bundle with id: " + bundleId));
        }
        loadedBundles[bundleId] = undefined;
      }
    }

    if (!scriptAttached) head.appendChild(script);
    return deferred.promise;
  };

  // import the main module
  stealRequire(<%= mainModuleId  %>);
})([
	<%= args %>
]);
`);
