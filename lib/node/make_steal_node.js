var fs =  require('fs'),
	path = require('path');

module.exports = function(){
	return {
		load: {
			metadata: {format: "global"},
			source: fs.readFileSync(path.join(__dirname,"../../node_modules/steal/steal.js")),
			name: "steal"
		},
		dependencies: [],
		deps: []
	};
};