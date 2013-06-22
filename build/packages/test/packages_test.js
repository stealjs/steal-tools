var steal = require("../../../node"),
	jsdom = require("jsdom").jsdom,
	path = require("path");

global.STEALPRINT = false;

before(function(done){
	steal('steal/build/packages', function(){
		var options = {
			compressor: "uglify",
			to: "build/packages/test/packages_test",
			minify: true,
			depth: 3
		};

		steal.build.packages("build/packages/test/packages_test/scripts/build.html", options, function(){
			done();
		});
	});
});

// Create a jsdom window given a file
function getWindowFromFile(file){
	var full = path.resolve(process.cwd(), file.split("#")[0]);
	var html = readFile(full);
	var jsDoc = jsdom(html, null, {
		url: path.resolve(process.cwd(), file)
	});
	var jsWin = jsDoc.createWindow();
	return jsWin;
}


/**
 * Tests compressing a very basic page and one that is using steal
 */
suite("Packages")

test("appA is undefined", function(done){
	expect(1);

	var jsWin = getWindowFromFile('build/packages/test/packages_test/prod.html');
	jsWin.addEventListener("load", function(){
		var window = jsWin;

		ok(typeof window.appA === "undefined", "appA is undefined");
		done();
	});
});

test("appA is true", function(done){
	expect(2);

	var jsWin = getWindowFromFile('build/packages/test/packages_test/prod.html#a');
	jsWin.addEventListener("load", function(){
		var window = jsWin;

		equal(window.location.hash, "#a");
		equal(window.appA, true);
		done();
	});


	return;
	s.test.open('steal/build/packages/test/packages_test/prod.html')
	s.test.ok(typeof window.appA === "undefined","appA is undefined");
	s.test.clear();
	s.test.open('steal/build/packages/test/packages_test/prod.html#a')
	s.test.equals(window.appA, true);

			
	
	// TODO change this test to actually open the app in packages mode instead of hardcoding the files
	var filesToRemove = [
		'production.js',
		'packages/app_a.js',
		'packages/app_b.js',
		'packages/app_c.js',
		'packages/app_d.js',
		'packages/app_a-app_b.js',
		'packages/app_a-app_b-app_c-app_d.js'
	];
	
	var path;
	for(var i=0;i<filesToRemove.length; i++){
		path = 'steal/build/packages/test/packages_test/'+filesToRemove[i];
		// print('checking '+path)
		s.test.ok(s.File(path).exists());
		s.test.remove(path);
	}

});
