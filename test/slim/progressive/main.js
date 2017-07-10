var bar = require("./bar");

bar();

steal.import("baz").then(function(baz) {
	console.log("baz loaded");
	baz();
});
