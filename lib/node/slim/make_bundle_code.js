var endsWith = require("lodash/endsWith");
var getNodeSource = require("../source").node;

module.exports = function(target, bundle) {
	var nodes = bundle.nodes
		.map(function(node) {
			var code = getNodeSource(node).code.toString();
			return endsWith(code, ";") ? code.substring(0, code.length - 1) : code;
		})
		.join(",");

	if (target === "node") {
		return `module.exports = [${bundle.uniqueId}, ${nodes}];`;
	} else {
		return (`
			(__steal_bundles__ = window.__steal_bundles__ || []).push([
				${ bundle.uniqueId },
				${ nodes }
			]);
		`);
	}
};
