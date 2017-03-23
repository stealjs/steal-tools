"format cjs";

var global = require("global");

var thisObjectHasABigName = {
	foo: "bar"
};

if(process.env.ENVIFY_VAR !== "test_value") { 
	thisObjectHasABigName.envifyTest = "when envify is turned on this should be removed"; 
}

module.exports = thisObjectHasABigName;
