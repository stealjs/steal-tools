@function steal-tools.createMultiBuildStream createMultiBuildStream
@parent steal-tools.stream

Create a [stream](https://nodejs.org/api/stream.html) of [steal-tools.BuildResult] objects.

@signature `stealTools.createMultiBuildStream()`

@return {Stream<steal-tools.BuildResult>} A stream of objects that contains the dependency graph.

@body

# Use

The multi-build stream is used to perform building operations on a stream of graph objects. It will perform **transpiling**, **minification**, and **splitting** the graph into bundles based on the progressive loading algorithm.

This API must be used in conjuction with [steal-tools.createGraphStream].

```
var graphStream = stealTools.createGraphStream({
	config: __dirname + "/package.json!npm"
}, {
	minify: false
});

var buildStream = graphStream.pipe(
	stealTools.createMultiBuildStream()
);

buildStream.on("data", function(data){
	var dependencyGraph = data.graph;
});
```
