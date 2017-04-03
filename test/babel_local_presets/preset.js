module.exports = function(context, opts) {
	return {
		plugins: [
			[ require("babel-plugin-steal-test"), { text: opts.text }]
		]
	};
};
