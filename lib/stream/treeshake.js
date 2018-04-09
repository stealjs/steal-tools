var through = require("through2");
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
			next(null, data);
		})
		.catch(next);
	});
};
