var template = require("lodash/template");

module.exports = template(`
(function(modules) {
	var loadedModules = {};

	var modulesMap = {};
	modules.forEach(function(m) { modulesMap[m[0]] = m[1]; });

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

	// import the main module
	stealRequire(<%= mainModuleId  %>);
})([
	<%= args %>
]);
`);
