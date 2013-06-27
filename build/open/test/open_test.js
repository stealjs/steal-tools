var path = require("path"),
	steal = require("stealjs");

steal.config({
	baseUrl: path.resolve(__dirname, "../../..")
});

suite("Open");

var build;
before(function(done){
	steal("build", function(b){
		build = b;
		done();
	});
});

test("Build is fetched", function(){
	expect(2);
	notEqual(typeof build, undefined);
	equal(typeof build, "function");
});

test("Tests compressing a very basic page and one that is using steal", function(done){
	expect(4);

	build.open("build/open/test/basic.html",function(opener){
		notEqual(opener, null);
		equal(typeof opener, "object");
		equal(typeof opener.each, "function");
		notEqual(opener.rootSteal, steal);		


		done();
	});
});
