var template = require("lodash/template");

var slimPluginsPartial = `
	// delegate loading non plain JS modules to plugins
	var pluginModuleId = steal.plugins[steal.bundles[moduleId]];
	if (pluginModuleId) {
		return stealRequire(pluginModuleId)(moduleId, steal);
	}
`;

var renderProgressivePartial = function(options) {
	return options.progressive ?
		require("./progressive_loader_partial")[options.target] : "";
};

var importSlimExtensionsPartial = `
	(steal.extensions || []).forEach(function(id) {
		stealRequire(id)(stealRequire);
	});
`;

var renderMainImportPartial = function(options) {
	return `
		${options.target === "node" ? "module.exports = " : ""} ${
			options.splitLoader ?
				"stealRequire.dynamic(<%= mainModuleId  %>);" :
				"stealRequire(<%= mainModuleId  %>);"};
	`;
};

var resolveHook = {
	loaderExtension: function(options) {
		return `
			// hook into resolve to load stuff before the graph is executed
			stealRequire.resolve = function(id) {
				return Promise.resolve(id);
			};

			${options.extensions ? importSlimExtensionsPartial : ""}

			Promise.all(
				(steal.identifiersToResolve || []).map(function(id) {
					return stealRequire.resolve(id, steal).then(function(resolved) {
						resolvedIdentifiers[id] = resolved;
					});
				})
			).then(function() {
				${renderMainImportPartial(options)}
			});
		`;
	},

	stealRequireExtension: `
		if (moduleId === "@empty") {
		  return {};
		}

		if (resolvedIdentifiers[moduleId]) {
		  return stealRequire(resolvedIdentifiers[moduleId]);
		}
	`
};

module.exports = function(options) {
	return template(`
		(function(modules) {
			var modulesMap = {};
			var loadedModules = {};
			${options.resolve ? "var resolvedIdentifiers = {};" : ""}

			function addModules(mods) {
				mods.forEach(function(m) { modulesMap[m[0]] = m[1]; });
			}
			addModules(modules);

			function stealRequire(moduleId) {
				if (loadedModules[moduleId]) {
					return loadedModules[moduleId].exports;
				}

				${options.resolve ? resolveHook.stealRequireExtension : ""}

				${options.plugins ? slimPluginsPartial : ""}

				var stealModule = (loadedModules[moduleId] = {
					exports: {}
				});

				modulesMap[moduleId].call(
					stealModule.exports,
					stealRequire,
					stealModule.exports,
					stealModule
				);

				return stealModule.exports;
			}

			${renderProgressivePartial(options)}

			${options.resolve ?
				resolveHook.loaderExtension(options) :
				renderMainImportPartial(options)}
		})([
			<%= args %>
		]);
	`);
};
