var stealTools = require("../index");
var createGraphStream = stealTools.createGraphStream;
var createConcatStream = stealTools.createConcatStream;
var createMultiBuildStream = stealTools.createMultiBuildStream;
var createWriteStream = stealTools.createWriteStream;

var asap = require("pdenodeify");
var assert = require("assert");
var rmdir = asap(require("rimraf"));
var through = require("through2");

describe("createConcatStream", function(){
	it("Concats nodes in a bundle", function(done){
		var system = {
			config: __dirname + "/bundle/stealconfig.js",
			main: "bundle"
		};
		var options = { minify: false, quiet: true };

		var graphStream = createGraphStream(system, options);
		var buildStream = graphStream.pipe(createMultiBuildStream());
		var concatStream = buildStream.pipe(createConcatStream());

		concatStream.pipe(through.obj(function(data){
			var bundles = data.bundles;

			assert(bundles.length, "There were bundles");
			bundles.forEach(function(bundle){
				assert(bundles[0].source, "the bundle has source");
			});
			done();
		}));
	});
});
