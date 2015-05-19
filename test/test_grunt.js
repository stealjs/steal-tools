var assert = require("assert");
var winston = require("winston");

var registerBuild = require("../tasks/build");

var find = require("./helpers").find;
var open = require("./helpers").open;

function Grunt() {
	var self = this;
	this.done = new Promise(function(resolve){
		self.resolve = resolve;
	});
	this.log = { writeln: function(){} };
}

Grunt.prototype.registerMultiTask = function(name, desc, callback){
	this.callback = callback;
};

Grunt.prototype.options = function(){
	return this._options;
};

Grunt.prototype.async = function(){
	return function(){
		this.resolve();
	}.bind(this);
};

Grunt.prototype.run = function(options){
	this._options = options;
	this.callback();
	return this.done;
};

describe("steal-build grunt task", function(){
	beforeEach(function(){
		this.myLog = winston.info;
		winston.info = function(){};
	});

	afterEach(function(){
		winston.info = this.myLog;
	});

	it("buildOptions is optional", function(done){
		var grunt = new Grunt();
		registerBuild(grunt);

		grunt.run({
			system: {
				config: __dirname + "/stealconfig.js",
				main: "basics/basics"
			}
		}).then(done);
	});
});
