import bar from "./bar";
import steal from "@steal";

bar();

steal.import("./baz")
	.then(() => console.log('baz loaded'));
