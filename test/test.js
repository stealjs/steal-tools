var fs     = require('fs'),
	rimraf = require('rimraf');

// this is test helpers for steal
steal('steal', function(steal){

var assertions = [],
	module = "";
steal.test =  {
	//clears every property fromt he window, returns steal (might return old stuff)
	clear: function() {
		return;
	},
	// compares the file character counts, which is much faster than the string comparison
	compareFiles: function(expected, actual, msg){
		var actualJS = fs.readFileSync(actual),
			expectedJS = fs.readFileSync(expected);
		this.equals(actualJS.length, expectedJS.length, msg);
	},
	getWindow: function() {
		return (function(){return this}).call(null,0)
	},
	expect: function(num){
		var self = this,
			checkReady = function(){
				if(assertions.length >= num)
					return true;
				return false;
			}
		while(!checkReady()){
			setTimeout(function(){
				self.expect(num);
			}, 300);
		}
	},
	wait: function( name ) {
		var self = this,
			checkExists = function(name){
				var parts = name.split(".");
				var cur = this;
				for(var i =0; i < parts.length; i++){
					if(! cur[parts[i]] ){
						return false;
					}else
						cur = cur[parts[i]];
				}
				return true;
			}
		if(!checkExists(name)){
			setTimeout(function(){
				self.wait(name);
			}, 300);
		}
	},
	sleep: function( duration ){
		throw('Sleep is not available in the Node.js. Rewrite the code to use the setTimeout instead');
	},
	print: function() {
		var win =this.getWindow();
		for(var n in win) console.log(n);
	},
	deleteDir: function( dir ) {
		rimraf.sync(dir);
	},
	remove: function() {
		for(var i=0; i < arguments.length; i++){
			this.deleteDir(arguments[i])
		}
	},
	testNamespace: function() {
		var win = this.getWindow();
		for(var n in win) {
			// add parser for coffeescript ... boo!
			if(n !== "_S" && n !== "STEALPRINT" && n !== "parser")
				throw "Namespace Pollution "+n;
		}
	},
	equals: function( a, b, message ) {
		if(a !== b)
			throw ""+a+"!="+b+":"+message
		else{
			assertions.push(message)
		}
	},
	ok: function( v, message ) {
		if(!v){
			throw "not "+v+" "+message
		}
		else{
			assertions.push(message)
		}
	},
	open: function( src , fireLoad ) {
		return
		load("steal/rhino/env.js");
		if(typeof Envjs == 'undefined'){
			print("I DON'T GET IT")
		}
		Envjs(src, {
			scriptTypes: {
				"text/javascript": true,
				"text/envjs": true,
				"": true
			},
			fireLoad: true,
			logLevel: 2,
			afterScriptLoad: {
				// prevent $(document).ready from being called even though load is fired
				"jquery.js": function( script ) {
					window.jQuery && jQuery.readyWait++;
				},
				"steal.js": function(script){
					// a flag to tell steal we're in "build" mode
					// this is used to completely ignore files with the "ignore" flag set
					window.steal.isBuilding = true;
					// if there's timers (like in less) we'll never reach next line 
					// unless we bind to done here and kill timers
					window.steal.one('done', function(){
						Envjs.clear();
					});
					newSteal = window.steal;
				}
			},
			dontPrintUserAgent: true
		});
		
	},
	test : function(name, test){
		assertions = [];
		test(steal.test);
		console.log("  -- "+name+" "+assertions.length)
	},
	module : function(name ){
		module = name;
		console.log("==========  "+name+"  =========")
	}
}
	return steal;
})