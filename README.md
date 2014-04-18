Steal Tools is a collection of command-line utilities
that make building, packaging, and sharing ES6, CommonJS, AMD, and [Steal](http://github.com/bitovi/steal)
applications easy.


## Install

```
npm install steal-tools
```

## Use

After creating an application that works in the browser, you can build it and then
setup a page for production.

### Build


From the command line:

```
steal-tools build main=moduleName config=path/to/config.js
```

In node:

```js
var stealTools = require('steal-tools');
stealTools.build({
  main: "moduleName",
  config: "pathTo/config.js"
})
```

Grunt:

```js
grunt.loadNpmTasks( "steal-tools" );

grunt.initConfig({
  stealTools: {
    main: "moduleName",
    config: "pathTo/config.js"
  }
});
```


## Contributing

### Install

1.  Clone the steal-tools repo.
2.  Run `npm install`
3.  Install mocha globally `npm install -g mocha`

### Test

Run `mocha test/test.js`


