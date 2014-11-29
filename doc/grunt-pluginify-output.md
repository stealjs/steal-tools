@typedef {{}} stealTools.grunt.pluginify.output PluginifyOutput
@inherits stealTools.pluginify.options

Specifies the behavior for an output in [stealTools.grunt.pluginify]. These properties are in
addition to [stealTools.pluginify.options].

@option {Array<moduleName|comparitor>} [modules] Builds all the modules in `modules` together with their dependencies.
@option {Array<moduleName|comparitor>|Boolean} [eachModule] Builds each module in the list 
with its dependendencies individually.
@option {Array<moduleName|comparitor>} [graphs] Builds each item in the graph on its own. Each dependency is 
built individually.

@option {String|function(moduleName,moduleData):String} dest Specifies where the 
output should be written.  Dest can be provided as a string or a function that returns the
location.
