steal.config({
	main: "main",
	meta: {
		jquery: {
			format: "global",
			exports: "jQuery"
		},
		"jquery-plugin": {
			format: "global",
			deps: ["./jquery"],
			exports: "jQuery"
		}
	}
});
