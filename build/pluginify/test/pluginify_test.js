var steal = require("steal")
  , rimraf = require("rimraf").sync
  , readFile = require("../../../node/utils").readFile;

STEALPRINT = false;

suite("Pluginify");

var build, pluginify;
before(function(done){
	steal("steal-tools/build",
	"steal-tools/build/pluginify", function(b,p){
		build = b;
		pluginify = p;
		done();
	});
});

test("Pluginify a thing", function(done){
	expect(1);

	process.chdir("build/pluginify/test");

	pluginify("app/app.html",{
		nojquery: true,
		nocanjs: true,
		out: "app/app.plugin.js"
	}, function(){
		process.chdir("../../..");
		var data = readFile("build/pluginify/test/app/app.plugin.js");

		// Get the letters uglify assigned.
		var matches = /\(([a-z]),([a-z])\)/.exec(data);
		var l1 = matches[1];
		var l2 = matches[2];

		var expects =
			'!function(' + l2 + '){var ' + l1 + 
			'=function(){return{thisModule:"exists"}}();' +
			'!function(' + l2 + '){window.APP_ON="object"==typeof ' +
			l2 + '}(' + l1 + ',' + l2 +')}();';
		equal(data, expects, "Minified output is correct");
		done();
	});
});

test("Pluginify a thing with css", function(done){
	process.chdir("build/pluginify/test");

	pluginify("app/app.html",{
		nojquery: true,
		nocanjs: true,
		out: "app/app.plugin.js"
	}, function(){
		process.chdir("../../..");
		var data = readFile("build/pluginify/test/app/production.css");

		var expects = "h1{color:#008000}";
		equal(data, expects, "Minified css is correct.");
		done();
	});
});

test("getFunctions", function(){
	expect(1);
	
	var js = readFile('build/pluginify/test/test_steals.js');
	var firstFunc = pluginify.getFunction(js, 0);
	
	equal(firstFunc, readFile('build/pluginify/test/firstFunc.js'));
});
