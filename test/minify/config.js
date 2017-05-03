System.paths.foo = "bar";

// make sure this file is minified, too.
// The code below is used to assert uglify-js can take options
var anotherLongObjectName = {
	bar: "baz"
};
module.exports = anotherLongObjectName;

