var singleBundleLoader = require("./loader/single");
var multipleBundlesLoader = require("./loader/multiple");

module.exports = function(options) {
	var modules = options.modules;
	var multiple = options.multipleBundles;

	var args = modules
		.slice(0)
		.map(function(node) {
			var code = node.code.toString();
			return code.slice(0, code.length - 1); // remove the trailing `;`
		})
		.join(",");

	return (multiple ? multipleBundlesLoader : singleBundleLoader)({
		args: args,
		mainModuleId: options.mainModuleId
	});
};
