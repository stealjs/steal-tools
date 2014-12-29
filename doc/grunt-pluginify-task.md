@typedef {{}} stealTools.grunt.pluginify.task PluginifyTask

A task object of the [stealTools.grunt.pluginify pluginify] grunt task.

@option {Object} system Specifies the [System.config] values used 
to load modules.  At a minimum [System.main main] and either [System.baseURL baseURL]
or [System.configPath configPath] must be specified.

```
system: {
  main: ['mymodule'],
  config: __dirname+"/config.js"
}
```


@option {Object} options Options for the pluginify task such as minification.




@option {stealTools.grunt.pluginify.output} outputs Configures output files to be written.
