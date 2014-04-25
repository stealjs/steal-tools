var CleanCSS = require('clean-css');


module.exports = function(code){
	return new CleanCSS().minify(code);
};
