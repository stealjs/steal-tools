if(typeof window === "undefined" || window.noConfig !== true)  {

	steal.config({
		paths: {
			"steal/dev/*" : "../node_modules/steal/dev/*.js",
			"@traceur": "../node_modules/traceur/bin/traceur.js",
			"pathed/pathed": "basics/pathed.js"
		},
		map: {
			"mapd/mapd": "map/mapped"
		}
	});

} else {
	throw "fake loading error";
}
