var makeNode = require("../node/make_node"),
	minify = require("../graph/minify"),
	prettier = require("prettier");

module.exports = function(bundle, options){
	var source = prettier.format(
		`
			if(typeof process === "undefined") {
				process = { env: { NODE_ENV: "development" } };
			}
		`,
		{ useTabs: true }
	);

	var node = makeNode("[process-shim]", source);

	if(options.minify){
		minify([node]);
	}

	bundle.nodes.unshift(node);
};
