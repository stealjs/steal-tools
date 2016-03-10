var crypto = require('crypto'),
	_ = require('lodash'),
	winston = require('winston');

var npmNameExp = /.+@.+#.+/;
/**
 * is a npm module name?
 * do not support npm scoping!
 * @param name
 * @returns {boolean}
 */
function isNpm(name) {
	return npmNameExp.test(name);
}

/**
 * get the path of a npm module
 * {packagename}@{version}#{path}
 * @param name
 * @returns {*}
 */
function deNpm(name) {
	var modulePackage = name.substr(0, name.indexOf("@"));
	var moduleVersion = name.substring(name.indexOf("@")+1, name.indexOf("#"));
	var modulePath = name.substr(name.indexOf("#")+1);
	return {
		'package': modulePackage,
		'version': moduleVersion,
		'path': modulePath
	}
}

/**
 * get the last part of a module path
 * if a npm package is provided
 * e.g.
 * main/bar/foo => foo
 * packagename@1.0.0#foo/bar => bar
 *
 * @param uri
 * @returns {string}
 */
var filename = function(uri){
		var lastSlash = uri.lastIndexOf("/");
		var sub;
		if(lastSlash == -1) {
			sub = uri;
		} else {
			sub = uri.substr(lastSlash + 1);
		}
		var matches = deNpm(sub).path.match(/^[\w-\s\.]+/);
		return matches ? matches[0] : "";
	},
	pluginPart = function(name){
		var bang = name.lastIndexOf("!");
		if(bang !== -1) {
			return name.substr(bang+1);
		}
	},
	pluginResource = function(name){
		var bang = name.lastIndexOf("!");
		if(bang !== -1) {
			return name.substr(0, bang);
		}
	};

var bundleCounter = 0;
var usedBundleNames = {};

/**
 * get the name of a bundle
 * @param bundle
 * @returns {string}
 */
function getName(bundle) {

	/**
	 * add a prototype method to String
	 * @param whatever
	 * @returns {string}
	 */
	String.prototype.removeTrailing = function (whatever) {
		var result = this;
		if(this.substr((-1 * whatever.length)) === whatever) {
			result = this.substr(0, this.length - (1 * whatever.length));
		}
		return result+"";
	};

	var dirName = "bundles/";

	// remove trailing parts we do not need
	var packages = [];
	var bundleNames = bundle.bundles.map(function(appName){
		appName = appName.removeTrailing('/').removeTrailing('.js');
		packages.push(deNpm(appName).package);
		return appName;
	});
	packages = _.uniq(packages);

	if(packages.length > 1) {
		winston.warn("There is two or more different package names inside the bundles array." +
			"The destination folder is set to "+dirName+'/'+packages.shift());
	}

	// concat multiple bundles into one shortened filename,
	// for that use only the last part of each modulepath
	// if no multiple bundles
	// => shortened = bundle.bundles[0] , BUT without plugins markup
	var shortened = bundleNames.map(function(l){
		return filename(l);
	}).join('-');

	// if multiple bundles and very long concatenated name
	if (bundle.bundles.length > 1 && shortened.length > 25) {
		var hasher = crypto.createHash("md5");
		hasher.update(shortened);
		var shortenedHash = hasher.digest('hex');
		shortened = shortened.substr(0, 16) + "-" + shortenedHash.substr(0, 8);

		// If this is a "main" bundle
	} else if (bundle.bundles.length === 1 ) {
		// Use the full path name, removing trailing ".js"
		shortened = bundleNames[0];

		var plugin = pluginPart(shortened);
		if(plugin) {
			shortened = pluginResource(shortened);
			// for the shortened we only want the path of the project
			if(isNpm(shortened)) {
				shortened = deNpm(shortened).path;
			}

			// e.g. index.stache
			if(shortened.indexOf(".") !== -1){
				shortened = shortened.substr(0, shortened.indexOf("."));
			}
		}
	}

	// if the first bundle is a project module
	// using directories.lib
	// so dirName needs to be packageName/modulePath
	if(isNpm(bundleNames[0])) {
		dirName += deNpm(bundleNames[0]).package + "/";
	}

	var buildType = bundle.buildType || "js",
			buildTypeSuffix = buildType === "js" ? "" : "."+buildType+"!";

	// delete the String prototype method
	delete String.prototype.removeTrailing;

	if(!usedBundleNames[shortened]){
		usedBundleNames[shortened] = true;
		return dirName+deNpm(shortened+buildTypeSuffix).path;
	} else if(shortened.length > 50){
		return dirName+shortened.substr(0,50)+"-"+bundleNames.length+"-"+(bundleCounter++)+buildTypeSuffix;
	} else {
		return dirName+shortened+buildTypeSuffix;
	}
}

exports = module.exports = function(bundle) {
	bundle.name = getName(bundle);
};

exports.getName = getName;
