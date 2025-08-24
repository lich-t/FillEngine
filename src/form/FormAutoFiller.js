"use strict";

class FormAutoFiller {
	constructor() {
		this.dictionary = generateFlatDictionary();
		this.fieldMatcher = new FieldMatcher(this.dictionary);
		this.statistics = {
			fieldsDetected: 0,
			fieldsFilled: 0,
			detectionResults: [],
		};
	}

	updateUserProfile(newProfile) {
		console.log("🔄 UPDATE USER PROFILE CALLED");
		console.log("├── New profile provided:", !!newProfile);
		console.log("├── Current USER_PROFILE before update:", USER_PROFILE);
		console.log("└── New profile data:", newProfile);

		if (newProfile) {
			Object.keys(newProfile).forEach((category) => {
				console.log(`Processing category: ${category}`, newProfile[category]);
				if (typeof newProfile[category] === "object" && newProfile[category] !== null) {
					if (!USER_PROFILE[category]) {
						USER_PROFILE[category] = {};
					}
					Object.assign(USER_PROFILE[category], newProfile[category]);
					console.log(`✅ Updated USER_PROFILE.${category}:`, USER_PROFILE[category]);
				}
			});

			console.log("📊 FINAL USER_PROFILE AFTER MERGE:", USER_PROFILE);
			console.log("🔄 Regenerating dictionary...");
			this.dictionary = generateFlatDictionary();
			console.log("📖 GENERATED DICTIONARY:", this.dictionary);
			this.fieldMatcher = new FieldMatcher(this.dictionary);
			Logger.info("User profile updated from CSV data");
			Logger.debug("Updated USER_PROFILE:", USER_PROFILE);
			console.log("✅ USER PROFILE UPDATE COMPLETE");
		} else {
			console.log("❌ No new profile provided to updateUserProfile");
		}
	}

