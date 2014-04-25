/*bundlesConfig*/
System.bundles = {"bundles/main":["stealconfig","template.plug!plug","main"]};
/*stealconfig*/
System.map["plugin-dep"]="plugin-client-dep",System.buildConfig={map:{"plugin-dep":"plugin-server-dep"}};
/*template.plug!plug*/
define("template.plug!plug",function(){return function(){return"server-Holler"}});
/*main*/
define("main",["template.plug!plug"],function(e){"use strict";e&&e.__esModule||(e={"default":e});var t=e.default;return window.PLUGTEXT=t(),{}});
