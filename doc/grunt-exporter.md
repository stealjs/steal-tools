@typedef {{}} steal-tools.grunt.exporter stealExporter
@parent steal-tools.grunt 

A [http://gruntjs.com/ Grunt] multi task that load modules and write them out in different formats.

@option {Object<String,steal-tools.exporter.object>} tasks An object of task names as keys
and ExporterObjects as values.

```
grunt.initConfig({
  stealExporter: {
    taskName1: { ExporterObject1 },
    taskName2: { ExporterObject2 }
  }
});
```

Each [steal-tools.exporter.object] specifies:

 - A `system` object that specifies the modules to be loaded.
 - An `options` object that specifies any special loading behavior like turning logging.
 - An `outputs` object that specifies how the modules should be written out.
 
```
grunt.initConfig({
  stealExporter: {
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

`stealExporter` is a grunt [multi-task](http://gruntjs.com/creating-tasks#multi-tasks) that is 
used to build library projects to a variety of formats. For example, to load a "main" module and
transpile it and all of its dependencies (except jQuery) to AMD and CommonJS with debug output:

    grunt.initConfig({
      stealExporter: {
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
    
Each [steal-tools.exporter.object] task is configured by three values:

 - system - describes the [System.config] values used to load modules, this is passed to [steal-tools.pluginifier].
 - options - configures special behavior of the loader such as logging.
 - outputs - configures the modules that should be written out, how they 
             should be written out, and where they should be written. 

The [steal-tools.exporter.object] documentation has more information.