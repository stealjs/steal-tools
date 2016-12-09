var fs =  require('fs'),
	path = require('path');

module.exports = function(configuration){
	var stealPath = path.join(require.resolve("steal"), "/../steal");
	var stealSource = fs.readFileSync(path.join(stealPath +
			(configuration.options.minify ? ".production" : "") + ".js"), 'utf8');

	return {
		load: {
			metadata: {format: "global"},
			source: stealSource,
			name: "steal"
		},
		dependencies: [],
		deps: []
	};
};
