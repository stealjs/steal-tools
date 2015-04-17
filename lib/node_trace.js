var steal = require("steal");
var fs = require("fs");
var asap = require("pdenodeify");
var readFile = asap(fs.readFile);
var clone = require("lodash").clone;

module.exports = function(load){
	load = clone(load);
	load.metadata.deps = [];

	var localSteal =  steal.clone(steal.addSteal(steal.System.clone()));
	var System = localSteal.System;

	var address = load.address.replace("file:", "");
	return readFile(address, "utf8").then(function(source){
		load.source = source;
		return System.instantiate(load).then(function(result){
			return { source: source, deps: result.deps };
		});
	});
};
