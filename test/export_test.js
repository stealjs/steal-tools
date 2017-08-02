var assert = require("assert"),
	fs = require("fs-extra"),
	path = require("path"),
	rmdir = require("rimraf"),
	stealExport = require("../lib/build/export"),
	testHelpers = require("./helpers"),
	denodeify = require("pdenodeify");

var find = testHelpers.find;
var open = testHelpers.open;

describe("export", function(){
	it("basics work", function(done){
		stealExport({

			steal: {
				main: "pluginifier_builder/pluginify",
				config: __dirname+"/stealconfig.js"
			},
			options: {
				quiet: true
			},
			"outputs": {
				"basics standalone": {
					modules: ["basics/module/module"],
					dest: function(){
						return __dirname+"/out/basics.js"
					},
					minify: false
				},
				"pluginify without basics": {
					modules: ["pluginifier_builder/pluginify"],
					ignore: ["basics/module/module"],
					dest: function(){
						return __dirname+"/out/pluginify.js"
					},
					minify: false
				}
			}
		}).then(function(data){
			// Includes all buildResult fields
			assert(!!data.configuration, "configuration");
			assert(!!data.graph, "graph");
			assert(!!data.loader, "loader");
			assert(!!data.steal, "steal");

			open("test/pluginifier_builder/index.html", function(browser, close){

				find(browser,"RESULT", function(result){
					assert.ok(result.module, "has module");
					assert.ok(result.cjs,"has cjs module");
					assert.equal(result.name, "pluginified");
					close();
				}, close);

			}, done);

		}, done);
	});

	it("works with multiple mains", function(done) {
		stealExport({
			steal: {
				main: [
					"pluginifier_builder/pluginify",
					"pluginifier_builder/common"
				],
				config: __dirname+"/stealconfig.js"
			},
			options: {
				quiet: true
			},
			"outputs": {
				"basics standalone": {
					modules: ["basics/module/module"],
					dest: function(){
						return __dirname+"/out/basics.js"
					},
					minify: false
				},
				"pluginify without basics": {
					modules: ["pluginifier_builder/pluginify"],
					ignore: ["basics/module/module"],
					dest: function(){
						return __dirname+"/out/pluginify.js"
					},
					minify: false
				}
			}
		}).then(function(){
			open("test/pluginifier_builder/index.html", function(browser, close){

				find(browser,"RESULT", function(result){
					assert.ok(result.module, "has module");
					assert.ok(result.cjs,"has cjs module");
					assert.equal(result.name, "pluginified");
					close();
				}, close);

			}, done);

		}, done);
	});

	it("passes the load objects to normalize and dest", function(done){
		var destCalls = 0;

		stealExport({

			steal: {
				main: "pluginifier_builder_load/main",
				config: __dirname+"/stealconfig.js"
			},
			options: {
				quiet: true
			},
			"outputs": {
				"cjs": {
					graphs: ["pluginifier_builder_load/main"],
					useNormalizedDependencies: false,
					format: "cjs",
					normalize: function(name, load, curName, curLoad, loader) {
						assert.equal(name, "./bar");
						assert.equal(load.name, "pluginifier_builder_load/bar");
						assert.equal(curName, "pluginifier_builder_load/main");
						assert.equal(curLoad.name, "pluginifier_builder_load/main");
						assert.equal(loader.main, "pluginifier_builder_load/main");
						return name;
					},
					ignore: function(moduleName, load){
						switch(destCalls++) {
							case 0:
								assert.equal(load.name, "pluginifier_builder_load/main");
								break;
							case 2:
								assert.equal(load.name, "pluginifier_builder_load/bar");
								return true;
								break;
							default:
								assert.ok(false, "should not be called "+moduleName+"."+destCalls);
								break;
						}
					},
					dest: function(moduleName, moduleData, load){
						switch(destCalls++) {
							case 1:
								assert.equal(load.name, "pluginifier_builder_load/main");
								break;
							default:
								assert.ok(false, "should not be called "+moduleName+"."+destCalls);
								break;
						}
						return __dirname+"/out/"+moduleName+".js"
					},
					minify: false
				}
			}
		}).then(function(err){

			done();

		}, done);
	});

	it("passes the load objects to normalize and dest (+cjs)", function(done) {
		var destCalls = 0;

		stealExport({

			steal: {
				main: "pluginifier_builder_load/main",
				config: __dirname + "/stealconfig.js"
			},
			options: {
				quiet: true
			},
			"outputs": {
				"+cjs": {
					graphs: ["pluginifier_builder_load/main"],
					useNormalizedDependencies: false,
					format: "cjs",
					normalize: function(name, load, curName, curLoad, loader) {
						assert.equal(name, "./bar");
						assert.equal(load.name, "pluginifier_builder_load/bar");
						assert.equal(curName, "pluginifier_builder_load/main");
						assert.equal(curLoad.name, "pluginifier_builder_load/main");
						assert.equal(loader.main, "pluginifier_builder_load/main");
						return name;
					},
					ignore: function(moduleName, load){
						switch(destCalls++) {
							case 0:
								assert.equal(load.name, "pluginifier_builder_load/main");
								break;
							case 2:
								assert.equal(load.name, "pluginifier_builder_load/bar");
								return true;
								break;
							default:
								assert.ok(false, "should not be called "+moduleName+"."+destCalls);
								break;
						}
					},
					dest: function(moduleName, moduleData, load){
						switch(destCalls++) {
							case 1:
								assert.equal(load.name, "pluginifier_builder_load/main");
								break;
							default:
								assert.ok(false, "should not be called "+moduleName+"."+destCalls);
								break;
						}
						return __dirname+"/out/"+moduleName+".js"
					},
					minify: false
				}
			}
		}).then(function(err){

			done();

		}, done);
	});

	it("evaled globals do not have exports in their scope (#440)", function(done){

		stealExport({

			steal: {
				main: "pluginifier_builder_exports/pluginify",
				config: __dirname+"/stealconfig.js"
			},
			options: {
				quiet: true
			},
			"outputs": {
				"pluginify without basics": {
					modules: ["pluginifier_builder_exports/pluginify"],
					dest: function(){
						return __dirname+"/out/pluginify_exports.js"
					},
					minify: false,
					format: "global"
				}
			}
		}).then(function(){
			open("test/pluginifier_builder_exports/index.html", function(browser, close){

				find(browser,"RESULT", function(result){
					assert.equal(result.name, "pluginified");
					close();
				}, close);

			}, done);

		}, done);
	});

	it("Gives an error if using the 'system' property that was removed in 1.0", function(done){
		stealExport({
			system:{},
			options: {},
			outputs: {}
		})
		.then(function(){
			assert.ok(false, "This should have failed");
		}, function(err){
			var correctError = /'system' option/.test(err.message);
			assert.ok(correctError, "Logs that the system option was removed");
		})
		.then(done, done);
	});

	it("Gives an error if 'steal' option is missing", function(done){
		stealExport({
			options: {},
			outputs: {}
		})
		.then(function(){
			assert.ok(false, "This should have failed");
		}, function(err){
			var correctError = /'steal' option/.test(err.message);
			assert.ok(correctError, "Logs that steal is required");
		})
		.then(done, done);
	});

	it("works with circular dependencies", function() {
		var base = path.join(__dirname, "circular");

		return denodeify(rmdir)(path.join(base, "amd.js"))
			.then(function() {
				return stealExport({
					steal: {
						config: path.join(__dirname, "circular", "package.json!npm")
					},
					options: {
						quiet: true
					},
					outputs: {
						"+amd": { // the "+amd" is needed to make the test fail
							minify: false,
							modules: ["circular/main"],
							dest: path.join(base, "export")
						}
					}
				});
			})
			.then(function() {
				assert.ok(true, "export should be successful");
			});
	});

	it("errors out when 'dest' is not provided", function(done) {
		var exportPromise = stealExport({
			steal: {
				config: path.join(__dirname, "circular", "package.json!npm")
			},
			options: {
				quiet: true
			},
			outputs: {
				amd: {
					minify: false,
					format: "amd",
					modules: ["circular/main"]
				}
			}
		});

		exportPromise
			.then(function() {
				assert(false, "should fail, 'dest' is missing");
			})
			.then(done, function(err) {
				assert(/Attribute 'dest' is required/.test(err.message),
					"should fail with a nice error");
				done();
			});
	});

	describe("eachModule", function(){
		it("works", function(done){
			stealExport({
				steal: {
					main: "pluginifier_builder/pluginify",
					config: __dirname+"/stealconfig.js"
				},
				options: {
					quiet: true
				},
				"outputs": {
					"basics standalone": {
						eachModule: ["basics/module/module"],
						dest: function(){
							return __dirname+"/out/basics.js"
						},
						minify: false
					}
				}
			}).then(function(){
				open("test/pluginifier_builder/index.html",
					 function(browser, close){

					find(browser,"RESULT", function(result){
						assert.ok(result.module, "has module");
						assert.ok(result.cjs,"has cjs module");
						assert.equal(result.name, "pluginified");
						close();
					}, close);
				}, done);
			}, done);

		});
	});

	describe("helpers", function(){
		beforeEach(function(done) {
			rmdir(path.join(__dirname, "pluginifier_builder_helpers", "node_modules"), function(error){

				if(error){ return done(error); }

				rmdir(path.join(__dirname, "pluginifier_builder_helpers", "dist"), function(error){

					if(error){ return done(error); }

					fs.copy(
						path.join(__dirname, "..", "node_modules","jquery"),
						path.join(__dirname, "pluginifier_builder_helpers", "node_modules", "jquery"),
						function(error){
							if(error) { return done(error); }

							fs.copy(
								path.join(__dirname, "..", "node_modules","cssify"),
								path.join(__dirname, "pluginifier_builder_helpers", "node_modules", "cssify"),
								function(error){
									if(error) { return done(error); }
									done();
								}
							);
						}
					);

				});

			});
		});

		it("ignore: false will not ignore node_modules for globals",
		   function(done){
			this.timeout(10000);
			stealExport({
				steal: {
					config: __dirname + "/ignore_false/package.json!npm"
				},
				options: { quiet: true },
				outputs: {
					"+global-js": {
						ignore: false
					}
				}
			}).then(function(){
				open("test/ignore_false/prod.html", function(browser, close) {
					find(browser, "MODULE", function(mod){
						assert.equal(mod.dep, "a dep");
						assert.equal(mod.other, "other");
						close();
					}, close);
				}, done);
			}, done);
		});
	});

	describe("npm package.json builds", function(){
		this.timeout(60000);

		describe("ignore", function(){
			it("works with unnormalized names", function(done){
				stealExport({
					steal: {
						config: __dirname+"/npm/package.json!npm",
						main: "npm-test/main",
						transpiler: "babel"
					},
					options: { quiet: true },
					"outputs": {
						"+global-js": {
							modules: ["npm-test/main"],
							minify: false,
							ignore: ["npm-test/child"],
							exports: {
								"jquery": "$"
							}
						},
					}
				})
				.then(check);

				function check() {
					openPage(function(moduleValue){
						var child = moduleValue.child;
						assert.equal(child.default, undefined, "Child ignored in build");
					}, done);
				}

				function openPage(callback, done) {
					open("test/npm/prod-global.html", function(browser, close){
						find(browser,"MODULE", function(moduleValue){
							callback(moduleValue);
							close();
						}, close);
					}, done);
				}
			});
		});
	});
});
