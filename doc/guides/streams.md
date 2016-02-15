@page steal-tools.guides.streams Streaming API
@parent StealJS.guides 3

In 0.14.0 StealTools added a new streaming API based on [Node streams](https://nodejs.org/api/stream.html). This gives you a greater ability to interject your own functionality in the middle of the build process, or to exclude parts you don't want (like if you didn't want to write the results to the filesystem.

The streaming APIs are more powerful, but more complex, if you just want to build your app you should use [steal-tools.build] instead. If you are new to streams consult the [stream handbook](https://github.com/substack/stream-handbook) to learn what makes them useful.

# Streams

The following are the streams that can be created. Each stream is explained individually and at the end of the docs we'll talking about putting them all together. Many of the examples use the [through2](https://www.npmjs.com/package/through2) module, which provide an easy way to work with Node streams.

## createGraphStream

The basis for StealTool's build process is a **dependency graph**. A dependency graph is an object that contains all of your app's dependencies. The key is the name of the module and the value is a [steal-tools.node] object.

**createGraphStream** is the first stream created and is required for use with all of the other streams.

```
var stealTools = require("steal-tools");
var through = require("through2");

var graphStream = stealTools.createGraphStream({
	config: __dirname + "/package.json!npm"
});

graphStream.pipe(through(function(data){
	// data contains a 'graph' property.
}));
```

## createMultiBuildStream

Given a graph stream, **createMultiBuildStream** does data transformation on your dependency graph. This includes **transpiling** to AMD, **minifying** (if enabled in your options), and dividing into optimized **bundles**.

```
var stealTools = require("steal-tools");
var through = require("through2");

var createGraphStream = stealTools.createGraphStream;
var multiBuild = stealTools.createMultiBuildSteam;

var system = {
	config: __dirname + "/package.json!npm"
};

var buildStream = createGraphStream(system)
	.pipe(multiBuild());

buildStream.pipe(through(function(data){
	// data contains everything from the graphStream
	// and also now a 'bundles' property.
}));
```

## createConcatStream

Once you've created the multi build stream that contains all of your application's bundles, you can pipe it into a concat stream. The concat stream will **concatenate** the source from all of the graph's dependencies into a single source code.

The [steal-tools.BuildResult] object is what is returned from this stream, and each of the **bundles** within will now contain a `source` property.

## createWriteStream

After concatentating the bundles you call **createWriteStream** to write the source to the filesystem. If you where only interested in examining the bundles in-memory you could skip this step.

Otherwise, pipe in the result from **createConatStream** here.

# Putting it all together

Given these APIs you can construct your own build by piping the streams into each other. Here's what a typical build looks like:

```
var stealTools = require("steal-tools");

var createGraphStream = stealTools.createGraphStream;
var multiBuild = stealTools.createMultiBuildStream;
var concat = stealTools.createConcatStream;
var write = stealTools.createWriteStream;

var system = {
	config: __dirname + "/package.json!npm"
};

var stream = createGraphStream(system)
	.pipe(multiBuild())
	.pipe(concat())
	.pipe(write());
```

Now let's say we wanted to rerun [babel](https://babeljs.io/) to transpile non-es6 modules. We could do this by injecting a stream after *multiBuild* has completed:

```
var stealTools = require("steal-tools");

var createGraphStream = stealTools.createGraphStream;
var multiBuild = stealTools.createMultiBuildStream;
var concat = stealTools.createConcatStream;
var write = stealTools.createWriteStream;

var babel = require("babel-core");
var transform =	function(source){
	return babel.transform(source, {
		presets: [
			require("babel-preset-es2015-no-commonjs"),
			require("babel-preset-react"),
			require("babel-preset-stage-0")
		]
	});
};

var createBabelStream = function(){
	return through.obj(function(data){
		data.bundles.forEach(function(bundle){
			bundle.nodes.forEach(function(node){
				node.activeSource = transform(node.getSource());
			});
		});
	});
};

var system = {
	config: __dirname + "/package.json!npm"
};

var stream = createGraphStream(system)
	.pipe(multiBuild())
	.pipe(createBabelStream())
	.pipe(concat())
	.pipe(write());
```

