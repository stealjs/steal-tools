// two is not used. Using two should throw.
import { one } from "dep";

// A default export
import anon from "dep/another";

// A package not using sideEffects: false
import { one as twoOne } from "dep2";

// A built-in module that should be ignored.
import steal from "@steal";

// Importing a module for its side effects
import "dep3";
import "dep3/global";
import "dep3/cjs";

// CSS
import "./styles.css";

// Importing a module that itself should be tree-shaken
import {default as dep4} from "dep4";

// Importing a module that re-exports another
import { rexpOne } from "./reexports";

// Import a CommonJS module
import dep5 from "dep5";

// Import a package but only use some subpackages
import { DefineMap } from "can";

export default function(){
	window.globals = {
		one,
		anon,
		twoOne,
		steal,
		rexpOne,
		dep4,
		dep5,
		DefineMap
	};

	let shouldFail = steal.import("can-connect@1.0.0#main").then(null, function(err){
		err.didFail = true;
		return err;
	});

	// return all of the exports so the tests can assert things.
	let p = Promise.all([
		steal.import("~/bundle-a"),
		steal.import("dep"),
		steal.import("dep2"),
		steal.import("dep4/other"),
		steal.import("dep4/and-another"),
		steal.import("~/from-exports"),
		shouldFail,
		steal.import("dep5/another-es-module")
	]);

	return p
	.then(([
		bundleA,
		dep,
		depTwo,
		dep4Other,
		dep4AndAnother,
		fromExports,
		canConnect,
		dep5dep5AnotherESModule
	]) => {
		return {
			anon,
			bundleA,
			dep,
			depTwo,
			dep4Other,
			dep4AndAnother,
			fromExports,
			dep5,
			canConnect,
			dep5dep5AnotherESModule
		};
	});
};
