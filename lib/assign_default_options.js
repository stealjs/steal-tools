var assign = require("lodash").assign,
	logging = require("./logger");

module.exports = function(config, options){
	if(options.__defaultsAssigned) return options;

	options = assign({ // Defaults
		minify: true,
		bundleSteal: false,
		uglifyOptions: {},
		cleanCSSOptions: {},
		removeDevelopmentCode: true,
		namedDefines: true
	}, options);

	if(options.sourceMaps) {
		assign(config, {
			lessOptions: assign({}, options.lessOptions, {
				sourceMap: {}
			})
		});
	}

	// Setup logging
	logging.setup(options, config);

	// Flag this so that we only run this function once
	options.__defaultsAssigned = true;

	return options;
};
