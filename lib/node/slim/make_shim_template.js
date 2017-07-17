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
					return loadedModules[moduleId].exports;
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

			${renderProgressivePartial(options)}

			// import the main module
			${options.target === "node" ? "module.exports = " : ""} ${
				options.splitLoader ?
					"stealRequire.dynamic(<%= mainModuleId  %>);" :
					"stealRequire(<%= mainModuleId  %>);"}
		})([
			<%= args %>
		]);
	`);
};
