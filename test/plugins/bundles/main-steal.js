/*bundlesConfig*/
System.bundles = {"bundles/main-steal":["stealconfig","template.plug!plug","main-steal"]};
/*stealconfig*/
System.map["plugin-dep"]="plugin-client-dep",System.buildConfig={map:{"plugin-dep":"plugin-server-dep"}};
/*template.plug!plug*/
define("template.plug!plug",function(){return function(){return"server-Holler"}});
/*main-steal*/
define("main-steal",["template.plug!plug"],function(e){window.PLUGTEXT=e()});
