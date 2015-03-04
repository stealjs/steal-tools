import $ from "jquery";
import "./tabs.less!";

$.fn.tabs = function(){
	this.addClass("tabs").text("tabs!");
};

export default $.fn.tabs;