module.exports = function(moduleId, slimConfig) {
	window.bundleAddress = slimConfig.paths[slimConfig.bundles[moduleId]];
};
