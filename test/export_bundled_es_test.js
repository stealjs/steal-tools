var assert = require("assert");
var fs = require("fs");
var stealExport = require("../lib/build/export");
var rmdir = require("rimraf");
var testHelpers = require("./helpers");

var find = testHelpers.find;
var open = testHelpers.open;


describe("+bundled-es", function(){
	it("Works with a basic app with npm dependencies", function(done){
		this.timeout(10000);
		stealExport({
			steal: {
				config: __dirname+"/exports_basics/package.json!npm",
				main: "app/index_es"
			},
			options: { quiet: true },
			"outputs": {
				"+bundled-es": {
					dest: __dirname + "/exports_basics/dist/es.js"
				}
			}
		})
		.then(function() {
			assert.ok(true, "it built");
			done();
		}, done);
	});

	it("Works when also doing a global build", function(done){
		this.timeout(10000);
		stealExport({
			steal: {
				config: __dirname+"/exports_basics/package.json!npm",
				main: "app/index_es"
			},
			options: { quiet: true },
			"outputs": {
				"+standalone": {
					dest: __dirname + "/exports_basics/dist/global.js"
				},
				"+bundled-es": {
					addProcessShim: true,
					dest: __dirname + "/exports_basics/dist/es.js"
				}
			}
		})
		.then(function() {
			assert.ok(true, "it built");
			done();
		}, done);
	});

	it("Can be minified", function(done){
		this.timeout(10000);
		stealExport({
			steal: {
				config: __dirname+"/exports_basics/package.json!npm",
				main: "app/index_es"
			},
			options: { quiet: true },
			"outputs": {
				"+bundled-es": {
					minify: true,
					dest: __dirname + "/exports_basics/dist/es.js"
				}
			}
		})
		.then(function() {
			assert.ok(true, "it built");
			done();
		}, done);
	});

	it("Removes dev code", function(done){
		this.timeout(10000);
		stealExport({
			steal: {
				config: __dirname+"/exports_basics/package.json!npm",
				main: "app/index_es"
			},
			options: { quiet: true },
			"outputs": {
				"+bundled-es": {
					dest: __dirname + "/exports_basics/dist/es.js"
				}
			}
		})
		.then(function() {
			var code = fs.readFileSync(__dirname + "/exports_basics/dist/es.js", "utf8");
			assert.ok(!/window\.REMOVEME/.test(code), "Removed the dev code");
			done();
		})
		.catch(done);
	});
});
