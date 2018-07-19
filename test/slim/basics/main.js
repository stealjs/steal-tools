var foo = require("./foo");

if (process.env.NODE_ENV !== "production") {
	console.log("hello world");
}

window.foo = foo;
