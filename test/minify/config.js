System.paths.foo = "bar";

function getKeysOf(obj) {
	return Object.keys(obj);
}

// make sure this file is minified, too.
// The code below is used to assert uglify-js can take options
var anotherLongObjectName = {
	bar: "baz"
};

// this line prevents the minifier to inline the variable in the export,
// which breaks the test where we make sure steal can pass option down to terser
getKeysOf(anotherLongObjectName);

module.exports = anotherLongObjectName;
