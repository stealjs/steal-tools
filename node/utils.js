var fs = require('fs');

/*
 * Reference to `slice`
 */
var slice = Array.prototype.slice;

/*
 * Stubs Rhino's readFile function.
 */
exports.readFile = function(){
	return fs.readFileSync.apply(fs, arguments).toString();
};
