var denodeify = require("pdenodeify");
var fs = require("fs");

/**
 * Check if the file path exists
 * @param {string} path The file path
 * @return {Promise} Resolves if the file exists, rejects otherwise.
 */
module.exports = function exists(path) {
	return denodeify(fs.access)(path, fs.F_OK);
};
