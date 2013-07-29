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

		// Get the letter uglify assigned.
		var letter = /typeof\ ([a-z])/.exec(data)[1];

		var expects =
			'!function(){var ' + letter + 
			'=function(){return{thisModule:"exists"}}();' +
			'!function(' + letter + '){window.APP_ON="object"==typeof ' +
			letter + '}(' + letter +')}();';
		equal(data, expects, "Minified output is correct");
		done();
	});
});

test("getFunctions", function(){
	expect(1);
	
	var js = readFile('build/pluginify/test/test_steals.js');
	var firstFunc = pluginify.getFunction(js, 0);
	
	equal(firstFunc, readFile('build/pluginify/test/firstFunc.js'));
});

function rm(){
	Array.prototype.slice.call(arguments).forEach(function(file){
		rimraf(file);
	});
}