	fillForm() {
		console.log("🚀 FILL FORM PROCESS STARTED");
		console.log("├── USER_PROFILE.personal:", USER_PROFILE.personal);
		console.log("├── USER_PROFILE keys:", Object.keys(USER_PROFILE));
		console.log("└── Dictionary available:", !!this.dictionary);

		Logger.info("Starting form fill process...");

		if (!USER_PROFILE.personal || Object.keys(USER_PROFILE.personal).length === 0) {
			console.log("❌ NO USER DATA - form fill aborted");
			console.log("├── USER_PROFILE.personal:", USER_PROFILE.personal);
			console.log(
				"├── Keys length:",
				USER_PROFILE.personal ? Object.keys(USER_PROFILE.personal).length : 0
			);
			Logger.error("No user data loaded. Please upload a CSV file first.");
			return {
				success: false,
				message:
					"Aucune donnée utilisateur chargée. Veuillez d'abord télécharger un fichier CSV.",
				fieldsDetected: 0,
				fieldsFilled: 0,
				supportedFields: 0,
				unsupportedFields: 0,
				fieldsWithoutInput: 0,
				supportedSuccessRate: 0,
				overallSuccessRate: 0,
				detectionResults: [],
			};
		}

		this.statistics = {
			fieldsDetected: 0,
			fieldsFilled: 0,
			detectionResults: [],
		};

		const containers = FormDetector.findQuestionContainers();

		containers.forEach((container, index) => {
			const questionLabel = FormDetector.extractQuestionLabel(container);
			Logger.debug(`Question ${index + 1}: "${questionLabel}"`);
			if (!questionLabel) return;
			this.statistics.fieldsDetected++;
			const inputField = FormDetector.findInputField(container);
			let matchFound = false;
			let matchedKey = "";
			let matchedValue = "";
			let inputType = "unknown";
			let fieldCategory = "unknown";
			if (inputField) {
				inputType =
					inputField.type ||
					inputField.tagName.toLowerCase() ||
					inputField.getAttribute("role") ||
					"element";
				if (inputType === "date") {
					fieldCategory = "date";
				} else if (
					inputType === "select" ||
					inputField.querySelector('[role="listbox"]') ||
					container.querySelector('[role="listbox"]')
				) {
					fieldCategory = "select";
				} else if (
					inputType === "radio" ||
					inputField.getAttribute("role") === "radio" ||
					container.querySelector('[role="radio"]')
				) {
					fieldCategory = "radio";
				} else if (
					inputType === "checkbox" ||
					inputField.getAttribute("role") === "checkbox" ||
					container.querySelector('[role="checkbox"]')
				) {
					fieldCategory = "checkbox";
				} else if (
					inputType === "text" ||
					inputType === "email" ||
					inputType === "tel" ||
					inputType === "textarea"
				) {
					fieldCategory = "text";
				} else {
					fieldCategory = "other";
				}
				if (
					fieldCategory === "text" ||
					fieldCategory === "radio" ||
					fieldCategory === "checkbox" ||
					fieldCategory === "date" ||
					fieldCategory === "select"
				) {
					if (this.dictionary[questionLabel]) {
						Logger.info(
							`✅ Exact match found: "${questionLabel}" -> "${this.dictionary[questionLabel]}"`
						);
						const success = FieldFiller.setFieldValue(
							inputField,
							this.dictionary[questionLabel]
						);
						if (success) {
							this.statistics.fieldsFilled++;
							matchFound = true;
							matchedKey = questionLabel;
							matchedValue = this.dictionary[questionLabel];
						}
					} else {
						const bestMatch = this.fieldMatcher.findBestMatch(questionLabel);
						if (bestMatch) {
							Logger.info(
								`✅ Best match found: "${bestMatch.key}" -> "${bestMatch.value}" (score: ${bestMatch.score.toFixed(2)})`
							);
							const success = FieldFiller.setFieldValue(
								inputField,
								bestMatch.value
							);
							if (success) {
								this.statistics.fieldsFilled++;
								matchFound = true;
								matchedKey = bestMatch.key;
								matchedValue = bestMatch.value;
							}
						}
					}
				} else {
					Logger.debug(
						`⏭️ Skipped question ${index + 1}: unsupported field type "${fieldCategory}" (${inputType})`
					);
				}
			} else {
				Logger.debug(`⏭️ Skipped question ${index + 1}: no input field found`);
				inputType = "no-input-field";
				fieldCategory = "no-input";
			}
			this.statistics.detectionResults.push({
				questionLabel,
				matched: matchFound,
				key: matchedKey,
				value: matchedValue,
				inputType: inputType,
				fieldCategory: fieldCategory,
				hasInputField: !!inputField,
			});
		});

		const supportedFields = this.statistics.detectionResults.filter(
			(r) =>
				r.fieldCategory === "text" ||
				r.fieldCategory === "radio" ||
				r.fieldCategory === "checkbox" ||
				r.fieldCategory === "date" ||
				r.fieldCategory === "select"
		).length;

		const unsupportedFields = this.statistics.detectionResults.filter((r) => r.fieldCategory === "other").length;
		const fieldsWithoutInput = this.statistics.detectionResults.filter((r) => !r.hasInputField).length;
		const supportedSuccessRate =
			supportedFields > 0 ? Math.round((this.statistics.fieldsFilled / supportedFields) * 100) : 0;
		const overallSuccessRate =
			this.statistics.fieldsDetected > 0
				? Math.round((this.statistics.fieldsFilled / this.statistics.fieldsDetected) * 100)
				: 0;

		Logger.info(
			`Form fill complete: ${this.statistics.fieldsFilled}/${supportedFields} champs supportés remplis, ${unsupportedFields} champs non supportés, ${fieldsWithoutInput} sans champ d'entrée (Total: ${this.statistics.fieldsDetected} questions)`
		);
		Logger.debug("Detection results:", this.statistics.detectionResults);

		// Automatically highlight unfilled fields after form filling
		this.highlightUnfilledFields();
	
		return {
			success: true,
			message: `Analysé ${this.statistics.fieldsDetected} questions - Rempli ${this.statistics.fieldsFilled} champs (${overallSuccessRate}%)`,
			fieldsDetected: this.statistics.fieldsDetected,
			fieldsFilled: this.statistics.fieldsFilled,
			supportedFields: supportedFields,
			unsupportedFields: unsupportedFields,
			fieldsWithoutInput: fieldsWithoutInput,
			supportedSuccessRate: supportedSuccessRate,
			overallSuccessRate: overallSuccessRate,
			detectionResults: this.statistics.detectionResults,
		};
	}

	getUserProfile() {
		return { ...USER_PROFILE };
	}

	getFieldMappings() {
		return { ...FIELD_MAPPINGS };
	}

	/**
	 * Highlight unfilled fields with visual indicators and labels
	 * @returns {Object} Result object with success status and statistics
	 */
	highlightUnfilledFields() {
		Logger.info("Starting automatic highlighting of unfilled fields...");
		
		// Remove any existing highlights first
		this.removeHighlights();
		
		let highlightedCount = 0;
		const containers = FormDetector.findQuestionContainers();
		
		containers.forEach((container, index) => {
			const questionLabel = FormDetector.extractQuestionLabel(container);
			if (!questionLabel) return;
			
			// Check if this field was filled by looking at our statistics
			const fieldResult = this.statistics.detectionResults.find(
				result => result.questionLabel === questionLabel
			);
			
			// Only highlight if field was not filled and is a supported field type
			if (fieldResult && !fieldResult.matched && fieldResult.hasInputField && 
				(fieldResult.fieldCategory === "text" || fieldResult.fieldCategory === "radio" || 
				 fieldResult.fieldCategory === "checkbox" || fieldResult.fieldCategory === "date" || 
				 fieldResult.fieldCategory === "select")) {
				
				this.addHighlightToField(container, questionLabel);
				highlightedCount++;
			}
		});
		
		Logger.info(`Highlighted ${highlightedCount} unfilled fields`);
		
		return {
			success: true,
			highlightedCount: highlightedCount,
			message: `${highlightedCount} champs non remplis surlignés`
		};
	}
	
