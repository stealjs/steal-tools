var asap = require("pdenodeify"),
    assert = require("assert"),
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
                find(browser, "MODULE", function(){
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

	it("assets should be put in [BuildOptions.dest] folder", function() {
		var dest = "foo/bar";
		var root = path.join(__dirname, "bundle_assets");

		var config = {
			main: "main",
			config: path.join(root, "stealconfig.js")
		};

		var options = {
			quiet: true,
			minify: false,
			dest: dest,
			bundleAssets: {
				infer: true,
				glob: [path.join(root, "assets", "*")]
			}
		};

		return multiBuild(config, options)
			.then(function() {
				var logo = path.join(root, dest, "images", "logo.png");
				assert(fs.pathExistsSync(logo), "should bundle image");

				var json = path.join(root, dest, "assets", "some.json");
				assert(fs.pathExistsSync(json), "should bundle json file");
			})
			.then(function() {
				return asap(fs.readFile)(
					path.join(root, dest, "bundles", "main.css")
				)
				.then(function(buff) {
					return buff.toString();
				});
			})
			.then(function(cssBundle) {
				//url(../images/logo.png)
				assert(
					/url\(\.\.\/images\/logo\.png\)/.test(cssBundle),
					"rewrites paths properly"

				);
				return asap(rmdir)(path.join(root, "foo"));
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
                find(browser, "MODULE", function(){
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
});
