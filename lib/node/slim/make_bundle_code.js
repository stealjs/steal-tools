var endsWith = require("lodash/endsWith");
var slimBundleTemplate = require("./bundle");
var getNodeSource = require("../source").node;

module.exports = function(bundle) {
	var nodes = bundle.nodes
		.map(function(node) {
			var code = getNodeSource(node).code.toString();
			return endsWith(code, ";") ? code.substring(0, code.length - 1) : code;
		})
		.join(",");

	return slimBundleTemplate({
		bundleId: bundle.uniqueId,
		bundleNodes: nodes
	});
};
