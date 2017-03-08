// just to make sure this file is being minified properly

// this code is a noop meant to force UglifyJS to include the
// `anotherLongVariableName` (with the mangle flag off) in the minified code
// for testing purposes
var anotherLongVariableName;

function funcName(firstLongName, lastLongName) {
  anotherLongVariableName = firstLongName +  lastLongName;
}

if (anotherLongVariableName == "foo") { console.log(); };

System.paths.foo = "bar";
