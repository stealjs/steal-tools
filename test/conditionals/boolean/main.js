import foo from "foo#?cond-true";
import bar from "bar#?cond-false";

window.app = { foo, bar };
