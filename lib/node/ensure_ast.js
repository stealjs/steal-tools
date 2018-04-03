var clone = require("lodash/clone");
var transformActiveSource = require("./transform_active_source");

var babylonOptions = {
	sourceType: "module",
	plugins: ["estree", "jsx", "flow", "classProperties", "objectRestSpread",
		"decorators", "asyncGenerators", "dynamicImport"]
};

module.exports = function(node, sourceKey) {
	var key = sourceKey || "create-ast";

	if(!node.load.metadata.buildType || node.load.metadata.buildType === "js") {
		var format = node.load.format;

		transformActiveSource(node, key, function(node, source){
			source = clone(source);
			var parse = require("babylon").parse;

			try {
				var ast = parse(source.code, babylonOptions);
				source.ast = ast;
			} catch(e) {
				// Bail, for now
				// TODO WARN
			}

			return source;
		});
	}
};
