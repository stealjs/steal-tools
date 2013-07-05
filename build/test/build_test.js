var path = require("path"),
	fs = require("fs"),
	steal = require("stealjs"),
	readFile = require("../../node/utils.js").readFile,
	mkpath = require("mkpath").sync,
	rimraf = require("rimraf").sync;

STEALPRINT = false;

suite("Open");

var build;
before(function(done){
	steal("build", function(b){
		build = b;
		done();
	});
});

test("Steal is packaged with the build.", function(done){
	expect(2);

this.timeout(99999);
debugger;

	// We have to temporary make a steal/steal.js
	createStealJs();

	var options = {
		compressor: "uglify",
		packageSteal: true
	};

	build("build/test/app.js", options, function(){
		var productionjs = readFile("build/test/production.js");

		// Make sure steal has been packaged.
		ok(productionjs.indexOf("win.steal=") !== -1);

		// Make sure app.js was packaged.
		ok(productionjs.indexOf("This was stolen") !== -1);
		rimraf("steal");
		done();
	});

});

function createStealJs(){
	mkpath(path.resolve(process.cwd(), "steal"));
	var stealjs = readFile("steal.js");
	fs.writeFileSync("steal/steal.js", stealjs);
}
