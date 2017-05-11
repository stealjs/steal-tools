var template = require("lodash/template");

module.exports = template(`
(function(modules) {
	var cache = {};

	function stealRequire(moduleId) {
		if (cache[moduleId]) {
			return cache[moduleId];
		}

		var mod = cache[moduleId] = {
			exports: {}
		};

		modules[moduleId].call(mod.exports, stealRequire, mod.exports, mod);
		return mod.exports;
	}

	// import the main module
	stealRequire(<%= mainModuleId  %>);
})([
	<%= args %>
]);
`);
