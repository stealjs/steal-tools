var endsWith = require("lodash/endsWith");
var getNodeSource = require("../source").node;
var singleBundleTemplate = require("./single");
var multipleBundlesTemplate = require("./multiple");

module.exports = function(options) {
	var modules = options.modules;
	var multiple = options.multipleBundles;

	var args = modules
		.slice(0)
		.map(function(node) {
			var code = getNodeSource(node).code.toString();
			return endsWith(code, ";") ? code.substring(0, code.length - 1) : code;
		})
		.join(",");

	return (multiple ? multipleBundlesTemplate : singleBundleTemplate)({
		args: args,
		mainModuleId: options.mainModuleId
	});
};
