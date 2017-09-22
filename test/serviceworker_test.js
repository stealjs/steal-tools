var asap = require("pdenodeify"),
	assert = require("assert"),
	comparify = require("comparify"),
	fs = require("fs-extra"),
	multiBuild = require("../lib/build/multi"),
	rmdir = require("rimraf"),
	path = require("path"),
	stealTools = require("../index"),
	testHelpers = require("./helpers");

var precache = require("steal-serviceworker");

var find = testHelpers.find;
var open = testHelpers.open;

describe("serviceworker", function () {
	this.timeout(5000);

	before(function (done) {
		asap(rmdir)(__dirname + "/serviceworker/dist")
			.then(function () {
				fs.unlink(path.join(__dirname, "serviceworker", "service-worker.js"), function () {
					done();
				});
			});
	});

	it("works", function (done) {
		multiBuild({
			config: __dirname + "/serviceworker/package.json!npm"
		}, {
			quiet: false,
			serviceWorker: true,
			bundleAssets: true
		}).then(function (builtResult) {

			assert.ok(fs.existsSync(path.join(__dirname, "serviceworker", "service-worker.js")));
			done();
		}).catch(done);
	});
});