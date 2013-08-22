var path = require("path");

global.steal = {
	nodeRequire: require,
	root: path.resolve(__dirname, "../../../..")
};


var fs = require("fs"),
	steal = require("steal"),
	readFile = require("../../../node/utils").readFile,
	mkpath = require("mkpath").sync,
	rimraf = require("rimraf").sync;

STEALPRINT = false;

suite("Open");

var build;
before(function(done){
	steal("steal-tools/build", function(b){
		build = b;
		done();
	});
});

test("Build from an alternative directory structure.", function(done){
	expect(1);

	process.chdir(__dirname);

	var options = {
		stealDir: 'lib/steal'
	};

	build("cookbook/cookbook.js", options, function(){
		var productionjs = readFile("rel/production.js");

		ok(productionjs && productionjs.length, "Production.js was created.");
	});
});
