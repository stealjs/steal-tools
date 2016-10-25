@typedef {{}} steal-tools.SystemConfig SystemConfig
@parent steal-tools.types

Configuration values needed for StealJS to load modules. Some set of the following
values are required:

@option {String|Array<moduleName>} [main] The module, or modules, that should be 
imported.  This sets [System.main]. 

 - __It is optional if__ a `config` is provided.

@option {String} [config] The path to a configuration file. This
will also specify `baseURL`, and sometimes `main`. This sets [System.configPath].

 - __It is optional if__ `main` is provided and no other configurations are needed.
 - __It is required if__ you are using NPM.

@option {Object<moduleName,metadata>} [meta] A object of <moduleNames> that contain [metadata](http://stealjs.com/docs/System.meta.html)

@option {String} [baseURL] If a configuration file is not used, 
the [System.baseURL baseURL] value must be set.

@option {String} [bundlesPath='dist/bundle']  Specifies the path where the production bundles should be 
  placed. Often, this is the same value as [System.bundlesPath]. By default, the location is `"dist/bundles"`.

  The path can be specified in three ways:

 - Absolute path - bundlesPath starts with `/`, or matches _/^\w+:[\/\\]/_, like:  `__dirname+"/place"`, or `"c:\my\bundles"`.
 - Relative to `process.cwd()` - bundlesPath starts with `./`, like `"./place"`.
 - Relative to [System.baseURL baseURL] - bundlesPath looks like: "packages", "foo/bar".
 
@option {Array<moduleName>} [bundle] An array of <moduleNames> that should be progressively loaded.
  
@option {Object<System.jsonOptions>} [jsonOptions] Provides options that can be applied to JSON loading.
  Using the `transform` method will run through all JSON files while building, also the `package.json`'s of loaded modules
  (if using NPM). 

@body

## Use

[steal-tools.build], [steal-tools.export], and [steal-tools.transformImport] all
take a `SystemConfig`, which configures the modules to load.

```
stealTools.build(SystemConfig, ...)
stealTools.pluginifier(SystemConfig, ...)
stealTools["export"]({system: SystemConfig, outputs: {...}});
```

If your `config` file specifies `main`, all that is needed is the `config` location:

```
stealTools.build({config: __dirname+"/package.json!npm"}, ...)
stealTools.pluginifier({config: __dirname+"/package.json!npm"}, ...)
stealTools.export({
  system: {config: __dirname+"/package.json!npm"}, 
  outputs: {...}
});
```

Otherwise, `main` and `config` are probably needed:


```
stealTools.build({
  config: __dirname+"/config.js",
  main: "myproject"
}, ...);

stealTools.pluginifier({
  config: __dirname+"/config.js",
  main: "myproject"
}, ...);

stealTools.export({
  system: {
    config: __dirname+"/config.js",
    main: "myproject"
  }, 
  outputs: {...}
});
```

If there is no `config`, you should specify the baseURL, so StealJS knows where to find your modules.

