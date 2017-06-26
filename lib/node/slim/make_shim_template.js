var template = require("lodash/template");
var progressivePartial = require("./progressive_loader_partial");

var slimPluginsPartial = `
	// delegate loading non plain JS modules to plugins
	var pluginModuleId = steal.plugins[steal.bundles[moduleId]];
	if (pluginModuleId) {
		return stealRequire(pluginModuleId)(moduleId, steal);
	}
`;

module.exports = function(options) {
	return template(`
		(function(modules) {
			var modulesMap = {};
			var loadedModules = {};

			function addModules(mods) {
				mods.forEach(function(m) { modulesMap[m[0]] = m[1]; });
			}
			addModules(modules);

			function stealRequire(moduleId) {
				if (loadedModules[moduleId]) {
					return stealRequire.esm(loadedModules[moduleId].exports);
				}

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

				return stealRequire.esm(stealModule.exports);
			}

			stealRequire.esm = function(stealExports) {
				return stealExports && stealExports.__esModule ?
					stealExports.default : stealExports;
			};

			${options.progressive ? progressivePartial : ""}

			// import the main module
			${options.splitLoader ?
				"stealRequire.dynamic(<%= mainModuleId  %>);" :
				"stealRequire(<%= mainModuleId  %>);"}
		})([
			<%= args %>
		]);
	`);
};
