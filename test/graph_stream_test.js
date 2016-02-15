var stealTools = require("../index");

var asap = require("pdenodeify");
var assert = require("assert");
var rmdir = asap(require("rimraf"));
var through = require("through2");

describe("createGraphStream", function(){
	it("Creates a stream containing the dependency graph", function(done){
		var system = {
			config: __dirname + "/bundle/stealconfig.js",
			main: "bundle"
		};
		var options = { quiet: true };

		var graphStream = stealTools.createGraphStream(system, options);

		graphStream.pipe(through.obj(function(data){
			assert(data.graph, "has the graph");
			assert(data.steal, "has steal");
			assert(data.loader, "has the loader");
			assert(data.buildLoader, "has the buildLoader");
			assert(data.config, "has the config object");
			assert(data.options, "has the options object");

			done();
		}));
	});
});
