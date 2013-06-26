var path = require("path"),
	steal = require("stealjs"),
	rimraf = require("rimraf").sync;

steal.config({
	baseUrl: path.resolve(__dirname, "../../..")
});

global.STEALPRINT = false;

var build;
before(function(done){
	steal("build", function(b){
		build = b; done();
	});
});

suite("Css");

/**
 * Tests compressing a very basic page and one that is using steal
 */
test("css", function(done){
	expect(0);

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
