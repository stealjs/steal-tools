var UglifyJS = require("uglify-js");


module.exports = function(code){
	return UglifyJS.minify(code,{fromString: true}).code;
};
