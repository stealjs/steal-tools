var winston = require("winston");
var stealTools = require("../../index");
var makeStealConfig = require("./make_steal_config");
var makeBuildOptions = require("./make_build_options");

var clone = require("lodash/cloneDeep");
var options = clone(require("./options"));

// turns off default minification because its value is conditional
// keeping it `true` by default makes it impossible to tell whether
// the user explicitly passed `--watch`
options.minify.default = false;

module.exports = {
	command: ["build", "*"], // `*` makes this the default command

	describe: "Build a module and all of its dependencies",

	builder: options,

	handler: function(argv) {
		var promise = stealTools.build(
			makeStealConfig(argv),
			makeBuildOptions(argv)
		);

		// If this is watch mode this is actually a stream.
		if (promise.then) {
			return promise.then(function() {
				winston.info("\nBuild completed successfully".green);
			}, function(e) {
				// since this is a library we should throw an exception, and
				// because it remains uncaught, will exit the node process with
				// and exit code greater than 0
				if (typeof e === "string") { e = new Error(e); }
				winston.error(e.message.red);
				winston.error("\nBuild failed".red);

				process.exit(1);
			});
		}
	}
};
