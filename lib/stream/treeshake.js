var through = require("through2");
var treeshake = require("../graph/treeshake");

module.exports = function() {
	return through.obj(function(data, enc, next) {
		try {
			var options = data.options;
			var graph = data.graph;
			treeshake(graph, options);
			next(null, data);
		} catch (err) {
			next(err);
		}
	});
};
