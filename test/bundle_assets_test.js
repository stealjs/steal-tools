var asap = require("pdenodeify"),
    assert = require("assert"),
    comparify = require("comparify"),
    fs = require("fs-extra"),
    multiBuild = require("../lib/build/multi"),
    rmdir = require("rimraf"),
    path = require("path"),
    stealTools = require("../index"),
    testHelpers = require("./helpers");

var find = testHelpers.find;
var open = testHelpers.open;

describe("bundleAssets", function(){
    this.timeout(5000);

    before(function(done){
        asap(rmdir)(__dirname + "/bundle_assets/dist")
            .then(function(){
                done();
            });
    });

    it("works", function(done){
        multiBuild({
            config: __dirname + "/bundle_assets/package.json!npm"
        }, {
            quiet: true,
            bundleAssets: true
        }).then(function(){
            open("test/bundle_assets/prod.html", function(browser, close){
                find(browser, "MODULE", function(module){
                    assert(true, "page loaded correctly");
                    close();
                }, close);
            }, done);
        });
    });
});