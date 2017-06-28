@page StealJS.guides.optimized_builds Optimized Builds
@parent StealJS.guides

@body

In 1.4.0 StealTools added a new **optimize** api which aims to replace [stealTools.build](steal-tools.build)
as the default way of creating a build of a module and all of its dependencies; builds created by `stealTools.optimize` are smaller and load faster.

Unlike regular [builds](steal-tools.build), optimized builds don't need to load or bundle StealJS at all; a thin wrapper is added instead to the main bundle so the browser can load and execute the modules correctly. 

> The **optimize** API is still a work in progress, some StealJS features are still not supported.

In this guide, we'll go through the steps required to create and use an optimized build. We'll be using the
`myhub` application created in the [Progressive Loading](./StealJS.guides.progressive_loading) guide.


## Install Prerequisites

### Window Setup

1.  Install [NodeJS](https://nodejs.org/).
2.  Install Chocolatey, Python, Windows SDK, and Visual Studio as described [here](http://stealjs.com/docs/guides.ContributingWindows.html).

### Linux / Mac Setup

1.  Install [NodeJS](https://nodejs.org/).

## Setting up myhub

### Clone the Github repo 

Run the following command:

```
> git clone git@github.com:stealjs/myhub.git
```

### Install dependencies

As mentioned before, the **optimize** API is still in its early days, for that reason 
we need to use the pre-release packages of `steal-tools` and `steal-css`.

Edit your `package.json` like:

```json
"devDependencies": {
  ...
  "steal-css": "^1.3.0-pre.0",
  "steal-tools": "^1.4.0-pre.0"
}
```

Run `npm install` to install all the application dependencies.

### Update dynamic module identifiers

One limitation of the optimized loader is that unlike StealJS's loader it does not normalize
module identifiers on runtime. For static imports that's not a problem, but it's an issue for 
dynamic imports (through `steal.import`), a workaround for that is to use the full module
name.

Edit the dynamic import in `myhub.js` to:

```js
steal.import(`myhub@1.0.0#${hash}/${hash}`).then(function(moduleOrPlugin) {
```

### Make an optimize build script

Currently, there is no CLI option to use the `stealTools.optimize` function, so a NodeJS script is required.

Create _optimize.js_:

```js
var stealTools = require("steal-tools");

// use the defaults
stealTools.optimize();
```

Run the build script with:

```
> node optimize.js
```

Now, start an http server by running `npm start` and open `http://127.0.0.1:8080/`
in a web browser. You should see myhub's home page.

### Performance comparison

For most application builds where StealJS is not included in each of the main bundles, optimized builds will
have one fewer http request on the initial load which is already a win.

In this example, we are comparing how fast the load event is fired (this event is fired when a resource and its dependent resources have finished loading) when creating the build using `stealTools.build` (with `bundleSteal` set to `true`) and `stealTools.optimize`.

![google chrome 2](https://user-images.githubusercontent.com/724877/27653018-0529f708-5bfb-11e7-91c7-27b988ef7b18.png)

In the screenshot above, the build created by [stealTools.build](steal-tools.build) takes 157ms to 
fire the load event 

In contrast, the optimized build takes 119ms (24% faster) to fire the load event, see the screenshot
below.

![google chrome](https://user-images.githubusercontent.com/724877/27653129-5d2fb35c-5bfb-11e7-85fb-fa48f2a79e1b.png)
