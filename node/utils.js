var fs = require('fs');

/*
 * Stubs Rhino's readFile function.
 */
readFile = function(){
	return fs.readFileSync.apply(fs, arguments).toString();
};
