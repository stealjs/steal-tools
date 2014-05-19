var multiBuild = require("./lib/build/multi");
var pluginify = require("./lib/build/pluginifier");

module.exports = {
	build: multiBuild,
	pluginify: pluginify
};
