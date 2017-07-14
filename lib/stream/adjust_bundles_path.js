var through = require("through2");

module.exports = function(options) {
	return through.obj(function(data, enc, next) {
		try {
			next(null, adjustBundlesPath(data, options));
		} catch (err) {
			next(err);
		}
	});
};

function adjustBundlesPath(data, options) {
	if (options.target) {
		var path = require("path");

		// override the configuration getter for `bundlesPath` so it
		// includes the target name
		var bundlesPath = data.configuration.bundlesPath;
		Object.defineProperty(data.configuration, "bundlesPath", {
			configurable: true,
			get: function() {
				return path.join(bundlesPath, options.target);
			}
		});
	}

	return data;
}
