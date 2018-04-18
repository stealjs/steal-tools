var through = require("through2");
var prune = require("../graph/prune");
var treeshake = require("../graph/treeshake");
var moduleSpecifierFromName = require("../node/dependency_resolver").moduleSpecifierFromName;

module.exports = function() {
	return through.obj(function(data, enc, next) {
		var options = data.options;

		if(options.treeShaking === false) {
			next(null, data);
			return;
		}

		//options.normalize = hookNormalize(data);

		treeshake(data, options)
		.then(function(){
			prune(data);
			next(null, data);
		})
		.catch(next);
	});
};

function hookNormalize(data) {
	var opts = data.options;

	var getNode = id => data.graph[id];
	var givenNormalize = opts.normalize || (name => name);

	return function(name, depLoad, curName) {
		if(name.startsWith("./") && curName) {
			var moduleName = name.substr(2);
			var node = getNode(curName);

			if(!node) {
				return name;
			}

			var specifier = moduleSpecifierFromName(node, moduleName);
			return specifier || moduleName;
		}
		return givenNormalize.apply(this, arguments);
	};
}
