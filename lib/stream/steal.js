var asap = require("pdenodeify");
var path = require("path");
var through = require("through2");
var fs = require("fs-extra");
var npmUtils = require("steal/ext/npm-utils");

module.exports = function(){
	return through.obj(function(data, enc, done){
		addConfiguredSteal(data)
		.then(function(){
			done(null, data);
		}, function(err){
			done(err);
		});
	});
};

function addConfiguredSteal(data) {
	var configuration = data.configuration;
	var options = data.options;
	var dest = configuration.dest;
	var stealProductionDest = path.join(dest, "steal.production.js");

	// Don't do this if we are bundling steal
	if(options.bundleSteal) {
		return Promise.resolve();
	}

	var stealProject = require.resolve("steal");

	var stealPath = path.join(
		path.dirname(stealProject),
		"steal.production.js"
	);

	return asap(fs.readFile)(stealPath, "utf8")
	.then(function(src){
		return appendConfig(src, data);
	})
	.then(function(src){
		return asap(fs.outputFile)(stealProductionDest, src, "utf8");
	});
}

function appendConfig(src, data) {
	var main = data.mains[0];
	var configMain = data.steal.System.configMain;

	var configSrc = [
		"if(typeof steal === \"undefined\") steal = {};",
		"steal.bundlesPath = \"bundles\";",
		"steal.main = \"" + denormalize(main) + "\";",
		"steal.configMain = \"" + configMain + "\";"
	].join("\n");

	return configSrc + "\n" + src;
}

function denormalize(name) {
	if(npmUtils.moduleName.isNpm(name)) {
		var parsed = npmUtils.moduleName.parse(name);
		name = parsedToFriendly(parsed);

		if(parsed.plugin) {
			var parsedPlugin = npmUtils.moduleName.parse(parsed.plugin.substr(1));
			name += "!" + parsedToFriendly(parsedPlugin);
		}
	}
	return name;
}

function parsedToFriendly(parsed) {
	var name = parsed.packageName + "/" + parsed.modulePath;
	return name;
}
