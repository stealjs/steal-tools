var path = require("path");
var glob = require("glob");
var _ = require("lodash");
var npmUtils = require("steal/ext/npm-utils");

var jsInPatternRegEx = /((\.js)(\||\)))/gi;
var winBackslashRegEx = /\\/g;

module.exports = findBundles;

/**
 * @module {Function} findBundles
 * @description Find all of the bundles belonging to a loader.
 * @param {Loader} loader
 * @return {Array.<moduleName>}
 */
function findBundles(loader) {
	// Remove the file: protocol portion of the baseURL because glob doesn't
	// work with it.
	var cwd = loader.baseURL.replace("file:", "");

	var globOpts = {
		cwd: path.normalize(cwd),
		nodir: true
	};
	var patternArray = [];
	var bundleArray = [];

	// add direcotries.lib to globs current working directory
	if(loader.npmContext && loader.directories && loader.directories.lib) {
		globOpts.cwd = path.join(globOpts.cwd, loader.directories.lib);
	}

	if(Array.isArray(loader.bundle)) {
		patternArray = loader.bundle;
	}else if(typeof loader.bundle === "string") {
		patternArray.push(loader.bundle);
	} else {
		return patternArray;
	}

	patternArray.forEach(function (pattern) {

		pattern = pattern.replace(jsInPatternRegEx, function (match, p1, p2, p3) {
			return p3;
		});

		if(!endsWith(pattern, ".js")) {
			pattern = pattern+".js";
		}

		// we have a npm app
		if(loader.npmContext){
			var app = loader.npmContext.pkgInfo[0];

			if(npmUtils.moduleName.isNpm(pattern)) {
				pattern = npmUtils.moduleName.parse(pattern).modulePath;

			}else if(startsWith("~/", pattern)) {
				// remove ~/
				pattern = pattern.substr(2);

			}else if(startsWith(app.name+"/", pattern)){
				pattern = pattern.substr((app.name+"/").length);
			}
		}


		bundleArray = _.union(bundleArray, glob.sync(pattern, globOpts).map(function (filepath) {
			var file = path.parse(filepath);
			return ((loader.npmContext) ? "~/" : "") + slashify(path.join(file.dir, file.name));
		}));
	});

	return bundleArray;
}

function endsWith(str, suffix) {
	return str.indexOf(suffix, str.length - suffix.length) !== -1;
}
function startsWith(prefix, path) {
	return path.substr(0,prefix.length) === prefix;
}
function slashify(path) {
	return path.replace(winBackslashRegEx, '/');
}