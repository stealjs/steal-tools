@function steal-tools.createGraphStream createGraphStream
@parent steal-tools.stream

Create a [stream](https://nodejs.org/api/stream.html) that will result in a dependency graph.

@signature `stealTools.createGraphStream(config, options)`

```
var stream = stealTools.createGraphStream({
	config: __dirname + "/package.json!npm"
}, {
	minify: false
});

stream.on("data", function(data){
	var dependencyGraph = data.graph;
});
```

@param {steal-tools.SystemConfig} config

@param {steal-tools.BuildOptions} [options]

@return {Stream<Object>} A stream of objects that contains the dependency graph.
