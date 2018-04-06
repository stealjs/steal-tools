var through = require("through2");
var treeshake = require("../graph/treeshake");

module.exports = function() {
	return through.obj(function(data, enc, next) {
		try {
			var options = data.options;

			if(options.treeShaking === false) {
				next(null, data);
				return;
			}

			var graph = data.graph;
			treeshake(data/*graph*/, options)
			.then(function(){
				next(null, data);
			})
			.catch(next);

		} catch (err) {
			next(err);
		}
	});
};
