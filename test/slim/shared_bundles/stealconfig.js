var loader = require("@loader");

loader.config({
	main: "main",
	bundle: ["app_a", "app_b"]
});
