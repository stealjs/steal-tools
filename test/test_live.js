var assert = require("assert");
//var live = require("../lib/stream/live");
var Emitter = require("events").EventEmitter;
var fs = require("fs");
var s = require("../index").streams;
var asap = require("pdenodeify");
var rmdir = asap(require("rimraf"));
var through = require("through2");
var testHelpers = require("./helpers");
var WebSocket = require("ws");
var mockery = require("mockery");
var isWindows = process.platform === "win32";

var find = testHelpers.find;
var open = testHelpers.open;

describe("live-reload", function(){
	this.timeout(10000);

	var liveModPath = "../lib/stream/live";
	var live;

	if(isWindows) {
		return;
	}

	var fooPath = __dirname + "/live_reload/foo.js";

	before(function(done){
		live = require(liveModPath);
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
						assert(/foo/.test(data.graph["live-app@1.0.0#foo"].load.source),
							"New source contains 'foo'");

						liveStream.end();
						done();
					});
				});
			});
		});
		liveStream.on("error", function(err){
			done(err);
		});
	});

	describe("includedDeps", function(){
		var nestedPath = __dirname + "/live_reload/nested_dep.txt"; 
		var send;

		before(function(done){
			mockery.enable({
				useCleanCache: true,
				warnOnReplace: false,
				warnOnUnregistered: false
			});

			mockery.registerAllowable(liveModPath);

			mockery.registerMock("../create_websocket_server", function(){
				return new Promise(function(resolve){
					var wss = new Emitter();
					wss.clients = [ { send: function(val){
						send(val);
					} } ];
					wss.options = {
						server: {
							address: function() { return { port: 0 }; }
						}
					};
					resolve(wss);
				});
			});

			live = require(liveModPath);

			var self = this;
			asap(fs.readFile)(nestedPath, "utf8").then(function(content){
				self._nestedModule = content;
			}).then(done, done);
		});

		after(function(done){
			mockery.disable();
			mockery.deregisterAll();
			send = undefined;

			asap(fs.writeFile)(nestedPath, this._nestedModule, "utf8")
			.then(function(){
				done();
			});
		});


		it("A plugin can add includedDeps which are live-reloaded", function(done){
			send = function(msg){
				var moduleNames = JSON.parse(msg);
				assert.equal(moduleNames.length, 1, "there is one module");
				assert.equal(moduleNames[0], "immediate_dep.txt!plug");

				liveStream.once("data", function(){
					liveStream.end();
					done();
				});
			};

			var liveStream = live({
				config: __dirname + "/live_reload/package.json!npm",
				main: "alt"
			});

			liveStream.once("data", function(data){
				liveStream.once("data", function(data) {
					var dep = data.graph["immediate_dep.txt!plug"];
					assert.equal(dep.load.metadata.includedDeps[0],
								 "file:" + nestedPath);

					fs.writeFile(nestedPath, "bar", "utf8");
				});
			});
		});
	});
});

describe("build with live-reload", function(){
	it("should not be included in bundle", function(done){
		var system = {
			config: __dirname + "/live_reload/package.json!npm"
		};
		var options = {
			quiet: true
		};
		
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
