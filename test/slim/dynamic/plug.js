"format cjs";
var loader = require("@loader");
var local = loader.localLoader || loader;

if (local.slimConfig) {
	local.slimConfig.needsDynamicLoader = true;
}

exports.translate = function plug(load) {
	return `
		define(function() {
			return ${load.source};
		});
	`;
};
