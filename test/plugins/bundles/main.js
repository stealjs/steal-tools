//bundlesConfig
System.bundles = {"bundles/main":["stealconfig","template.plug!plug","main"]};
//stealconfig
System.map["plugin-dep"] = "plugin-client-dep";

System.buildConfig = {
	map: {
		"plugin-dep": "plugin-server-dep"
	}
};

//template.plug!plug
define('template.plug!plug', function () {
    return function () {
        return 'server-Holler';
    };
});
//main
define('main', ['template.plug!plug'], function ($__0) {
    'use strict';
    var __moduleName = 'test/plugins/main';
    if (!$__0 || !$__0.__esModule)
        $__0 = { 'default': $__0 };
    var template = $__0.default;
    window.PLUGTEXT = template();
    return {};
});
