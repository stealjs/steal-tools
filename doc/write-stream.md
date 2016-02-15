@function steal-tools.createWriteStream createWriteStream
@parent steal-tools.stream

Create a [stream](https://nodejs.org/api/stream.html) that takes a [steal-tools.BuildResult] objects and writes them to the filesystem.

@signature `stealTools.createWriteStream()`

@return {Stream<steal-tools.BuildResult>} A stream of objects that contains the dependency graph, bundles, and loader used to perform the trace.

@body

# Use

The write stream is used to write the result of a build to the file system.

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

stream.on("data", function(){
	// Files were written to the file system
});
```

