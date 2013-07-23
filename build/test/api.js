var fs = require("fs")
  , path = require("path")
  , mkpath = require("mkpath").sync
  , rimraf = require("rimraf").sync
  , steal = require("../../index")
  , readFile = require("../../node/utils").readFile;

suite("API Tests");

test("All API functions are exported.", function(){
	equal(typeof steal, "function", "Steal is a function.");
	equal(typeof steal.build, "function", "Build is exported.");
	equal(typeof steal.build.open, "function", "Open is exported");
});


test("Is able to build an app.", function(done){
this.timeout(999999);
debugger;


	// We have to temporary make a steal/steal.js
	createStealJs();

	var options = {
		packageSteal: true
	};

	steal.build("build/test/app.js", options, function(){
		var productionjs = readFile("build/test/production.js");

		// Make sure app.js was packaged.
		notEqual(productionjs.indexOf("This was stolen"), -1);
		rimraf("steal");
		done();
	});

});

function createStealJs(){
	mkpath(path.resolve(process.cwd(), "steal"));
	var stealjs = readFile("steal.js");
	fs.writeFileSync("steal/steal.js", stealjs);
}
