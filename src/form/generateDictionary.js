"use strict";

let USER_PROFILE = {
	personal: {},
	contact: {},
	location: {},
	documents: {},
	family: {},
	languages: {},
	professional: {},
	medical: {},
	dates: {},
	misc: {},
	choices: {},
};

const FIELD_MAPPINGS = {
	personal: {
		lastName: [
			"nom",
			"noms",
			"name",
			"lastname",
			"last name",
			"nom candidat",
			"noms candidat",
			"noms du candidat",
			"noms du candidats",
		],
		firstName: [
			"prénom",
			"prenom",
			"prenoms",
			"firstname",
			"first name",
			"prenoms candidat",
			"prenoms du candidat",
		],
		fullName: [
			"nom complet",
			"full name",
			"nom complet signature",
			"votre nom complet",
		],
		gender: ["genre", "sexe", "sexe du candidat", "sexe biologique"],
		sex: ["sexe", "sexe du candidat", "sexe biologique"],
	},
	contact: {
		email: [
			"email",
			"courriel",
			"e-mail",
			"adresse courriel",
			"adresse mail",
			"adresse  mail",
		],
		phone: [
			"contact",
			"téléphone",
			"telephone",
			"tel",
			"phone",
			"numéro téléphone",
			"numéro de téléphone",
			"numéro mobile",
			"mobile",
		],
	},
	location: {
		birthPlace: [
			"lieu naissance",
			"lieu de naissance",
			"ville naissance",
			"ville de naissance",
		],
		birthCountry: ["pays naissance", "pays de naissance"],
		residence: [
			"lieu résidence",
			"lieu de résidence",
			"lieu de residence",
			"lieu de résidence ",
			"ville résidence",
			"ville de résidence",
			"ville de residence",
			"ville de résidence ",
			"ville",
			"city",
		],
		nationality: ["nationalité"],
		country: ["country"],
		address: ["adresse", "address"],
	},
	documents: {
		idNumber: [
			"numéro cni",
			"numero cni",
			"numéro passeport",
			"numero passeport",
			"numéro pièce",
			"numero piece",
			"numéro de la pièce",
			"numéro de la piece",
			"numéro pièce identité",
			"numero piece identite",
			"numéro de la pièce d'identité",
			"numéro de la piece d'identité",
			"numéro de la piece d'idententité",
			"n° cni",
			"n° passeport",
			"cni",
			"passeport",
			"numéro cni / passeport",
			"numero cni / passeport",
		],
	},
	dates: {
		birthDate: [
			"date naissance",
			"date de naissance",
			"né le",
			"nee le",
			"né(e) le",
			"birthdate",
			"birth date",
			"date birth",
		],
		idExpirationDate: [
			"date expiration",
			"date d'expiration",
			"date d'expiration cni / passeport",
			"date d'expiration cni/passeport",
			"date expiration cni / passeport",
			"date expiration cni/passeport",
			"expire le",
			"expire",
			"validité",
			"valide jusqu'au",
			"valable jusqu'au",
			"expiry date",
			"expiration",
			"fin validité",
			"cni expire",
			"passeport expire",
		],
		idIssuanceDate: [
			"date délivrance",
			"date de délivrance",
			"date de délivrance cni / passeport",
			"date de délivrance cni/passeport",
			"date délivrance cni / passeport",
			"date délivrance cni/passeport",
			"délivrée le",
			"delivree le",
			"délivré le",
			"delivre le",
			"date établissement",
			"date d'établissement",
			"établie le",
			"etablie le",
			"établi le",
			"etabli le",
			"issue date",
			"issuance date",
			"délivrance",
			"delivrance",
		],
	},
	family: {
		fatherName: ["nom père", "nom pere", "nom du père", "nom du pere"],
		motherName: ["nom mère", "nom mere", "nom de la mère", "nom de la mere"],
	},
	languages: {
		usual: ["langue usuelle"],
		mother: ["langue maternelle"],
	},
	professional: {
		profession: ["profession"],
		company: ["company"],
		academicReason: [
			"motif",
			"motifs",
			"raison",
			"pour quelle raison",
			"quelle raison",
			"passez-vous ce test",
			"pour quelle raison passez-vous ce test",
			"motifs (pour quelle raison passez-vous ce test académique, professionnelle, personnelle, émigration, citoyenneté, entrée express, etc.)",
			"pour quelle raison passez-vous ce test académique",
		],
	},
	medical: {
		disabilities: [
			"handicapts",
			"handicap",
			" Souffrez-vous d'un handicap?",
			"(Qui vous empêche de passer l'examen dans les mêmes conditions que tout le monde? Si oui, vous ne pouvez ",
		],
	},
	signature: [
		"signature",
		"veuillez signer",
		"veuillez signer en écrivant votre nom complet",
		"en signant ce document vous confirmez que toutes les informations que vous avez fournis sont les vôtres et que vous avez correctement suivi la procédure d'inscription.nb toute fausse information entrainera le rejet de votre candidature et le non remboursement des frais d'examens payésveuillez signer en écrivant votre nom complet",
		"en signant ce document vous confirmez",
		"toutes les informations que vous avez fournis",
		"veuillez signer en écrivant",
	],
	misc: {
		examSubjects: ["sujet d'examen", "sujet examen"],
	},
	choices: {
		idType: [
			"type de piece d'idententité",
			"type de pièce d'identité",
			"type de piece d'identité",
			"type document",
			"document type",
		],
		gender: ["genre"],
		sex: ["sexe"],
		examTypes: [
			"sujet d'examen",
			"sujet examen",
			"sujets d'examen",
			"sujets examen",
			"Épreuves",
			"Épreuves : sélectionnez toutes les épreuves",
		],
		examTypesFull: [
			"sujet d'examen",
			"sujet examen",
			"sujets d'examen",
			"sujets examen",
			"Épreuves",
			"Épreuves : sélectionnez toutes les épreuves",
		],
		hasDisabilities: [
			"handicapts",
			"handicap",
			"difficultés",
			"difficultes",
			"besoins particuliers",
		],
		agreement: [
			"engagement sur l'honneur",
			"engagement sur honneur",
			"cochez la case",
			"j'engage ma responsabilité",
			"je confirme",
			"j'accepte",
		],
		termsAccepted: [
			"conditions d'utilisation",
			"conditions utilisation",
			"règles de confidentialité",
			"regles confidentialite",
			"accepter les conditions",
			"accepte les termes",
		],
	},
};

