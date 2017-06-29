var bar = require("./bar");

bar();

setTimeout(
	function() {
		steal.import("baz").then(function(baz) {
			console.log("baz loaded");
			baz();
		});
	},
	100
);
