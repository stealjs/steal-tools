import { a } from "./mod";

steal.import("~/bundle").then(function(bundle){
	window.APP = {
		a,
		b: bundle.default
	}
});
