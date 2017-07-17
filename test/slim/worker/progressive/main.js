"format cjs";

steal.import("./foo").then(function(foo) {
	self.postMessage(foo);
});

