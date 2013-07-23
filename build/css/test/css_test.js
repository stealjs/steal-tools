global.steal = {
	nodeRequire: require,
	root: __dirname + "/../../../.."
};

var path = require("path")
  , readFile = require("../../../node/utils").readFile
  , rimraf = require("rimraf").sync
  , steal = require("stealjs");

global.STEALPRINT = false;

var build;
steal("steal/build", function(b){
	build = b;
});

suite("Css");

/**
 * Tests compressing a very basic page and one that is using steal
 */
test("css", function(done){
	expect(1);

	build('build/css/test/page.html', {to: 'build/css/test', compressor: 'uglify'}, function(){
		var prod = readFile('build/css/test/production.css').replace(/\r|\n|\s/g,""),
			expected = readFile('build/css/test/productionCompare.css').replace(/\r|\n|\s/g,"");

		cleanup();
		equal(prod, expected, "css out right");
		done();
	});
});

function cleanup(){
	rimraf('build/css/test/production.css');
	rimraf('build/css/test/production.js');
}
