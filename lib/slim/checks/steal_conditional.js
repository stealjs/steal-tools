var some = require("lodash/some");
var includes = require("lodash/includes");

/**
 * Checks whether configMain loads steal-conditional
 * @param {Object} configMain - The configMain node from the graph
 * @throws if configMain loads steal-conditional
 */
module.exports = function(configMain) {
	if (configMain && dependsOnStealConditional(configMain)) {
		throw new Error(
			`Cannot create slim build. "steal-conditional" is not supported`
		);
	}
};

function dependsOnStealConditional(configMain) {
	return some(configMain.dependencies, function(depName) {
		return includes(depName, "steal-conditional/conditional");
	});
}
