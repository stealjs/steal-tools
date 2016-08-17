var path = require("path");
var glob = require("glob");
var _ = require("lodash");

var npmModuleRegEx = /.+@.+\..+\..+#.+/;


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
		if(!endsWith(pattern, ".js")) {
			pattern = pattern+".js";
		}

		// we have a npm app
		if(loader.npmContext){
			var app = loader.npmContext.pkgInfo[0];

			if(isNpm(pattern)) {
				pattern = parseNpmModulename(pattern).modulePath;

			}else if(startsWith("~/", pattern)) {
				// remove ~/
				pattern = pattern.substr(2);

			}else if(startsWith(app.name+"/", pattern)){
				pattern = pattern.substr((app.name+"/").length);
			}
		}


		bundleArray = _.union(bundleArray, glob.sync(pattern, globOpts).map(function (filepath) {
			var file = path.parse(filepath);
			return "~/" + path.join(file.dir, file.name);
		}));
	});

	return bundleArray;
}

function endsWith(str, suffix) {
	return str.indexOf(suffix, str.length - suffix.length) !== -1;
}
function startsWith(starts, path) {
	return path.substr(0,starts.length) === starts;
}
function isNpm(moduleName){
	return npmModuleRegEx.test(moduleName);
}
function isScoped(moduleName){
	return moduleName[0] === "@";
}
function parseNpmModulename (moduleName, currentPackageName) {
	var pluginParts = moduleName.split('!');
	var modulePathParts = pluginParts[0].split("#");
	var versionParts = modulePathParts[0].split("@");
	// it could be something like `@empty`
	if(!modulePathParts[1] && !versionParts[0]) {
		versionParts = ["@"+versionParts[1]];
	}
	// it could be a scope package
	if(versionParts.length === 3 && isScoped(moduleName)) {
		versionParts.splice(0, 1);
		versionParts[0] = "@"+versionParts[0];
	}
	var packageName,
		modulePath;

	// if the module name is relative
	// use the currentPackageName
	if (currentPackageName && startsWith(".", moduleName)) {
		packageName = currentPackageName;
		modulePath = versionParts[0];

		// if the module name starts with the ~ (tilde) operator
		// use the currentPackageName
	} else if (currentPackageName && startsWith("~/", moduleName)) {
		packageName = currentPackageName;
		modulePath = versionParts[0].split("/").slice(1).join("/");

	} else {

		if(modulePathParts[1]) { // foo@1.2#./path
			packageName = versionParts[0];
			modulePath = modulePathParts[1];
		} else {
			// test/abc
			var folderParts = versionParts[0].split("/");
			// Detect scoped packages
			if(folderParts.length && folderParts[0][0] === "@") {
				packageName = folderParts.splice(0, 2).join("/");
			} else {
				packageName = folderParts.shift();
			}
			modulePath = folderParts.join("/");
		}

	}

	return {
		plugin: pluginParts.length === 2 ? "!"+pluginParts[1] : undefined,
		version: versionParts[1],
		modulePath: modulePath,
		packageName: packageName,
		moduleName: moduleName
	};
}