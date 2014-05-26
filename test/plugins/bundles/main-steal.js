/*bundlesConfig*/
System.bundles = {"bundles/main-steal":["stealconfig","plugin-client-dep","plug","template.plug!plug","main-steal"]};
/*stealconfig*/
System.map["plugin-dep"] = "plugin-client-dep";

System.buildConfig = {
	map: {
		"plugin-dep": "plugin-server-dep"
	}
};

/*plugin-client-dep*/
System.set('plugin-client-dep', Module({}));
/*plug*/
System.set('plug', Module({}));
/*template.plug!plug*/
define('template.plug!plug', function () {
    return function () {
        return 'server-Holler';
    };
});
/*main-steal*/
define('main-steal', ['template.plug!plug'], function (template) {
    window.PLUGTEXT = template();
});
