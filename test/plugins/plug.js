var prefix = require("plugin-dep").prefix;

module.exports = {
	get something() {
		throw new Error("This should not be called!");
	},

	translate: function(load) {
		return "define(function(){"+
			"return function(){"+
				"return '"+prefix()+"-"+load.source+"'"+
			"}"+
		"})";
	}
};
