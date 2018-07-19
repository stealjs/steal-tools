var assert = require("assert");
var stealExport = require("../lib/build/export");
var rmdir = require("rimraf");
var testHelpers = require("./helpers");

var find = testHelpers.find;
var open = testHelpers.open;


describe("+standalone", function(){
	it("Works with exporting a module from a dependency", function(done){
		this.timeout(10000);
		stealExport({
			steal: {
				config: __dirname+"/exports_basics/package.json!npm"
			},
			options: { quiet: true },
			"outputs": {
				"+standalone": {
					exports: {
						"foo": "FOO.foo"
					},
					dest: __dirname + "/exports_basics/out.js"
				}
			}
		})
		.then(function() {
			open("test/exports_basics/global.html",
				 function(browser, close) {
				find(browser,"FOO", function(foo){
					assert.equal(foo.foo.bar.name, "bar", "it worked");
					close();
				}, close);
			}, done);
		}, done);
	});

	it("Works when using dest as a function", function(done){
		this.timeout(10000);

		stealExport({
			steal: {
				config: __dirname + "/exports_basics/package.json!npm"
			},
			options: { quiet: true },
			outputs: {
				"+standalone": {
					exports: { "foo": "FOO.foo" },
					dest: function(){
						return __dirname + "/exports_basics/out.js"
					}
				}
			}
		})
		.then(function(){
			open("test/exports_basics/global.html",
				 function(browser, close) {
				find(browser,"FOO", function(foo){
					assert.equal(foo.foo.bar.name, "bar", "it worked");
					close();
				}, close);
			}, done);
		});
	});

	it("Can be used for node.js projects with process and defaults to not prod", function(done){
		this.timeout(10000);

		var outPath = __dirname + "/exports_basics/out.js";

		stealExport({
			steal: {
				main: "app/uses-process",
				config: __dirname + "/exports_basics/package.json!npm"
			},
			options: { quiet: true },
			outputs: {
				"+standalone": {
					modules: ["app/uses-process"],
					exports: { "app/uses-process": "EXP_PROCESS" },
					dest: function(){
						return outPath;
					}
				}
			}
		})
		.then(function(){
			open("test/exports_basics/global.html",
				 function(browser, close) {
				find(browser,"EXP_PROCESS", function(expProcess){
					assert.equal(expProcess.env, "NOT-PROD", "not in prod by default");
					close();
				}, close);
			}, done);
		})
		.catch(done);

	});

	it("Can be used for node.js projects with process and can be set to production", function(done){
		this.timeout(10000);

		var outPath = __dirname + "/exports_basics/out.js";

		stealExport({
			steal: {
				main: "app/uses-process",
				config: __dirname + "/exports_basics/package.json!npm"
			},
			options: { quiet: true },
			outputs: {
				"+standalone": {
					modules: ["app/uses-process"],
					exports: { "app/uses-process": "EXP_PROCESS" },
					dest: function(){
						return outPath;
					},
					// sets to production
					env: "production"
				}
			}
		})
		.then(function(){
			open("test/exports_basics/global.html",
				 function(browser, close) {
				find(browser,"EXP_PROCESS", function(expProcess){
					assert.equal(expProcess.env, "PROD", "not in prod by default");
					close();
				}, close);
			}, done);
		})
		.catch(done);

	});
});
