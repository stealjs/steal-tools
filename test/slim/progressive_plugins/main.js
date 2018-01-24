var steal = require("@steal");

require("~/app.css!");

steal.import("~/app.css!")
	.then(function() {
		console.log("done");
	});
