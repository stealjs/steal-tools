import foo from "foo";

let name = "index";

//!steal-remove-start
window.REMOVEME = true;
//!steal-remove-end

export {
	name,
	foo
};
