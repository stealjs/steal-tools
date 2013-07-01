var steal = require("stealjs"),
	fs = require("fs"),
	jsdom = require("jsdom").jsdom,
	path = require("path"),
	rimraf = require("rimraf").sync;

steal.config({
	baseUrl: path.resolve(__dirname, "../../..")
});

global.STEALPRINT = false;

before(function(done){
	steal('build', 'build/packages', function(){
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

/**
 * Tests compressing a very basic page and one that is using steal
 */
suite("Packages")

test("appA is undefined", function(done){
	expect(1);

	steal.build.open('build/packages/test/packages_test/prod.html', function(opener){
		var window = opener.doc.defaultView;

		equal(typeof window.appA, "undefined");
		done();
	});
});

/*
 * appA attaches the value `true` to window.appA
 */
test("appA is true", function(done){
	expect(2);
	
	steal.build.open('build/packages/test/packages_test/prod.html#a', function(opener){
		var window = opener.doc.defaultView;

		equal(window.location.hash, "#a");
		equal(window.appA, true);
		done();
	});
});

test("All files are created", function(done){
	var filesToRemove = [
		'production.js',
		'packages/app_a.js',
		'packages/app_b.js',
		'packages/app_c.js',
		'packages/app_d.js',
		'packages/app_a-app_b.js',
		'packages/app_a-app_b-app_c-app_d.js'
	];
	expect(filesToRemove.length);
	
	var p;
	for(var i=0;i<filesToRemove.length; i++){
		p = 'build/packages/test/packages_test/'+filesToRemove[i];
		p = path.resolve(process.cwd(), p);
		ok(fs.existsSync(p));
		rimraf(p);
	}
	
	done();
});
