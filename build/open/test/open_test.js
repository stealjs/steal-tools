var steal = require('../../../node/index.js');

/**
 * Tests compressing a very basic page and one that is using steal
 */
steal('steal', 'steal/test/test.js', function( s ) {
	s.test.module("steal/build/open")
	
	s.test.test("opens a basic page", function(){
		steal("steal", "steal/build",function(s2){
			
			s2.build.open('steal/build/open/test/basic.html',function(opener){
				s.test.ok(opener,"got opener");
				var items = [];
				opener.each(function( options ){
					items.push(options.src);
				});
			});
			
		});
	});
	s.test.test("cleans up globals", function(){

		steal("steal", "steal/build",function(s2){
			s2.build.open('steal/build/open/test/basic.html',function(opener){
				s.test.equals(window.appFiles.length, 1)
			});
			s2.build.open('steal/build/open/test/basic.html',function(opener){
				s.test.equals(window.appFiles.length, 1, 'namespace cleaned itself up')
			});
			
		});
	});

});