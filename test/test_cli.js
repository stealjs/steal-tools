var assert = require("assert");
var path = require("path");
var rmdir = require("rimraf");
var spawn = require("child_process").spawn;
var asap = require("pdenodeify");
var fs = require("fs-extra");
require("steal");

var find = require("./helpers").find;
var open = require("./helpers").open;

var isWin = /^win/.test(process.platform);

function stealTools(args){
	return new Promise(function(resolve, reject){
		var cli = path.resolve(__dirname + "/../bin/steal");
		args = args || [];
		
		if(isWin) {
			args.unshift.apply(args, ["/c", "node", cli]);
			cli = "cmd";
		}
		
		var child = spawn(cli, args || []);

		/*var print = function(d){ console.log(d+""); };
		child.stdout.on("data", print);
		child.stderr.on("data", print);*/

		child.on("close", function(code){
			if(code === 1) {
				var error = new Error("Exited with status " + code);
				return reject(error);
			}
			return resolve();
		});
	});
}

describe("steal-tools cli", function () {
    this.timeout(5000);

    describe("build", function () {
        describe("basics", function () {
            beforeEach(function () {
                this.cwd = process.cwd();
                process.chdir(__dirname);
            });

            afterEach(function () {
                process.chdir(this.cwd);
            });

            it("works", function (done) {
                stealTools(["build", "--config", "stealconfig.js", "--main",
						   "basics/basics", "--no-minify"])
					.then(function () {
					    done();
					});
            });

            it("uses build by default", function (done) {
                stealTools(["--config", "stealconfig.js", "--main",
						   "basics/basics", "--no-minify"])
					.then(function () {
					    done();
					});
            });
        });

        describe("without --config or --main", function () {
            this.timeout(10000);

            beforeEach(function (done) {
                this.cwd = process.cwd();
                process.chdir(path.resolve(__dirname + "/npm"));

                rmdir = asap(rmdir);
                var copy = asap(fs.copy);

                rmdir(path.join(__dirname, "npm", "node_modules"))
					.then(function () {
					    return rmdir(path.join(__dirname, "npm", "dist"));
					})
					.then(function () {
					    return copy(path.join(__dirname, "..", "node_modules", "jquery"),
									path.join(__dirname, "npm", "node_modules", "jquery"));
					}).then(function () {
					    return copy(path.join(__dirname, "..", "bower_components", "steal"),
									path.join(__dirname, "npm", "node_modules", "steal"));
					}).then(done, done);
            });

            afterEach(function () {
                process.chdir(this.cwd);
            });

            it("uses package.json", function (done) {
                stealTools(["--no-minify"]).then(function () {
                    open("test/npm/prod.html", function (browser, close) {
                        var h1s = browser.window.document.getElementsByTagName('h1');
                        assert.equal(h1s.length, 1, "Wrote H!.");
                        close();
                    }, done);
                });
            });
        });
    });

    describe("transform", function () {
        describe("basics", function () {
            beforeEach(function (done) {
                this.cwd = process.cwd();
                process.chdir(__dirname);

                rmdir(__dirname + "/pluginify/out.js", function (error) {
                    done(error);
                });
            });

            afterEach(function () {
                process.chdir(this.cwd);
            });

            it("works", function (done) {

                stealTools(["transform", "-c", "stealconfig.js", "-m",
						   "pluginify/pluginify", "--out", "pluginify/out.js"]).then(function () {

						       open("test/pluginify/index.html", function (browser, close) {

						           find(browser, "RESULT", function (result) {
						               assert(result.module.es6module, "have dependeny");
						               assert(result.cjs(), "cjs");
						               assert.equal(result.UMD, "works", "Doesn't mess with UMD modules");
						               assert.equal(result.define, undefined, "Not keeping a global.define");
						               assert.equal(result.System, undefined, "Not keeping a global.System");
						               close();
						           }, close);

						       }, done);

						   });
            });
        });
    });
});
