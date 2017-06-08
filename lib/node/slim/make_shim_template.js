var template = require("lodash/template");
var progressivePartial = require("./progressive_loader_partial");

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
			stealRequire(<%= mainModuleId  %>);
		})([
			<%= args %>
		]);
	`);
};
