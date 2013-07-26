@page stealtools Steal Tools
@parent javascriptmvc 3

Steal Tools is a collection of command-line utilities
that make building, packaging, and sharing [Steal](http://github.com/bitovi/steal) applications easy. Lets see what it can do:
  
### JS/CSS concatenation and minification ([steal-build])

[steal-build] combines and minifies an application (or application's) resources
into a small number of minified packages for faster downloading. Features:

 - Minifies JS, Less, CoffeeScript, and client-side templates.
 - Build shared dependencies across [steal.build.apps multiple apps].
 - Package modules for [steal.build.packages progressive loading].
 - Create modules that work [steal.build.pluginify without steal] as standalone.

@codestart text
steal build path/to/myapp.js
@codeend
