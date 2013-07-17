var steal = require("stealjs")
  , rimraf = require("rimraf").sync
  , readFile = require("../../../node/utils").readFile;

STEALPRINT = false;

suite("Pluginify");

var build, pluginify;
before(function(done){
	steal("build",
	"build/pluginify", function(b,p){
		build = b;
		pluginify = p;
		done();
	});
});

test("Pluginify a thing", function(done){
	expect(1);

	pluginify("build/pluginify/test/app",{
		nojquery: true,
		nocanjs: true,
		out: "build/pluginify/test/app/app.plugin.js"
	}, function(){
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
