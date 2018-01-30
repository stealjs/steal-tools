var steal = require("@steal");

// fake plugin to register the dynamic import below
require("./template.plug!plug");

steal.import("./app_a")
	.then(function(appA) {
		self.postMessage(appA);
	});