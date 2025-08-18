"use strict";

// Configuration et sélecteurs par défaut
const CONFIG = {
	minMatchScore: 0.7,
	containerSelectors: [
		'[data-params*="question"]',
		'[role="listitem"]',
		".m2",
		".freebirdFormviewerViewItemsItemItem",
		".Xb9hP",
		".geS5n",
		".AgroKb",
	],
	questionTextSelectors: [
		'[role="heading"]',
		".M7eMe",
		".freebirdFormviewerViewItemsItemItemTitle",
		".AgroKb .M7eMe",
		'span[dir="auto"]',
		'div[dir="auto"]',
	],
	inputSelectors: [
		'input[type="text"]',
		'input[type="email"]',
		'input[type="tel"]',
		'input[type="date"]',
		"select",
		"textarea",
		'input[type="radio"]',
		'input[type="checkbox"]',
		'div[role="radio"]',
		'div[role="checkbox"]',
		'div[role="listbox"]',
		'span[role="radio"]',
		'span[role="checkbox"]',
	],
	skipFieldTypes: [
		"time",
		"datetime-local",
		"color",
		"range",
		"file",
		"submit",
		"button",
		"reset",
	],
	skipKeywords: ["sélectionn", "choisir"],
	specialKeywords: {
		motifs: ["motifs", "raison", "passez-vous", "test", "académique"],
		signature: ["signer", "nom complet", "confirmez", "document", "veuillez"],
		engagement: ["engagement", "honneur", "responsabilité", "informations"],
	},
};

try {
	globalThis.CONFIG = CONFIG;
} catch (e) {}


