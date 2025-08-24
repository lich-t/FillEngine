"use strict";

// Inject CSS styles for highlighting unfilled fields
function injectHighlightStyles() {
	const styleId = 'autofill-highlight-styles';
	
	// Check if styles are already injected
	if (document.getElementById(styleId)) {
		return;
	}
	
	const style = document.createElement('style');
	style.id = styleId;
	style.textContent = `
		/* AutoFill highlighting styles for unfilled fields */
		.autofill-highlight-unfilled {
			position: relative;
			border: 2px solid #dc2626 !important;
			border-radius: 8px !important;
			background-color: rgba(254, 202, 202, 0.1) !important;
			box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1) !important;
			padding: 8px !important;
			margin: 4px 0 !important;
			transition: all 0.3s ease !important;
		}
		
		.autofill-highlight-unfilled:hover {
			box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.2) !important;
		}
		
		/* Dark mode support */
		@media (prefers-color-scheme: dark) {
			.autofill-highlight-unfilled {
				border-color: #ef4444 !important;
				background-color: rgba(239, 68, 68, 0.1) !important;
				box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1) !important;
			}
		}
	`;
	
	document.head.appendChild(style);
	console.log('[AutoFill] Highlight styles injected');
}

// Inject styles immediately when content script loads
injectHighlightStyles();

// Detect page type and initialize autofiller
console.log("[AutoFill] Content init script loaded");
// Ensure Logger binding exists even if Logger.js didn't load for any reason
if (typeof Logger === "undefined") {
	if (typeof globalThis.Logger === "undefined") {
		globalThis.Logger = {
			info: (...args) => console.log("[AutoFill]", ...args),
			warn: (...args) => console.warn("[AutoFill]", ...args),
			error: (...args) => console.error("[AutoFill]", ...args),
			debug: (...args) => console.debug("[AutoFill]", ...args),
		};
		console.warn("[AutoFill] Fallback Logger initialized (global)");
	}
	// Create a real global binding for Logger so unqualified references work
	var Logger = globalThis.Logger;
}
console.log("[AutoFill] Diagnostics:", {
	hasLogger: typeof Logger !== "undefined",
	hasCONFIG: typeof CONFIG !== "undefined",
	hasDetect: typeof detectPageTypeAndAdaptConfig,
	hasFormAutoFiller: typeof FormAutoFiller,
});

let pageType = "unknown";
try {
	pageType = typeof detectPageTypeAndAdaptConfig === "function"
		? detectPageTypeAndAdaptConfig()
		: "unavailable";
} catch (e) {
	console.error("[AutoFill] detectPageType error:", e);
}

let autoFiller = null;
try {
	autoFiller = typeof FormAutoFiller === "function" ? new FormAutoFiller() : null;
} catch (e) {
	console.error("[AutoFill] FormAutoFiller init error:", e);
}

try {
	Logger.info(`Auto-Fill extension loaded for ${pageType}`);
	if (autoFiller) {
		Logger.debug("Available field mappings:", autoFiller.getFieldMappings());
	}
	Logger.info("Extension ready. Upload CSV data to begin form filling.");
} catch (e) {
	console.error("[AutoFill] Logger not available:", e);
}

// Observe DOM changes
const observer = new MutationObserver((mutations) => {
	let shouldCheck = false;
	mutations.forEach((mutation) => {
		if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
			for (const node of mutation.addedNodes) {
				if (node.nodeType === Node.ELEMENT_NODE) {
					const hasFormElements = node.querySelector && node.querySelector("input, textarea");
					if (hasFormElements) {
						shouldCheck = true;
						break;
					}
				}
			}
		}
	});
	if (shouldCheck) {
		Logger.info("DOM updated with new form elements");
	}
});

