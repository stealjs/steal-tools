var path = require("path");

global.steal = {
	nodeRequire: require,
	root: path.resolve(__dirname, "../../..")
};


var fs = require("fs"),
	steal = require("steal"),
	readFile = require("../../node/utils.js").readFile,
	mkpath = require("mkpath").sync,
	rimraf = require("rimraf").sync;

STEALPRINT = false;

suite("Build");

var build;
before(function(done){
	steal("steal-tools/build", function(b){
		build = b;
		done();
	});
});

test("Steal is packaged with the build.", function(done){
	expect(2);

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

test("File isn't minified with --no-minify flag.", function(done){
	expect(1);

	// We have to temporarily create a steal/steal.js
	createStealJs();
	rimraf("build/test/production.js");

	var options = {
		minify: false
	};

	build("build/test/app.js", options, function(){
		rimraf("steal");

		var productionjs = readFile("build/test/production.js");

		// See if our console.log has been transformed into an express as uglify likes to do.
		var hasTransformed = productionjs.indexOf('console.log("This was stolen");') === -1;

		equal(hasTransformed, false, "Statement remains in tact.");
		done();
	});

});

function createStealJs(){
	mkpath(path.resolve(process.cwd(), "steal"));
	var stealjs = readFile("steal.js");
	fs.writeFileSync("steal/steal.js", stealjs);
}
