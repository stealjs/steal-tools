var steal = require("../../node");

suite("Js");

before(function(done){
	steal("steal/build/js", done);
});

/**
 * Tests compressing a very basic page and one that is using steal
 */

test("makePackage", function(){
	expect(2);

	var res = steal.build.js.makePackage(
	[
		{
			buildType : "js",
			id : "a.js",
			text: "a"
		},
		{
			buildType : "js",
			id : "b.js",
			text: "b"
		},
		{
			buildType : "css",
			id : "c.css",
			text: "c"
		}
	],
	{
		"package/1.js" : ["jquery/jquery.js"]
	},
	"package/css.css",{stealOwnModules: true})
	
	equal(
		res.js,
		// tell what this file has
		'steal.has("a.js","b.js");'+
		// steal any packages this package depends on
		'steal({id:"package/1.js",waits:!0,has:["jquery/jquery.js"]});'+
		'steal({id:"package/css.css",waits:!0,has:["c.css"]});'+
		// steal the resources production.js needs so it can be marked complete
		'steal("a.js","b.js");'+
		// clear pending for future steals
		'steal.pushPending();'+
		// the files and executed contexts
		'a;steal.executed("a.js");b;steal.executed("b.js");'+
		// pop the previous pending state into being so when this file completes, it's depeendencies will be executed
		'steal.popPending();'+
		'\n',
		"js works");
		
	equal(res.css.code,"c")
});

test("makePackage with excludes", function(){
	var res = steal.build.js.makePackage(
	[
		{
			buildType : "js",
			id : "a.js",
			text: "a"
		},
		{
			buildType : "js",
			id : "b/b.js",
			text: "b"
		},
		{
			buildType : "css",
			id : "c.css",
			text: "c"
		}
	],
	{
		"package/1.js" : ["jquery/jquery.js"]
	},
	"package/css.css", { exclude: ['b/b.js'] })
	
	equal(
		res.js,
		// tell what this file has
		'steal.has("a.js");'+
		// steal any packages this package depends on
		'steal({id:"package/1.js",waits:!0,has:["jquery/jquery.js"]});'+
		'steal({id:"package/css.css",waits:!0,has:["c.css"]});'+
		// clear pending for future steals
		'steal.pushPending();'+
		// the files and executed contexts
		'a;steal.executed("a.js");'+
		// pop the previous pending state into being so when this file completes, it's depeendencies will be executed
		'steal.popPending();'+
		'\n',
		"js works");
		
	equal(res.css.code,"c")
});
