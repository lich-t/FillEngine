"use strict";

class FieldMatcher {
	constructor(dictionary) {
		this.dictionary = dictionary;
	}

	findBestMatch(questionLabel) {
		let bestMatch = null;
		let bestScore = 0;

		for (const [key, value] of Object.entries(this.dictionary)) {
			const score = this.calculateMatchScore(questionLabel, key);
			if (score > bestScore && score >= CONFIG.minMatchScore) {
				bestScore = score;
				bestMatch = { key, value, score };
			}
		}

		return bestMatch;
	}

	calculateMatchScore(questionLabel, dictKey) {
		const question = questionLabel.toLowerCase().trim();
		const key = dictKey.toLowerCase().trim();

		if (question === key) return 1.0;

		if (question.includes(key)) {
			const ratio = key.length / question.length;
			return Math.min(0.95, 0.6 + ratio * 0.35);
		}

		if (key.includes(question) && question.length > 3) {
			return 0.8;
		}

		for (const [category, keywords] of Object.entries(CONFIG.specialKeywords)) {
			if (key.includes(category) || keywords.some((kw) => key.includes(kw))) {
				const keywordMatches = keywords.filter((kw) =>
					question.includes(kw)
				).length;
				if (keywordMatches >= 2) {
					return 0.85;
				}
			}
		}

		const questionWords = question
			.split(/[\s\-_,()\.!]+/)
			.filter((w) => w.length > 2);
		const keyWords = key.split(/[\s\-_,()\.!]+/).filter((w) => w.length > 2);

		if (questionWords.length === 0 || keyWords.length === 0) return 0;

		let matchingWords = 0;
		for (const qWord of questionWords) {
			let wordMatched = false;
			for (const kWord of keyWords) {
				if (qWord === kWord || qWord.includes(kWord) || kWord.includes(qWord)) {
					if (!wordMatched) {
						matchingWords++;
						wordMatched = true;
					}
				}
			}
		}

		const wordScore =
			matchingWords / Math.max(questionWords.length, keyWords.length);

		const keyWordsMatched = keyWords.filter((kWord) =>
			questionWords.some(
				(qWord) =>
					qWord === kWord || qWord.includes(kWord) || kWord.includes(qWord)
			)
		).length;

		const keyWordScore = keyWordsMatched / keyWords.length;

		return wordScore * 0.4 + keyWordScore * 0.6;
	}
}

try {
	globalThis.FieldMatcher = FieldMatcher;
} catch (e) {}


