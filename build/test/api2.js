global.steal = {
	root: __dirname + "/../../..",
	nodeRequire: require
};

var fs = require("fs")
  , path = require("path")
  , mkpath = require("mkpath").sync
  , steal = require("stealjs")
  , rimraf = require("rimraf").sync
  , readFile = require("../../node/utils").readFile;

suite("API Tests using StealJS");

test("Build is fetched by stealjs", function(){
	expect(2);

	steal("steal/build", function(build){
		equal(typeof build, "function", "Build is a function.");
		equal(typeof build.open, "function", "Open is a function.");
	});

});

test("Is able to build an app.", function(done){
	// We have to temporary make a steal/steal.js
	createStealJs();

	var options = {
		packageSteal: true
	};

	steal("steal", function(st){
		var build = st.build;

		build("build/test/app.js", options, function(){
			var productionjs = readFile("build/test/production.js");

			// Make sure app.js was packaged.
			notEqual(productionjs.indexOf("This was stolen"), -1);
			rimraf("steal");
			done();
		});
	});

});

function createStealJs(){
	mkpath(path.resolve(process.cwd(), "steal"));
	var stealjs = readFile("steal.js");
	fs.writeFileSync("steal/steal.js", stealjs);
}
