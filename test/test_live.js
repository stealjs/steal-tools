var assert = require("assert");
var live = require("../lib/stream/live");
var fs = require("fs");
var asap = require("pdenodeify");

describe("live-reload", function(){
	this.timeout(10000);

	var fooPath = __dirname + "/live_reload/foo.js";

	beforeEach(function(done){
		var self = this;
		asap(fs.readFile)(fooPath, "utf8").then(function(content){
			self._fooModule = content;
		}).then(done, done);
	});

	afterEach(function(done){
		asap(fs.writeFile)(fooPath, this._fooModule, "utf8").then(function(){
			done();
		}, done);
	});

	it("Starts a web socket server", function(done){
		var liveStream = live({
			config: __dirname + "/live_reload/package.json!npm"
		}, {});

		liveStream.once("data", function(data){
			assert(/bar/.test(data.graph.foo.load.source),
				   "Initial source contains 'bar'");

			var newSource = "module.exports = 'foo';";
			asap(fs.writeFile)(fooPath, newSource, "utf8").then(function(){
				liveStream.once("data", function(data){
					assert(/foo/.test(data.graph.foo.load.source),
						   "New source contains 'foo'");
					done();
				});
			});
		});
		liveStream.on("error", function(err){
			done(err);
		});
	});

});
