steal("./mod.js", "./style.less", function(mod){
	window.APP_ON = typeof mod === "object";
});