	/**
	 * Add highlight styling to a specific field container
	 * @param {Element} container - The field container element
	 * @param {string} questionLabel - The question label text
	 */
	addHighlightToField(container, questionLabel) {
		try {
			// Add highlight class to container
			container.classList.add('autofill-highlight-unfilled');
			
			// Find input field in container and add change listener
			const inputField = FormDetector.findInputField(container);
			if (inputField) {
				this.addFieldChangeListener(container, inputField);
			}
			
			Logger.debug(`Added highlight to field: "${questionLabel}"`);
		} catch (error) {
			Logger.error(`Error adding highlight to field: ${error.message}`);
		}
	}
	
	/**
	 * Add change listener to an input field to remove highlighting when filled
	 * @param {Element} container - The field container element
	 * @param {Element} inputField - The input field element
	 */
	addFieldChangeListener(container, inputField) {
		try {
			const removeHighlightOnChange = () => {
				if (this.isFieldFilled(inputField)) {
					container.classList.remove('autofill-highlight-unfilled');
					Logger.debug('Removed highlight from filled field');
				}
			};
			
			// Add multiple event listeners to catch different types of input
			inputField.addEventListener('input', removeHighlightOnChange);
			inputField.addEventListener('change', removeHighlightOnChange);
			inputField.addEventListener('blur', removeHighlightOnChange);
			
			// For radio buttons and checkboxes, listen for click events
			if (inputField.type === 'radio' || inputField.type === 'checkbox') {
				inputField.addEventListener('click', removeHighlightOnChange);
			}
			
			// For select elements
			if (inputField.tagName.toLowerCase() === 'select') {
				inputField.addEventListener('change', removeHighlightOnChange);
			}
			
			// For elements with role attributes (Google Forms)
			if (inputField.getAttribute('role')) {
				inputField.addEventListener('click', removeHighlightOnChange);
				// Also listen for mutations on the container for Google Forms dynamic updates
				const observer = new MutationObserver(() => {
					if (this.isFieldFilled(inputField)) {
						container.classList.remove('autofill-highlight-unfilled');
						Logger.debug('Removed highlight from filled field (mutation)');
						observer.disconnect();
					}
				});
				observer.observe(container, { childList: true, subtree: true, attributes: true });
			}
			
		} catch (error) {
			Logger.error(`Error adding field change listener: ${error.message}`);
		}
	}
	
	/**
	 * Check if a field is filled with a value
	 * @param {Element} inputField - The input field element
	 * @returns {boolean} True if field has a value
	 */
	isFieldFilled(inputField) {
		try {
			if (!inputField) return false;
			
			// For text inputs, textareas, selects
			if (inputField.value && inputField.value.trim() !== '') {
				return true;
			}
			
			// For radio buttons - check if any in the group is selected
			if (inputField.type === 'radio') {
				const radioGroup = document.querySelectorAll(`input[name="${inputField.name}"]`);
				return Array.from(radioGroup).some(radio => radio.checked);
			}
			
			// For checkboxes
			if (inputField.type === 'checkbox') {
				return inputField.checked;
			}
			
			// For Google Forms elements with role attributes
			if (inputField.getAttribute('role')) {
				// Check for aria-checked attribute
				if (inputField.getAttribute('aria-checked') === 'true') {
					return true;
				}
				
				// Check for selected options in dropdowns
				if (inputField.getAttribute('role') === 'listbox') {
					const selectedOption = inputField.querySelector('[aria-selected="true"]');
					return !!selectedOption;
				}
				
				// Check for text content in text-like fields
				if (inputField.textContent && inputField.textContent.trim() !== '') {
					return true;
				}
			}
			
			return false;
		} catch (error) {
			Logger.error(`Error checking if field is filled: ${error.message}`);
			return false;
		}
	}
	
	/**
	 * Remove all highlighting from unfilled fields
	 * @returns {Object} Result object with success status
	 */
	removeHighlights() {
		try {
			// Remove all highlight classes
			const highlightedElements = document.querySelectorAll('.autofill-highlight-unfilled');
			highlightedElements.forEach(element => {
				element.classList.remove('autofill-highlight-unfilled');
			});
			
			Logger.debug(`Removed highlights from ${highlightedElements.length} fields`);
			
			return {
				success: true,
				removedCount: highlightedElements.length
			};
		} catch (error) {
			Logger.error(`Error removing highlights: ${error.message}`);
			return {
				success: false,
				error: error.message
			};
		}
	}
}

try {
	globalThis.FormAutoFiller = FormAutoFiller;
} catch (e) {}


