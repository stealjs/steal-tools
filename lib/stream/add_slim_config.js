var through = require("through2");
var makeSlimConfigNode = require("../node/make_slim_config_node");

module.exports = function() {
	return through.obj(function(data, enc, next) {
		try {
			next(null, addSlimConfig(data));
		} catch (err) {
			next(err);
		}
	});
};

function addSlimConfig(data) {
	var mainBundle = data.bundles[0];

	mainBundle.nodes.unshift(makeSlimConfigNode(data.bundles));

	return data;
}
