var assert = require("assert");
var live = require("../lib/stream/live");
var bundle = require("../lib/graph/make_graph_with_bundles");
var s = require("../index").streams;
var fs = require("fs");
var asap = require("pdenodeify");
var rmdir = asap(require("rimraf"));
var through = require("through2");
var testHelpers = require("./helpers");
var WebSocket = require("ws");

var find = testHelpers.find;
var open = testHelpers.open;

describe("live-reload", function(){
	this.timeout(10000);

	var fooPath = __dirname + "/live_reload/foo.js";

	before(function(done){
		var self = this;
		asap(fs.readFile)(fooPath, "utf8").then(function(content){
			self._fooModule = content;
		}).then(done, done);
	});

	after(function(done){
		asap(fs.writeFile)(fooPath, this._fooModule, "utf8").then(function(){
			done();
		});
	});

	it("Starts a web socket server", function(done){
		var liveStream = live({
			config: __dirname + "/live_reload/package.json!npm"
		}, {});

		var ws = new WebSocket("ws://localhost:8012");

		ws.on("open", function(){
			ws.send("main");
		});

		liveStream.once("data", function(data){
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
		});
		liveStream.on("error", function(err){
			done(err);
		});
	});
});

describe("build with live-reload", function(){
	var system = {
		config: __dirname + "/live_reload/package.json!npm"
	};
	var options = {
		quiet: true
	};
	
	it("should not be included in bundle", function(done){
		rmdir(__dirname + "/live_reload/dist").then(function(){
			
			var buildStream = s.graph(system, options)
			.pipe(s.transpile())
			.pipe(s.minify())
			.pipe(s.bundle())
			.pipe(s.concat())
			.pipe(s.write());

			buildStream.pipe(through.obj(function(data){
				assert.equal('build', data.loader.getPlatform());

				open("test/live_reload/prod.html",function(browser, close){
					find(browser,"liveReloadFunction", function(lrf){
						// empty function
						assert.equal(lrf.substr(0,13), "function () {");
						assert(lrf.length <= 20);
						close();
					}, close);
				}, done);
			}));
		});
	});

});
