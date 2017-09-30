var asap = require("pdenodeify"),
    assert = require("assert"),
    comparify = require("comparify"),
    fs = require("fs-extra"),
    multiBuild = require("../index").build,
    optimize = require("../index").optimize,
    rmdir = require("rimraf"),
    path = require("path"),
    testHelpers = require("./helpers");

var find = testHelpers.find;
var open = testHelpers.open;

describe("bundleAssets", function(){
    this.timeout(50000);

    before(function(done){
        asap(rmdir)(__dirname + "/bundle_assets/dist")
            .then(function(){
                done();
            });
    });

    it("works with steal-tools build", function(done){
        multiBuild({
            main: "main",
            config: path.join(__dirname, "bundle_assets", "stealconfig.js")
        }, {
            quiet: true,
            minify: false,
            bundleAssets: {
                infer: true,
                glob: [
                    path.join(__dirname, "bundle_assets", "assets", "*")
                ]
            }
        }).then(function(){
            open("test/bundle_assets/prod.html", function(browser, close){
                find(browser, "MODULE", function(module){
                    const logo = path.join(__dirname, "bundle_assets", "dist", "images", "logo.png");
                    assert(fs.pathExistsSync(logo), "image was copied");

                    const json = path.join(__dirname, "bundle_assets", "dist", "assets", "some.json");
                    assert(fs.pathExistsSync(json), "asset was copied");

                    assert(true, "page loaded correctly");
                    close();
                }, close);
            }, done);
        });
    });

    it("works with steal-tools optimize", function (done) {
        optimize({
            main: "main",
            config: path.join(__dirname, "bundle_assets", "stealconfig.js")
        }, {
            quiet: true,
            minify: false,
            bundleAssets: {
                infer: true,
                glob: [
                    path.join(__dirname, "bundle_assets", "assets", "*")
                ]
            }
        }).then(function() {
            open("test/bundle_assets/prod-slim.html", function(browser, close){
                find(browser, "MODULE", function(module){
                    const logo = path.join(__dirname, "bundle_assets", "dist", "images", "logo.png");
                    assert(fs.pathExistsSync(logo), "image was copied");

                    const json = path.join(__dirname, "bundle_assets", "dist", "assets", "some.json");
                    assert(fs.pathExistsSync(json), "asset was copied");

                    assert(true, "page loaded correctly");
                    close();
                }, close);
            }, done);
        });
    })
});