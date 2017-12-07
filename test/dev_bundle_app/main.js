"format cjs";

//!steal-remove-start
var someCode = "it worked";
//!steal-remove-end

window.MODULE = typeof someCode !== "undefined" ? someCode : "it failed";