function generateFlatDictionary() {
	const flatDict = {};

	if (!USER_PROFILE.personal || Object.keys(USER_PROFILE.personal).length === 0) {
		Logger.warn("USER_PROFILE is empty. Please upload CSV data first.");
		return flatDict;
	}

	FIELD_MAPPINGS.signature.forEach((key) => {
		flatDict[key] = USER_PROFILE.personal.fullName || "";
	});

	Object.entries(FIELD_MAPPINGS).forEach(([category, fields]) => {
		if (category === "signature") return;
		Object.entries(fields).forEach(([fieldType, variations]) => {
			let value;
			if (category === "dates" && USER_PROFILE.dates && USER_PROFILE.dates[fieldType]) {
				value = USER_PROFILE.dates[fieldType];
			} else if (category === "choices" && USER_PROFILE.choices && USER_PROFILE.choices[fieldType]) {
				value = USER_PROFILE.choices[fieldType];
				if (fieldType === "examTypes" && Array.isArray(value)) {
					const examTypesMapping = {
						CE: "Compréhension écrite",
						CO: "Compréhension orale",
						EE: "Expression écrite",
						EO: "Expression orale",
					};
					const fullNames = value.map((code) => examTypesMapping[code] || code);
					USER_PROFILE.choices.examTypesFull = fullNames;
					variations.forEach((variation) => {
						flatDict[variation] = value;
					});
					const fullNamesVariations = [
						"sujet d'examen complet",
						"sujets d'examen complets",
						"matières d'examen",
					];
					fullNamesVariations.forEach((variation) => {
						flatDict[variation] = fullNames;
					});
					return;
				}
			} else if (USER_PROFILE[category] && USER_PROFILE[category][fieldType]) {
				value = USER_PROFILE[category][fieldType];
			}

			// Normalize sex/gender to canonical labels to improve matching
			if (
				(category === "personal" || category === "choices") &&
				(fieldType === "sex" || fieldType === "gender") &&
				value
			) {
				const norm = String(value)
					.toLowerCase()
					.normalize("NFD")
					.replace(/[\u0300-\u036f]/g, "")
					.trim();
				const map = {
					femme: ["feminin", "female", "f"],
					homme: ["masculin", "male", "m"],
				};
				for (const [canonical, alts] of Object.entries(map)) {
					if (alts.includes(norm) || canonical === norm) {
						value = canonical;
						break;
					}
				}
			}

			if (
				value !== undefined &&
				value !== null &&
				(!(typeof value === "string") || value.trim() !== "")
			) {
				variations.forEach((variation) => {
					flatDict[variation] = value;
				});
			}
		});
	});

	return flatDict;
}

try {
	globalThis.USER_PROFILE = USER_PROFILE;
	globalThis.FIELD_MAPPINGS = FIELD_MAPPINGS;
	globalThis.generateFlatDictionary = generateFlatDictionary;
} catch (e) {}


