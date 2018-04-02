"format cjs";
var loader = require("@loader");

var localLoader = loader.localLoader || loader;
if (localLoader.slimConfig) {
	localLoader.slimConfig.toMap.push("./app_a");
}

module.exports = {
	translate: function translate(load) {
		return `
			define(function() {
				return ${load.source};
			});
		`;
	}
};