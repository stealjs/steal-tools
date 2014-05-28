steal(
    './app_z.css',
    '../plugins/plugin_yz/plugin_yz.js',
    '../plugins/plugin_z/plugin_z.js',

    function(){

        (init_app_z = function() {
            if (typeof(modulesLoaded) == "undefined") {
                modulesLoaded = [];
            }
            modulesLoaded.push("app_z");
        })();

    });
