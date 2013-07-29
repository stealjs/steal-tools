global.steal = {
	nodeRequire: require,
	root: __dirname + "/../../.."
};

var steal = require("steal");

STEALPRINT = false;

steal("steal-tools/install",
	"child_process",
	"fs",
	"rimraf",
	function(install, cp, fs, rr){

	var exec = cp.exec
	  , exists = fs.existsSync;

	/*
	 * A test that changes the directory to
	 * steal-tools/install/test/app and removes
	 * it when complete.
	**/
	function withAppTest(name, callback) {
		var rimraf = rr.sync
	    , appDir = __dirname + "/app"
		  , baseDir = __dirname + "/../..";

		test(name, function(done){
			process.chdir(appDir);

			function complete(){
				rimraf("../app/steal");
				rimraf("../app/stealconfig.js");
				process.chdir(baseDir);
				done();
			}

			callback.call(this, complete);
		});
	}

	function allFilesInstalled(){
		var files = [
			"stealconfig.js",
			"steal/steal.js",
			"steal/dev/dev.js",
			"steal/less/less.js",
			"steal/less/less_engine.js",
			"steal/coffee/coffee.js",
			"steal/coffee/coffee-script.js"
		];

		files.forEach(function(file){
			var fullPath = __dirname + "/app/" + file;

			ok(exists(fullPath));
		});
	}

	suite("Install");

	withAppTest("Install steal into a directory using cmd-line app.", function(done){
		exec("steal-install", function(err, stdout, stderr){
			equal(err, null, "Did not return an error.");
			equal(stderr.length, 0, "There is no stderr");
			ok(stdout.length > 0, "There is a stdout.");
			allFilesInstalled();
			done();
		});
	});

	withAppTest("Install steal into a directory using API.", function(done){
		install(function(){
			ok(true, "Callback called.");
			allFilesInstalled();
			done();
		});
	});

});
