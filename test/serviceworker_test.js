var asap = require("pdenodeify"),
	assert = require("assert"),
	fs = require("fs-extra"),
	multiBuild = require("../lib/build/multi"),
	rmdir = require("rimraf"),
	path = require("path");

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
			quiet: true,
			minify: false,
			serviceWorker: true
		}).then(function (builtResult) {

			// a valid buildResult?
			assert.equal(builtResult.mains[0], "serviceworker@0.0.1#index");
			assert.ok(builtResult.hasOwnProperty("configuration"));
			assert.ok(builtResult.hasOwnProperty("graph"));
			assert.ok(builtResult.hasOwnProperty("loader"));

			assert.ok(fs.existsSync(path.join(__dirname, "serviceworker", "service-worker.js")));
			done();
		}).catch(done);
	});

	// for more tests, see https://github.com/stealjs/steal-serviceworker/blob/master/test/test.js
});