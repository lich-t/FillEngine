"use strict";

function detectPageTypeAndAdaptConfig() {
	const url = window.location.href;
	const hostname = window.location.hostname;

	Logger.info(`Detecting page type for: ${url}`);

	if (hostname.includes("docs.google.com") && url.includes("/forms/")) {
		Logger.info(
			"✅ Google Forms page detected - using Google Forms specific selectors"
		);
		CONFIG.containerSelectors = [
			'[role="listitem"]',
			'[data-params*="question"]',
			".m2",
			".freebirdFormviewerViewItemsItemItem",
			".Xb9hP",
			".geS5n",
			".AgroKb",
		];
		CONFIG.questionTextSelectors = [
			'[role="heading"]',
			".M7eMe",
			".freebirdFormviewerViewItemsItemItemTitle",
			".AgroKb .M7eMe",
			'span[dir="auto"]',
			'div[dir="auto"]',
			".docssharedWizToggleLabeledLabelWrapper",
		];
		return "google-forms";
	}
	if (
		hostname === "" ||
		url.startsWith("file://") ||
		hostname.includes("localhost")
	) {
		Logger.info("✅ Local test page detected - using generic selectors");
		CONFIG.containerSelectors = [
			".question",
			'[role="listitem"]',
			'[data-params*="question"]',
			"fieldset",
			".form-group",
			".question-container",
			"div",
		];
		CONFIG.questionTextSelectors = [
			"h3",
			"label",
			".question-title",
			'[role="heading"]',
			".form-label",
			"legend",
		];
		return "test-page";
	}
	Logger.info("📄 Generic page detected - using universal selectors");
	CONFIG.containerSelectors = [
		"fieldset",
		".form-group",
		".question",
		'[role="listitem"]',
		"div",
	];
	CONFIG.questionTextSelectors = [
		"label",
		"legend",
		"h1",
		"h2",
		"h3",
		"h4",
		"h5",
		"h6",
		".question-title",
		".form-label",
	];
	return "generic";
}

try {
	globalThis.detectPageTypeAndAdaptConfig = detectPageTypeAndAdaptConfig;
} catch (e) {}


