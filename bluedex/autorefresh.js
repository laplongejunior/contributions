// IIFE in strict mode to be able to use unstrict code at the start of execution, yet have most of the code execute as strict
(function(global) { // I prefer getting the global object with "this" rather than using the name 'window', personal taste
    "use strict";

    // To allow easy redirects
    const console = global.console;
    const doc = global.document;

	// My old scripts import this as a seperate js file for easier updating
	// For this reddit comment I merged the files and removed some complex feature like slowing down the observer
	// But I'm not sure it will work exactly the same
    const UTILS = {
		// Basically calls it everytime there's a change + one time when added
		// My personal version only triggers the callback if no event triggered during 3s, but for such a simple script it would be overkill
		detectUpdate: (parent, callback) => {
			let observer = new MutationObserver(callback);
			observer.observe(parent, { childList: true, subtree: true });
			callback();
			return observer;
		},

		// By default, querySelector returns the first element in case of multiple matches
		// querySelector should only be used for cases intended for a single match
		// As a security, this polyfill makes it so that querySelector returns null in case of multiple matches
		querySelectorSafe: function(element, selector) {
			console.warn(element);
		  const result = element.querySelectorAll(selector);
		  if (result.length == 1) return result.item(0);
		  if (result.length > 1) {
			global.console.warn("Several matches found for querySelector! Discarding...");
			global.console.warn(result);
		  }
		  return null;
		}
	};

    // If there's a DOM modification, schedule a new try
	const parent = doc.body; // PERF: Use querySelectorSafe to identify a more precise parent element
	console.warn("Script loaded!");
	console.warn(parent);
	
    const observer = UTILS.detectUpdate(parent, ()=>{
		console.warn("Update detected!");
		// Courtesy of u/Hakorr
		if (!UTILS.querySelectorSafe(parent, 'h2.alert')) return;
        observer.disconnect();
		global.location.reload();
    });
})(this);
