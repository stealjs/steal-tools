var through = require("through2");
var isEmpty = require("lodash/isEmpty");
var defaultTo = require("lodash/defaultTo");
var checkGraphSupport = require("../graph/check_slim_support");

module.exports = function() {
	return through.obj(function(data, enc, done) {
		try {
			done(null, checkSupport(data));
		} catch (err) {
			done(err);
		}
	});
};

function checkSupport(data) {
	checkConfigSupport(data.steal);

	checkGraphSupport(data.loader.configMain || "package.json!npm", data.graph);

	return data;
}

/**
 * Throws if "window-production" config is set to steal
 * @param {Object} steal
 */
function checkConfigSupport(steal) {
	var envs = defaultTo(steal.config("envs"), {});

	if (!isEmpty(envs["window-production"])) {
		throw new Error(
			`Cannot create slim build. "window-production" config is not supported`
		);
	}
}
