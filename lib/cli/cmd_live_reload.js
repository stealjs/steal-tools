var _assign = require("lodash/assign");
var clone = require("lodash/cloneDeep");
var makeSystem = require("./make_system");
var options = clone(require("./options"));
var liveReload = require("../stream/live");

module.exports = {
	command: "live-reload",

	builder: _assign({}, options, {
		"live-reload-port": {
			type: "string",
			default: 8012,
			describe: "Specify a port to use for the websocket server"
		}
	}),

	describe: "Start a live-reload Web Socket server",

	handler: function(argv) {
		var options = argv;
		var system = makeSystem(argv);

		options.liveReload = true;
		liveReload(system, options);
	}
};
