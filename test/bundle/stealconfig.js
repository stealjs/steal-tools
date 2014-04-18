steal.config({
	map: {
		"app_a/app_a" : "app_a",
		"app_b/app_b" : "app_b",
		"app_c/app_c" : "app_c",
		"app_d/app_d" : "app_d"
	},
	paths: {
		"bundle.js": "bundle.js",
		"steal/dev/*" : "../../node_modules/steal/dev/*.js",
		"@traceur": "../../node_modules/traceur/bin/traceur.js"
	},
	bundle: ['app_a', 'app_b', 'app_c', 'app_d']
});


