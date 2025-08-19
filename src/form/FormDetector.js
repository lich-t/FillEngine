"use strict";

class FormDetector {
	static findQuestionContainers() {
		let containers = [];

		for (const selector of CONFIG.containerSelectors) {
			const elements = document.querySelectorAll(selector);
			if (elements.length > 0) {
				const validContainers = Array.from(elements).filter((container) => {
					const hasInput = container.querySelector(
						[
							'input[type="text"]',
							'input[type="email"]',
							'input[type="tel"]',
							'input[type="date"]',
							"select",
							"textarea",
							'div[role="listbox"]',
							'div[role="radio"]',
							'div[role="checkbox"]',
							'span[role="radio"]',
							'span[role="checkbox"]',
						].join(", ")
					);
					const hasText =
						container.textContent && container.textContent.trim().length > 10;

					if (selector === "div") {
						const hasQuestionStructure =
							container.querySelector(
								"h1, h2, h3, h4, h5, h6, label, legend"
							) ||
							container.classList.contains("question") ||
							container.getAttribute("role") === "listitem";
						return hasInput && hasText && hasQuestionStructure;
					}

					return hasInput && hasText;
				});

				if (validContainers.length > 0) {
					containers = validContainers;
					Logger.info(
						`Found ${containers.length} question containers using selector: ${selector}`
					);
					break;
				}
			}
		}

		if (containers.length === 0) {
			const allDivs = document.querySelectorAll("div");
			containers = Array.from(allDivs).filter((div) => {
				const hasInput = div.querySelector(
					[
						'input[type="text"]',
						'input[type="email"]',
						'input[type="tel"]',
						'input[type="date"]',
						"select",
						"textarea",
						'div[role="listbox"]',
						'div[role="radio"]',
						'div[role="checkbox"]',
						'span[role="radio"]',
						'span[role="checkbox"]',
					].join(", ")
				);
				const hasText = div.textContent && div.textContent.trim().length > 10;
				const hasQuestionIndicators =
					div.querySelector("h1, h2, h3, h4, h5, h6, label") ||
					div.classList.contains("question") ||
					div.getAttribute("role");
				return hasInput && hasText && hasQuestionIndicators;
			});
			Logger.info(`Fallback: Found ${containers.length} question containers`);
		}

		return containers;
	}

	static extractQuestionLabel(container) {
		let questionText = "";

		for (const selector of CONFIG.questionTextSelectors) {
			const element = container.querySelector(selector);
			if (element && element.textContent.trim()) {
				questionText = element.textContent.trim();
				break;
			}
		}

		if (!questionText) {
			const walker = document.createTreeWalker(
				container,
				NodeFilter.SHOW_TEXT,
				{
					acceptNode: function (node) {
						const text = node.textContent.trim();
						if (text.length > 2 && !text.includes("*")) {
							return NodeFilter.FILTER_ACCEPT;
						}
						return NodeFilter.FILTER_SKIP;
					},
				}
			);

			const firstTextNode = walker.nextNode();
			if (firstTextNode) {
				questionText = firstTextNode.textContent.trim();
			}
		}

		return questionText
			.toLowerCase()
			.replace(/\s+/g, " ")
			.replace(/[*:?]/g, "")
			.trim();
	}

	static findInputField(container) {
		let input = container.querySelector(
			[
				// Prefer role-based elements (Google Forms)
				'div[role="listbox"]', // GF select
				'div[role="radio"]',
				'div[role="checkbox"]',
				'span[role="radio"]',
				'span[role="checkbox"]',
				// GF select common wrapper classes
				'.jgvuAb',
				'.MocG8c',
				// Then standard controls
				"select",
				'input[type="date"]',
				'input[type="text"]',
				'input[type="email"]',
				'input[type="tel"]',
				"textarea",
				'input[type="radio"]',
				'input[type="checkbox"]',
			].join(", ")
		);

		if (!input) {
			const radioGroup = container.querySelector('div[role="radiogroup"]');
			if (radioGroup) {
				const firstRadio = radioGroup.querySelector('div[role="radio"]');
				if (firstRadio) return firstRadio;
			}

			const checkboxGroup = container.querySelector('div[role="group"]');
			if (checkboxGroup) {
				const firstCheckbox = checkboxGroup.querySelector(
					'div[role="checkbox"]'
				);
				if (firstCheckbox) return firstCheckbox;
			}

			const selectGroup =
				container.querySelector(".jgvuAb") ||
				container.querySelector('.MocG8c') ||
				container.querySelector('[role="listbox"]');
			if (selectGroup) {
				return selectGroup;
			}
		}

		if (!input) {
			const candidateInput = container.querySelector(
				'input:not([type]), input[type=""]'
			);
			if (candidateInput) {
				const parent =
					candidateInput.closest('[role="listitem"]') ||
					candidateInput.parentElement;
				const hasSpecialElements =
					parent &&
					parent.querySelector(
						'input[type="file"], input[type="submit"], input[type="button"], input[type="reset"]'
					);
				if (!hasSpecialElements) {
					input = candidateInput;
				}
			}
		}

		if (input) {
			const containerText = container.textContent.toLowerCase();
			const shouldSkip = ["captcha", "file upload", "signature pad"].some(
				(pattern) => containerText.includes(pattern)
			);

			if (shouldSkip) {
				Logger.debug(
					`Skipping container with unsupported functionality: ${containerText.substring(
						0,
						50
					)}...`
				);
				return null;
			}
		}

		return input;
	}
}

try {
	globalThis.FormDetector = FormDetector;
} catch (e) {}


