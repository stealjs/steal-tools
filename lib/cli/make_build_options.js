var clone = require("lodash/clone");
var omitBy = require("lodash/omitBy");
var compact = require("lodash/compact");
var includes = require("lodash/includes");
var commandOptions = require("./options");

/**
 * Convert the arv into a BuildOptions object
 * @param {Object} argv Command arguments provided by yargs
 * @return {BuildOptions} The build options object
 */
module.exports = function(argv) {
	var options = clone(argv);

	if (options.noMinify) {
		options.minify = false;
	}

	// if no explicit value was set, default it to true unless watch mode is used
	if (options.minify == null) {
		options.minify = options.watch ? false : true;
	}

	var aliases = compact(Object.keys(commandOptions).map(function(o) {
		return commandOptions[o].alias;
	}));

	return omitBy(options, function(value, key) {
		return includes(aliases, key) || includes(key, "-");
	});
};
