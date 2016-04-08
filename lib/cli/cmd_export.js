var winston = require("winston");
var _assign = require("lodash/assign");
var stealTools = require("../../index");
var _clone = require("lodash/cloneDeep");
var makeSystem = require("./make_system");
var options = _clone(require("./options"));
var makeOutputs = require("./make_outputs");

module.exports = {
	command: "export",

	builder: _assign({}, options, {
		cjs: {
			type: "boolean",
			describe: "Sets default +cjs output"
		},
		amd: {
			type: "boolean",
			describe: "Sets default +amd output"
		},
		global: {
			type: "boolean",
			describe: "Sets default +global-js and +global-css outputs"
		},
		all: {
			type: "boolean",
			describe: "Sets outputs to +cjs, +amd, +global-js, and +global-css"
		}
	}),

	describe: "Export a project's modules to other forms and formats declaratively",

	handler: function(argv) {
		var options = argv;
		var system = makeSystem(argv);
		var outputs = makeOutputs(options);

		var promise = stealTools.export({
			system: system,
			options: options,
			outputs: outputs
		});

		return promise.then(function() {
			winston.info("\nExport completed successfully".green);
		});
	}
};
