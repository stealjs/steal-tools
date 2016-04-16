var path = require("path");
var multiBuild = require("../../../lib/build/multi");

var config = {
	config: path.join(__dirname, "package.json!npm"),
};

multiBuild(config)
	.then(function() {
		console.log("\n Success! \n");
	})
	.catch(function(error) {
		console.log("Uh-oh, there was an error", error);
	});
