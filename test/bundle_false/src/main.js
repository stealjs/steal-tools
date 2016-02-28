import $ from "jqueryt";
import dep from "src/dep";

window.app = {
  name: "main"
};

if($ === undefined){
  window.$ = {};
}
window.MODULE = dep;
