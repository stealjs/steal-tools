var winston = require("winston");
var stealTools = require("../../index");
var clone = require("lodash/cloneDeep");
var options = clone(require("./options"));
var makeSystem = require("./make_system");

module.exports = {
	command: "build",

	describe: "Build a module and all of its dependencies",

	builder: options,

	handler: function(argv) {
		var options = argv;
		var system = makeSystem(argv);

		var promise = stealTools.build(system, options);

		// If this is watch mode this is actually a stream.
		if (promise.then) {
			promise.then(function() {
				winston.info("\nBuild completed successfully".green);
			});
		}
	}
};
