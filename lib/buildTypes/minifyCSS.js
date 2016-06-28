var _ = require('lodash');
var CleanCSS = require('clean-css');
var dirname = require("path").dirname;

module.exports = function(bundle, options){
	var source = bundle.source;

	// default, no optimizations for css files
	// except process @import rules
	var defaultOptions = {
		advanced: false,
		aggressiveMerging: false,
		keepBreaks: true,
		processImportFrom: ['local'],
		mediaMerging: false,
		rebase: false,
		relativeTo: dirname(bundle.bundlePath),
		restructuring:false,
		roundingPrecision: -1,
		shorthandCompacting: false
	};

	if(options.minify) {
		defaultOptions = _.pick(defaultOptions, ['processImportFrom', 'relativeTo']);
	}

	var opts = defaultOptions;
	if(options && _.isArrayLikeObject(options.cleanCSSOptions)) {
		opts = _.assign(defaultOptions, options.cleanCSSOptions);
	}

	if(options.sourceMaps) {
		opts.sourceMap = source.map ? source.map+"" : true;
	}
	
	var result = new CleanCSS(opts).minify(source.code);

	return {
		code: result.styles,
		map: result.sourceMap
	};
};
