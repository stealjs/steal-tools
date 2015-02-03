@typedef {Object} steal-tools.export.output ExportOutput
@inherits steal-tools.transform.options
@parent steal-tools.types

Specifies the behavior for an output in an [steal-tools.export.object] "outputs" property. These properties are in
addition to [steal-tools.transform.options].

@option {Array<moduleName|comparitor>} [modules] Builds all the modules in `modules` together 
with their dependencies. 


@option {Array<moduleName|comparitor>|Boolean} [eachModule] Builds each module in the list 
with its dependendencies individually.

@option {Array<moduleName|comparitor>} [graphs] Builds each item in the graph on its own. Each dependency is 
built individually.

@option {String|function():String} dest Specifies where the 
output should be written.  Dest can be provided as a string or a function that returns the
location.

  @param {String|Array<String>} moduleName The module name or module names being written
  out by this output.
  @param {Object|Array<Object>} moduleData Deprecated.
  @param {Load|Array<Load>} load The module load record, or module load records, being written by this output. 
  @param {Loader} System The System loader used by Steal to load all of these modules.  All configuration
  should be available on it.

@body

## Use

Only one of `modules`, `eachModule`, or `graphs` can be specified.  

## modules

All modules specified by `modules` and their dependencies will be built together.  For example:

```
{
  modules: ["foo","bar"],
  format: "global"
}
```

This will build "foo" and "bar" together in the global format.  If "foo", or "bar" depend on "zed", "zed"
will also be included.

## eachModule

Each module specified by `eachModule` will be exported, including its dependencies individually.  For example:

```
{
  eachModule: ["foo","bar"],
  format: "global"
}
```

This will build a "foo" export and a "bar" export.  If "foo" and "bar" both depend on "zed", "zed" will
be included in both exports.


## graphs

Each module specified by `graphs` and its dependencies will be exported individually.  For example:

```
{
  graphs: ["foo","bar"],
  format: "cjs"
}
```

This will export "foo" to a file, and each of its dependencies to their own file.  This will also export "bar"
to a file, and each of its dependencies to their own file.  If "foo" and "bar" both depend on "zed", "zed"
will be written to its own file one time.


## dest

Dest should specify a single file, typically with a string, if `modules` is provided, like:

```
{
  modules: ["foo","bar"],
  format: "global",
  dest: __dirname+"/foo-bar.js"
}
```

Otherwise, a folder or function should be provided, if using `eachModule or `graphs`:

```
{
  graphs: ["foo","bar"],
  format: "cjs",
  dest: function(moduleName){
    return __dirname+"/"+moduleName+".js";
  }
}
```
