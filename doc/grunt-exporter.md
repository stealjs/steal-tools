@typedef {{}} steal-tools.grunt.exporter stealExporter
@parent steal-tools.grunt 

A [http://gruntjs.com/ Grunt] multi task that load modules and write them out in different formats.

@option {Object<String,steal-tools.grunt.pluginify.task>} tasks An object of task names as keys
and PluginifyTask objects as values.

```
grunt.initConfig({
  stealExporter: {
    taskName1: { PluginifyTask1 },
    taskName2: { PluginifyTask2 }
  }
});
```

Each [steal-tools.grunt.pluginify.task] specifies:

 - A `system` object that specifies the modules to be loaded.
 - An `options` object that specifies any special loading behavior like turning logging.
 - An `outputs` object that specifies how the modules should be written out.
 
```
grunt.initConfig({
  stealPluginify: {
    taskName: {
      system : { .. },
      options: { .. },
      outputs: { .. }
    }
  }
});
```


@body

## Use

`stealPluginify` is a grunt [multi-task](http://gruntjs.com/creating-tasks#multi-tasks) that is 
used to build library projects to a variety of formats. For example, to load a "main" module and
transpile it and all of its dependencies (except jQuery) to AMD and CommonJS with debug output:

    grunt.initConfig({
      stealPluginify: {
        transpile: {
          system: {
            main: "main",
            config: __dirname + "/config.js"
          },
          options: {
            debug: true
          },
          outputs: {
            amd: {
              graphs: ["main"],
              format: "amd",
              ignore: ["jquery"]
            },
            cjs: {
              graphs: ["main"],
              format: "amd",
              ignore: ["jquery"]
            }
          }
        }
      }
    });
    
Each `stealPluginify` task is configured by three values:

 - system - describes the [System.config] values used to load modules, this is passed to [steal-tools.pluginifier].
 - options - configures special behavior of the loader such as logging.
 - outputs - configures the modules that should be written out, how they 
             should be written out, and where they should be written. 

## system

These are [System.config] values that are used to load modules during the build process. Typically you will want to specify at least the `config` and `main` options like so:

    {
	  config: __dirname + "/config.js",
      main: ["math/add", "math/subtract"]
    }

## options

Options are the [steal-tools.buildOptions] used for configuration the behavior of the build, such as whether minification is turned on or not.

## outputs

`outputs` specifies different ways the modules loaded by `system` are written out. It's
an object of [steal-tools.exporter.output] objects.  Each [steal-tools.exporter.output]
supports the following options:

{{#each [steal-tools.exporter.output].types.0.options}}
 - {{name}} <i>{{{makeTypesString types}}}</i>{{/each}}

And the options available to [steal-tools.pluginify.options].

{{#each [steal-tools.pluginify.options].types.0.options}}
 - {{name}} <i>{{{makeTypesString types}}}</i>{{/each}}

Only one of `modules`, `eachModule` or `graphs` should be specified. 


Example:

```
outputs: {
  "global first and second together without jQuery": {
    modules: ["first","second"],
    ignore: ["jquery"],
    format: "global"
  },
  "first and second seperately without jQuery": {
    eachModule: ["first","second"],
    ignore: ["jquery"],
    format: "global"
  },
  "first and second and their dependencies individually converted to amd": {
    graph: ["first","second"],
    format: "amd"
  }
}
```