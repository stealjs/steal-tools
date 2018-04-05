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

// Importing a module that itself should be tree-shaken
import "dep4";

// Importing a module that re-exports another
import { rexpOne } from "./reexports";

export default function(){
	// return all of the exports so the tests can assert things.
	let p = Promise.all([
		steal.import("~/bundle-a"),
		steal.import("dep"),
		steal.import("dep2"),
		steal.import("dep4/other"),
		steal.import("dep4/and-another"),
		steal.import("~/from-exports")
	]);

	return p
	.then(([
		bundleA,
		dep,
		depTwo,
		dep4Other,
		dep4AndAnother,
		fromExports
	]) => {
		return {
			anon,
			bundleA,
			dep,
			depTwo,
			dep4Other,
			dep4AndAnother,
			fromExports
		};
	});
};
