var defaultTo = require("lodash/defaultTo");
var isEmpty = require("lodash/isEmpty");

/**
 * Checks whether there is "window-production" specific config
 * @param {Object} steal - The steal instance on the stream buildResult object
 * @throws if "window-production" config is set to steal
 */
module.exports = function checkProductionEnvConfig(steal) {
	var envs = defaultTo(steal.config("envs"), {});

	if (!isEmpty(envs["window-production"])) {
		throw new Error(
			`Cannot create slim build. "window-production" config is not supported`
		);
	}
};
