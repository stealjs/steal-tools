steal.config({
	main: "main",
	meta: {
		// https://github.com/stealjs/steal-socket.io/blob/f26e9bb9697efdd5bed22317cbb1a2e9aadcd6f3/package.json#L50-L55
		"dep": {
			format: "global",
			exports: "io"
		}
	}
});
