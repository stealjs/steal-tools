var through = require("through2");

// individual checks/rules for slim builds
var checkStealAndLoader = require("../slim/checks/steal_and_loader");
var checkStealConditional = require("../slim/checks/steal_conditional");
var checkProductionEnvConfig = require("../slim/checks/production_env_config");
var checkCircularDependencies = require("../slim/checks/circular_dependencies");

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

	checkStealAndLoader(configMain, data.graph);
	checkStealConditional(data.graph[configMain]);
	checkProductionEnvConfig(data.steal);
	checkCircularDependencies(data.graph);

	return data;
}
