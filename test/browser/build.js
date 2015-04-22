var stealTools = require("../../index");

stealTools.build({
	configMain: "@empty",
	main: "worker",
	baseUrl: __dirname + "/webworker"
}, {
	bundleSteal: true
});