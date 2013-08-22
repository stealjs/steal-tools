steal.config({
	root: "../",
	map: {
		"*": {
			"jquery/jquery.js" : "jquery",
			"can/util/util.js": "can/util/jquery/jquery.js"
		}
	},
	paths: {
		"can/": "lib/can/",
		"jquery/": "jquerypp/",
		"jquerypp/": "lib/jquerypp/",
		"steal/": "lib/steal/",
		"jquery": "lib/can/lib/jquery.1.9.1.js",
	},
	shim : {
		jquery: {
			exports: "jQuery"
		}
	},
	ext: {
		js: "js",
		css: "css",
		less: "steal/less/less.js",
		coffee: "steal/coffee/coffee.js",
		ejs: "can/view/ejs/ejs.js",
		mustache: "can/view/mustache/mustache.js"
	}
})