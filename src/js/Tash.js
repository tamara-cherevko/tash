/**
 * @author tash
 * @class Tash
 * @singleton
 */
window.Tash = {}; 
(function(){
	Tash.define = function(name, value){
		var name = name || "",
			value = value || {};
		
		if(!Tash.hasOwnProperty(name)){
			Tash[name] = value;
			Tash.uploadScripts(name)
		} else{
			console.log("It's already exist namespace with this call")
		}
	}
	//TO DO:
	//create path for whole library  	
	Tash.path = "src/js/";
	//TO DO:
	//create upload new class
	Tash.Class = function (class_name, class_properties) {
	    Tash.uploadScripts(class_name);
	    // if (!class_properties.$requires && class_properties.$extends
	                // && class_properties.$extends.indexOf('function') === -1) {
	        // class_properties.$requires = [class_properties.$extends];
	    // }
	    // if (class_properties.$requires) {
	        // if (!Array.isArray(class_properties.$requires)) {
	            // class_properties.$requires = [class_properties.$requires];
	        // }
	        // if (class_properties.$extends
	                // && class_properties.$requires.indexOf(class_properties.$extends) === -1) {
	            // class_properties.$requires.push(class_properties.$extends);
	        // }
	        // if (!S.resources_manager.isInited(class_properties.$requires)) {
	            // S.require(class_properties.$requires);
	        // }
	        // var cycle = setInterval(function () {
	            // if (S.resources_manager.isInited(class_properties.$requires)) {
	                // clearInterval(cycle);
	                // S.Class.create(class_name, class_properties);
	            // } else {
	            // }
	            // // continue trying
	        // }, 1);
	    // } else {
	        // S.Class.create(class_name, class_properties);
	    }
	Tash.uploadScripts = function(script_name){
		
		var script  = document.createElement("script"),
			temp_name = script_name.split(".");
		script.src = Tash.path + temp_name.join("/") + ".js";
		script.setAttribute("async", true);
		document.head.appendChild(script)
	}
	
	
})();

(function (){	
	///////////// NAMESPACES //////////////
	Tash.define('Tash.component.Component');
	
})();