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
}

try {
	globalThis.FormAutoFiller = FormAutoFiller;
} catch (e) {}


