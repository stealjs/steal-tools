StealTools is a collection of command-line utilities
that make building, packaging, and sharing ES6, CommonJS, AMD, and [Steal](https://github.com/bitovi/steal)
applications easy.

## Use

Currently, StealTools depends 
on [StealJS](https://github.com/bitovi/steal). Before doing a build, make
sure StealJS loads your app successfully in the browser.

### Hello World

If you followed [StealJS's Hello World Example](https://github.com/bitovi/steal),
the following will walk you through setting up StealTools to build that app.  That app has a 
structure that looks like:

    ROOT/
      bower.json
      bower_components/
      stealconfig.js
      index.html
      main.js

`stealconfig.js` is the config file and `main.js` is the main module.

1.  Install StealTools.

  Using npm:
  
      > npm install steal-tools --save-dev

2.  Create a build script.

  In your build script, add:
  
  ```js
  var stealTools = require('steal-tools');
  stealTools.build({
    config: "path/to/ROOT/stealconfig.js",
    main: "main"
  }).then(function(){
    console.log("build is successful")
  })
  ```
  
  Notice that the `config` option includes the path to the configuration file.  Your script
  might want to use `__dirname`.  `stealTools.build` returns a deferred when the build is complete.

3. Run your build script.

  This will produce a `ROOT/bundles/main.js`.

4. Switch to production.  

  In `index.html`, switch to production by adding `data-env='production'` to the steal `<script>` tag:

  ```html
  <script src='./bower_components/steal/steal.js'
          data-config='stealconfig.js'
          data-main='main'
          data-env-'production'></script>
  ```
