module.exports = {
	node: `
		var LOADED = 0;
		var loadedBundles = {};
		stealRequire.dynamic = function(rawModuleId) {
			var moduleId = steal.map[rawModuleId] || rawModuleId;
			var bundleId = steal.bundles[moduleId];

			if (!bundleId) {
				throw new Error("Missing bundle for module with id: " + moduleId);
			}

			if (loadedBundles[bundleId] !== LOADED) {
				var bundle = require("./" + steal.paths[bundleId]);

				addModules(bundle.slice(1));
				loadedBundles[bundleId] = LOADED;
			}

			return Promise.resolve(stealRequire(moduleId));
		};
	`,

	worker: `
		// extends the loader to support progressive/async loading
		var LOADED = 0;
		var loadedBundles = {};

		// bundles are pushed to this array during eval
		__steal_bundles__ = self.__steal_bundles__ || [];

		// register bundles executed before the main bundle finished loading
		__steal_bundles__.forEach(function(bundle) {
			var bundleId = bundle[0];
			var bundleModules = bundle.slice(1);

			addModules(bundleModules);
			loadedBundles[bundleId] = LOADED;
		});

		// handle bundles loading after main has loaded
		__steal_bundles__.push = function(bundle) {
			var bundleId = bundle[0];
			var bundleModules = bundle.slice(1);

			loadedBundles[bundleId] = LOADED;
			addModules(bundleModules);

			return Array.prototype.push.call(this, bundle);
		};

		stealRequire.dynamic = function(rawModuleId) {
			var moduleId = steal.map[rawModuleId] || rawModuleId;
			var bundleId = steal.bundles[moduleId];

			if (!bundleId) {
				throw new Error(
					"Missing bundle for module with id: " + moduleId
				);
			}

			if (loadedBundles[bundleId] !== LOADED) {
				self.importScripts("./" + steal.paths[bundleId]);
			}

			return Promise.resolve(stealRequire(moduleId));
		};
	`,

	web: `
		// extends the loader to support progressive/async loading
		var LOADED = 0;
		var resolves = [];
		var loadedBundles = {};
		var SCRIPT_TIMEOUT = 120000;

		// bundles are pushed to this array during eval
		__steal_bundles__ = window.__steal_bundles__ || [];

		// register bundles executed before the main bundle finished loading
		__steal_bundles__.forEach(function(bundle) {
			var bundleId = bundle[0];
			var bundleModules = bundle.slice(1);

			addModules(bundleModules);
			loadedBundles[bundleId] = LOADED;
		});

		// handle bundles loading after main has loaded
		__steal_bundles__.push = function(bundle) {
			var bundleId = bundle[0];
			var bundleModules = bundle.slice(1);

			if (loadedBundles[bundleId]) {
				resolves.push(loadedBundles[bundleId].resolve);
			}

			loadedBundles[bundleId] = LOADED;
			addModules(bundleModules);

			// resolve each promise, first in first out
			while (resolves.length)
				resolves.shift()();
			return Array.prototype.push.call(this, bundle);
		};

		stealRequire.dynamic = function(rawModuleId) {
			var moduleId = steal.map[rawModuleId] || rawModuleId;
			var bundleId = steal.bundles[moduleId];

			if (!bundleId) {
				throw new Error("Missing bundle for module with id: " + moduleId);
			}

			// if the bundle has been loaded already,
			// return a promise that resolves to the module being imported
			if (loadedBundles[bundleId] === LOADED) {
				return Promise.resolve(stealRequire(moduleId));
			}

			// the bundle is loading, return its promise
			if (loadedBundles[bundleId]) {
				return loadedBundles[bundleId].promise.then(function() {
					return stealRequire(moduleId);
				});
			}

			// add deferred to the bundles cache
			var deferred = makeDeferred();
			loadedBundles[bundleId] = deferred;

			// check if the bundle is being loaded using a script tag
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
						bundle.reject(
							new Error("Failed to load bundle with id: " + bundleId)
						);
					}
					loadedBundles[bundleId] = undefined;
				}
			}

			if (!scriptAttached) head.appendChild(script);
			return deferred.promise.then(function() {
				return stealRequire(moduleId);
			});
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

		function getBundleScript(src) {
			var len = document.scripts.length;

			for (var i = 0; i < len; i += 1) {
				var script = document.scripts[i];

				if (script.src.indexOf(src) !== -1) {
					return script;
				}
			}
		}
	`
};