observer.observe(document.body, { childList: true, subtree: true });

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
	console.log("📥 CONTENT SCRIPT RECEIVED MESSAGE:", message);
	console.log("├── Action:", message.action);
	console.log("├── Has userData:", !!message.userData);
	console.log("└── Message sender:", sender);
	if (message.action === "fillForm") {
		try {
			if (message.userData) {
				console.log("✅ CSV DATA RECEIVED IN CONTENT SCRIPT");
				console.log("├── Data structure keys:", Object.keys(message.userData));
				console.log("├── Personal data:", message.userData.personal);
				console.log("├── Contact data:", message.userData.contact);
				console.log("└── Full userData:", message.userData);
				Logger.info("CSV data received in content script");
				Logger.debug("CSV data structure:", Object.keys(message.userData));
				console.log("🔄 CALLING updateUserProfile...");
				autoFiller.updateUserProfile(message.userData);
				console.log("🔍 USER_PROFILE AFTER UPDATE:");
				console.log("├── Personal:", USER_PROFILE.personal);
				console.log("├── Contact:", USER_PROFILE.contact);
				console.log("└── Full USER_PROFILE:", USER_PROFILE);
			} else {
				console.log("❌ NO userData PROVIDED IN MESSAGE");
				Logger.warn("No userData provided in message");
			}
			console.log("🚀 CALLING fillForm...");
			if (!autoFiller) {
				console.error("[AutoFill] autoFiller not initialized");
				sendResponse({ success: false, error: "autoFiller not initialized" });
				return true;
			}
			const result = autoFiller.fillForm();
			console.log("📊 FORM FILL RESULT:", result);
			Logger.info("Form fill result:", result);
			// Conform to popup.js expectations: wrap stats in `results`
			sendResponse({ success: !!result?.success, results: result });
		} catch (error) {
			console.error("❌ ERROR IN MESSAGE HANDLER:", error);
			Logger.error("Error filling form:", error);
			sendResponse({ success: false, message: "Error occurred while filling form: " + error.message });
		}
	} else if (message.action === "getUserProfile") {
		sendResponse({ success: true, profile: autoFiller.getUserProfile() });
	} else if (message.action === "getFieldMappings") {
		sendResponse({ success: true, mappings: autoFiller.getFieldMappings() });
	} else if (message.action === "highlightUnfilledFields") {
		try {
			if (!autoFiller) {
				console.error("[AutoFill] autoFiller not initialized for highlighting");
				sendResponse({ success: false, error: "autoFiller not initialized" });
				return true;
			}
			
			const result = autoFiller.highlightUnfilledFields();
			console.log("🎨 HIGHLIGHT RESULT:", result);
			Logger.info("Highlight result:", result);
			sendResponse({ success: !!result?.success, highlightedCount: result?.highlightedCount || 0 });
		} catch (error) {
			console.error("❌ ERROR IN HIGHLIGHT HANDLER:", error);
			Logger.error("Error highlighting fields:", error);
			sendResponse({ success: false, error: "Error occurred while highlighting: " + error.message });
		}
	} else if (message.action === "removeHighlights") {
		try {
			if (!autoFiller) {
				console.error("[AutoFill] autoFiller not initialized for removing highlights");
				sendResponse({ success: false, error: "autoFiller not initialized" });
				return true;
			}
			
			const result = autoFiller.removeHighlights();
			console.log("🎨 REMOVE HIGHLIGHT RESULT:", result);
			Logger.info("Remove highlight result:", result);
			sendResponse({ success: !!result?.success, removedCount: result?.removedCount || 0 });
		} catch (error) {
			console.error("❌ ERROR IN REMOVE HIGHLIGHT HANDLER:", error);
			Logger.error("Error removing highlights:", error);
			sendResponse({ success: false, error: "Error occurred while removing highlights: " + error.message });
		}
	}
	return true;
});

function initializeWhenReady() {
	if (document.readyState === "complete") {
		Logger.info(`Page is ready (${pageType})`);
	} else {
		window.addEventListener("load", () => {
			Logger.info(`Page loaded (${pageType})`);
		});
	}
}

initializeWhenReady();


