var through = require("through2");
var prune = require("../graph/prune");
var treeshake = require("../graph/treeshake");

module.exports = function() {
	return through.obj(function(data, enc, next) {
		var options = data.options;

		if(options.treeShaking === false) {
			next(null, data);
			return;
		}

		treeshake(data, options)
		.then(function(){
			prune(data);
			next(null, data);
		})
		.catch(next);
	});
};
