var path = require("path");
var fs = require("fs-extra");
var colors = require("colors");
var range = require("lodash/range");
var gzipSize = require("gzip-size");
var denodeify = require("pdenodeify");
var includes = require("lodash/includes");

var readFile = denodeify(fs.readFile);
var writeFile = denodeify(fs.writeFile);

// the bundle size might change depending on the platformat used to create it,
// the offset is to account for these differences
var sizeOffset = 5;

/**
 * Validates bundle size snapshot or creates it if missing
 * @param {string} bundle - The path to the bundle to be checked
 * @param {string} dest - The path to the folder where the snapshot is located
 * @return {Promise.<number>} A promise that resolves if:
 *		a) No previous snapshot found, writes the file and resolves the gzip size
 *		b) The bundle size is the same as the previous snapshot, resolves size
 *		c) The bundle size is smaller than the snapshot, updates snapshot, resolves size
 */
module.exports = function(bundle, dest) {
	var snapPath = path.join(dest, `${path.basename(bundle, ".js")}-size.snap`);

	return new Promise(function(resolve, reject) {
		readFile(bundle)
			.then(function(data) {
				return Promise.all([ data.toString(), safeRequire(snapPath) ]);
			})
			// [ bundle : String, snapshot : Number ]
			.then(function(data) {
				var oldSize = data[1];
				var newSize = gzipSize.sync(data[0]);
				var sizeRange = range(oldSize, oldSize + sizeOffset);

				// just resolve if the bundle size did not change
				if (includes(sizeRange, newSize)) {
					return resolve(newSize);
				}

				// reject promise if size has increased
				if (oldSize != null && newSize > (oldSize + sizeOffset)) {
					return reject(
						new Error(`Bundle size has increased, before: ${oldSize} now: ${newSize}`)
					);
				}

				// write the snapshot for the first time or if bundle size smaller
				return writeFile(snapPath, `module.exports = ${newSize};`)
					.then(function() {
						console.log(colors.yellow.underline(`\tPlease commit ${path.basename(snapPath)}`));
						return newSize;
					});
			})
			.then(resolve)
			.catch(reject);
	});
};

function safeRequire(snapshot) {
	try {
		return require(snapshot);
	} catch (e) {
		return null;
	}
}
