/*bundlesConfig*/
System.bundles = {"bundles/main":["stealconfig","steal/css","main"],"bundles/main.css!":["main.css!steal/css"]};
/*stealconfig*/

/*steal/css*/
define("steal/css",function(e,t){t.instantiate=function(e){return{deps:[],execute:function(){if(e.source){var t=document.head||document.getElementsByTagName("head")[0],n=document.createElement("style");n.type="text/css",n.styleSheet?n.styleSheet.cssText=e.source:n.appendChild(document.createTextNode(e.source)),t.appendChild(n)}return new System.global.Module({})}}},t.buildType="css",t.includInBuild=!0});
/*main*/
define("main",["main.css!"],function(e){"use strict";return e&&e.__esModule||(e={"default":e}),window.STYLE_CONTENT=document.getElementsByTagName("style")[0].textContent,{}});
