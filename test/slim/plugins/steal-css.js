var steal = require("@steal");
var loader = require("@loader");

function CSSModule(address, source) {
	this.address = address;
	this.source = source;
}

CSSModule.prototype.injectStyle = function() {
	var head = document.head;
	var style = document.createElement("style");

	style.type = "text/css";
	style.styleSheet.cssText = this.source;

	head.appendChild(style);
};

exports.instantiate = function(load) {
	var loader = this;
	var css = new CSSModule(load.address, load.source);

	load.metadata.deps = [];
	load.metadata.format = "css";
	load.metadata.execute = function() {
		css.injectStyle();

		return loader.newModule({
			source: css.source
		});
	};
};

exports.buildType = "css";
exports.includeInBuild = true;
exports.pluginBuilder = "slim-css";
