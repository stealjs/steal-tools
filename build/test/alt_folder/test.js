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

suite("Alternative Directory");

var build;
before(function(done){
	steal("steal-tools/build", function(b){
		build = b;
		done();
	});
});

test("Build from an alternative directory structure.", function(done){
	expect(1);
this.timeout(99999);

	var cwd = process.cwd();
	process.chdir(__dirname);

	var options = {
		stealDir: 'lib/steal',
		to: 'rel'
	};
debugger;

	build("cookbook/cookbook.js", options, function(){
		var productionjs = readFile("rel/production.js");

		ok(productionjs && productionjs.length, "Production.js was created.");
		process.chdir(cwd);
		done();
	});
});
