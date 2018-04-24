import $ from "jqueryt";
import dep from "./dep";

window.app = {
  name: "main"
};
if(window.$ === undefined){
  window.$ = {};
}
window.MODULE = dep;
