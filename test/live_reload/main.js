var foo = require("./foo");
window.MODULE = {
	foo: foo
};
window.liveReloadFunction = require("live-reload").toString();
