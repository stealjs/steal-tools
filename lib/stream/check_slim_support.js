var through = require("through2");

// individual checks/rules for slim builds
var checkAtSteal = require("../slim/checks/steal");
var checkStealConditional = require("../slim/checks/steal_conditional");

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
	var configMain = data.loader.configMain || "package.json!npm";

	checkAtSteal(configMain, data.graph);
	checkStealConditional(data.graph[configMain]);

	return data;
}
