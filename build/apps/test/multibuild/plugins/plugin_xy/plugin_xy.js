steal(
	'./plugin_xy.css',
  '../nested_plugin_xyz/nested_plugin_xyz.js',

	function(){

        (init_plugin_xy = function() {
            if (typeof(modulesLoaded) == "undefined") {
                modulesLoaded = [];
            }
            modulesLoaded.push("plugin_xy");
        })();
		
	});
