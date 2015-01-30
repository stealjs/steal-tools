@typedef {{}} steal-tools.SystemConfig SystemConfig
@parent steal-tools.types

Configuration values needed for StealJS to load modules. Some set of the following
values are required:

@option {String|Array<moduleName>} main The module or modules who should be 
imported.  This sets [System.main].  

@option {String} [config] The path to a configuration file. This
will also specify `baseURL` and sometimes `main`. This set [System.configPath].

@option {String} [baseURL] If a configuration file is not used, 
the [System.baseURL baseURL] value must be set.

@body

## Use

[steal-tools.builder], [steal-tools.exporter], and [steal-tools.pluginifier] all
take a `SystemConfig` to configure the modules to load.

```
stealTools.builder(SystemConfig, ...)
stealTools.pluginifier(SystemConfig, ...)
stealTools.exporter({system: SystemConfig, outputs: {...}});
```

If your `config` file specifies `main`, all that is needed is the `config` location:

```
stealTools.builder({config: __dirname+"/package.json!npm"}, ...)
stealTools.pluginifier({config: __dirname+"/package.json!npm"}, ...)
stealTools.exporter({
  system: {config: __dirname+"/package.json!npm"}, 
  outputs: {...}
});
```

Otherwise, `main` and `config` are probably needed:


```
stealTools.builder({
  config: __dirname+"/config.js",
  main: "myproject"
}, ...);

stealTools.pluginifier({
  config: __dirname+"/config.js",
  main: "myproject"
}, ...);

stealTools.exporter({
  system: {
    config: __dirname+"/config.js",
    main: "myproject"
  }, 
  outputs: {...}
});
```

If there is no `config`, you should specify the baseURL so StealJS knows where to find your modules.

