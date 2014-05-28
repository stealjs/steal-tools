steal(
    './app_y.css',
    '../plugins/plugin_xy/plugin_xy.js',
    '../plugins/plugin_yz/plugin_yz.js',

    function(){

        (init_app_y = function() {
            if (typeof(modulesLoaded) == "undefined") {
                modulesLoaded = [];
            }
            modulesLoaded.push("app_y");
        })();

    });
