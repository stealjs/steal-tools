var assert = require('assert'),
	steal = require('../../../node');

describe("Open", function(){
	var build;

	before(function(done){
		steal("steal/build", function(b){
			build = b;
			done();
		});
	});

	it("Build is fetched", function(){
		assert.notEqual(build, null);
		assert.equal(typeof build, "function");
	});

	it("Tests compressing a very basic page and one that is using steal", function(done){
		build.open("build/open/test/basic.html",function(opener){
			assert.notEqual(opener, null);
			assert.equal(typeof opener, "object");
			assert.equal(typeof opener.each, "function");

			assert.doesNotThrow(function(){
				var items = [];
				opener.each(function( options ){
					items.push(options.src);
				});
			});

			done();
		});
	});
	
});
