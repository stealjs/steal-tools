var CleanCSS = require('clean-css');

module.exports = function(code, options){
	var opts = (options != null) ? options.cleanCSSOptions : {};
	opts = opts || {};

	return new CleanCSS(opts).minify(code);
};
