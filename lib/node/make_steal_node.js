var fs =  require("fs");
var path = require("path");

module.exports = function() {
	var stealPath = path.join(require.resolve("steal"), "..", "steal");
	var stealSource = fs.readFileSync(path.join(stealPath + ".js"), "utf8");

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
