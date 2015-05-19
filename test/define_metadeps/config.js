var loader = require("@loader");

loader.config({
	map: {
		"b" : "other"
	},

	meta: {
		global: {
			deps: [ "b" ],
			exports: "GLOBAL"
		}
	}
});
