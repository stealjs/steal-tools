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

	// add direcotries.lib to the current working directory
	if(loader.npmContext && loader.directories && loader.directories.lib) {
		globOpts.cwd = path.join(globOpts.cwd, loader.directories.lib);
	}
	
	// create a patternArray
	if(Array.isArray(loader.bundle)) {
		patternArray = loader.bundle;
	}else if(typeof loader.bundle === "string") {
		patternArray.push(loader.bundle);
	} else {
		return patternArray;
	}
	
	// go through each pattern and do tings like:
	patternArray.forEach(function (pattern) {

		// if we have a pattern like "+(app_a.js|bundle.js)"
		// remove the extension 
		pattern = pattern.replace(jsInPatternRegEx, function (match, p1, p2, p3) {
			return p3;
		});

		// add a extension ".js" to the pattern, so that we always get javascript files
		// pattern become e.g.
		// "src-glob-test/bar/**/*" => "src-glob-test/bar/**/*.js"
		// "+(app_a.js|bundle.js)" => "+(app_a|bundle).js"
		// "app_a.js" => "app_a.js"
		// "npm-test@0.0.1#site/site3" => "npm-test@0.0.1#site/site3.js"
		if(!endsWith(pattern, ".js")) {
			pattern = pattern+".js";
		}

		// we have a npm app 
		if(loader.npmContext){
			// first pkgInfo should be the package.json and provide some info about the app
			var app = loader.npmContext.pkgInfo[0];

			// if the pattern is a NPM modulename like
			// "npm-test@0.0.1#site/site3.js" (see info above for adding .js extension)
			if(npmUtils.moduleName.isNpm(pattern)) {
				// get the modulePath e.g. "site/site3.js"
				pattern = npmUtils.moduleName.parse(pattern).modulePath;

			// if the module starts with tilde ~, remove it because glob can't handle it
			}else if(startsWith("~/", pattern)) {
				// remove ~/
				pattern = pattern.substr(2);

			// if the pattern starts with the appName like
			// "npm-test/site/site4.js" (see info above for adding .js extension)
			// remove it, because we are in a working directory `globOpts.cwd`
			// `app.name` does not exist
			}else if(startsWith(app.name+"/", pattern)){
				pattern = pattern.substr((app.name+"/").length);
			}
		}

		// use `glob.sync` for finding all the files.
		// on each file do the follwing stuff:
		// 1. use `path.parse` to get all info about the file (`filepath` is a absolute path!)
		// 2. create a filepath (without extension) that is relative to the current working directory
		// 3. use slashify to replace backslashes on windows
		// 4. if we have a NPM app put always a tidle operator at the beginning
		//    we now get always a bundlename like: `~/site/site3`
		//    if we dont have a NPM app, we do the same as before, except to adding the tidle
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
