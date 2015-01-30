@function steal-tools.exporter exporter
@parent steal-tools.JS 

@signature `stealTools.exporter( exporterTask, defaults, modules )`

@param {steal-tools.exporter.object} exporterTask An [steal-tools.exporter.object] with the following properties:

  @option {steal-tools.SystemConfig} config `System.config` data needed to load
  all the modules that need exporting.

  @option {{}} [options] Options that configure logging.
  
  @option {Object<String,steal-tools.exporter.output>} outputs Configures output files to be written.

@param {Object<String,steal-tools.exporter.output>} [defaults] An object of names and default ExportOutput
values.

@param {Array<{}>} [modules] An array of module data that a [steal-tools.exporter.output]'s
`modules`, `eachModule`, `graphs` or `ignore` can be filtered against.

@return {Promise} A promise that resolves when all outputs have been written out.

@body

## Use

The basic use of `stealTools` exporter is to give it a "system" that is able to load your project's modules
and several "outputs" that write out those modules in a new form:

```
var stealTools = require("stealTools");
stealTools.exporter({
  system: {
    main: "myproject",
    config: __dirname+"/config.js"
  },
  options: {
    verbose: true
  },
  outputs: {
    amd: {
      format: "amd",
      graphs: ["myproject"],
      dest: __dirname+"/dist/amd"
    },
    standalone: {
      format: "global",
      modules: ["myproject"],
      dest: __dirname+"/dist/standalone.js",
      minify: true
    }
  }
})
```

## exporterTask

The first argument is an [steal-tools.exporter.object].  Detail about its API and options can be found on its page.

## defaults

As sometimes the same options need to be set over and over again, the `defaults` option can 
contain default values each output can call to:

```
var stealTools = require("stealTools");
stealTools.exporter({
  system: {
    main: "myproject",  config: __dirname+"/config.js"
  },
  outputs: {
    "+commonjs": {
      dest: __dirname+"/dist/cjs"
    },
    "+cjs+minify": {
      dest: __dirname+"/dist/min/cjs"
    }
  }
},{
  "commonjs" : {
    modules: ["myproject"],
    format: "cjs"
  },
  "minify": {
    minify: true,
    uglifyOptions: { ... }
  }
})
```

The [steal-tools/lib/build/helpers/cjs] and other export helpers can also be mixed in output names by default:

```
var stealTools = require("stealTools");
stealTools.exporter({
  system: {
    main: "myproject",  config: __dirname+"/config.js"
  },
  outputs: {
    "+cjs" : {}
  }
})
```

## modules

Deprecated.
