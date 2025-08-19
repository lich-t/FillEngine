"use strict";

// Logger utilitaire global
const Logger = {
	info: (message, ...args) => console.log(`[AutoFill] ${message}`, ...args),
	warn: (message, ...args) => console.warn(`[AutoFill] ${message}`, ...args),
	error: (message, ...args) => console.error(`[AutoFill] ${message}`, ...args),
	debug: (message, ...args) => console.debug(`[AutoFill] ${message}`, ...args),
};

// Expose globally for safety across concatenated content scripts
try {
	// Some environments may not allow writing to window; use globalThis
	globalThis.Logger = Logger;
} catch (e) {}


