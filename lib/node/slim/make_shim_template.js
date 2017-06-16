var template = require("lodash/template");
var progressivePartial = require("./progressive_loader_partial");

var slimPluginsPartial = `
	// delegate loading non plain JS modules to plugins
	if (steal.plugins[moduleId]) {
		return stealRequire(steal.plugins[moduleId])(moduleId, steal);
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
					return loadedModules[moduleId];
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

				return stealModule.exports;
			}

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
