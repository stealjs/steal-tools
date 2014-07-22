var fs =  require('fs'),
	path = require('path');

module.exports = function(configuration){
	return {
		load: {
			metadata: {format: "global"},
			source: fs.readFileSync(path.join(__dirname,"../../node_modules/steal/steal"+
				(configuration.options.minify ? ".production" : "")+
				".js")),
			name: "steal"
		},
		dependencies: [],
		deps: []
	};
};