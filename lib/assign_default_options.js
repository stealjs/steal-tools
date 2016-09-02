var assign = require("lodash").assign,
	defaults = require("lodash").defaults,
	forEach = require("lodash").forEach,
	logging = require("./logger");

module.exports = function(config, options){
	if(options.__defaultsAssigned) return options;

	defaults(options, {
		minify: true,
		bundleSteal: false,
		namedDefines: true,
		removeDevelopmentCode: true,
		uglifyOptions: {},
		cleanCSSOptions: {},
		closureCompilerOptions: {}
	});

	if(options.sourceMaps) {
		assign(config, {
			lessOptions: assign({}, options.lessOptions, {
				sourceMap: {}
			})
		});
	}

	if(options.ignore) {
		config.meta = config.meta || {};
		forEach(options.ignore, function(value){
			config.meta[value] = {
				"bundle": false
			};
		});
	}

	// Setup logging
	logging.setup(options, config);

	// Flag this so that we only run this function once
	options.__defaultsAssigned = true;

	return options;
};
