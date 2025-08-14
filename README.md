# 🚀 Auto-Fill Forms Extension

Extension Chrome moderne pour le remplissage automatique intelligent de formulaires web, en particulier Google Forms. Maintenant avec support de données CSV personnalisées !

## ✨ Fonctionnalités

- 🎯 **Remplissage intelligent** : Détection automatique des champs de formulaire
- � **Support Google Forms** : Optimisé pour les formulaires Google
- � **Données CSV** : Chargez vos propres données depuis un fichier CSV
- � **Configuration flexible** : Adaptation automatique selon le type de page
- 📈 **Statistiques détaillées** : Rapport complet du remplissage
- 🎨 **Interface moderne** : Design épuré et intuitif

## 🆕 Nouveautés v2.0

- ✅ **Suppression des données en dur** : Plus de données codées dans l'extension
- ✅ **Upload CSV** : Chargez vos données personnelles via un fichier CSV
- ✅ **Sécurité améliorée** : Vos données restent locales
- ✅ **Flexibilité maximale** : Utilisez l'extension avec n'importe quelles données
- ✅ **Validation avancée** : Vérification automatique du format CSV

## 📦 Installation

1. Téléchargez ou clonez ce projet
2. Ouvrez Chrome et accédez à `chrome://extensions/`
3. Activez le "Mode développeur"
4. Cliquez sur "Charger l'extension non empaquetée"
5. Sélectionnez le dossier de l'extension

## 🎯 Utilisation

### 1. Préparer vos données

1. Créez un fichier CSV avec vos données personnelles
2. Utilisez le fichier `example_data.csv` comme modèle
3. Consultez le `CSV_GUIDE.md` pour les détails complets

### 2. Charger les données

1. Cliquez sur l'icône de l'extension dans Chrome
2. Cliquez sur "📁 Charger données CSV"
3. Sélectionnez votre fichier CSV
4. Attendez la confirmation de chargement

### 3. Remplir un formulaire

1. Naviguez vers le formulaire web
2. Cliquez sur l'icône de l'extension
3. Cliquez sur "Remplir le formulaire"
4. Consultez les statistiques de remplissage

## � Structure du projet

```
extension/
├── manifest.json          # Configuration de l'extension
├── background.js          # Script d'arrière-plan
├── content.js            # Script de contenu principal
├── popup.html            # Interface utilisateur
├── popup.js              # Logique de l'interface
├── example_data.csv      # Exemple de données CSV
├── CSV_GUIDE.md          # Guide détaillé du format CSV
├── README.md             # Ce fichier
└── public/
    └── icons/            # Icônes de l'extension
        ├── icon16.png
        ├── icon32.png
        ├── icon48.png
        └── icon128.png
```

## 🔧 Configuration CSV

### Format requis

Votre fichier CSV doit contenir 38 colonnes spécifiques. Consultez `CSV_GUIDE.md` pour la liste complète.

### Exemple minimal

```csv
lastName,firstName,fullName,gender,sex,email,phone,mobile,birthPlace,birthCountry,residence,residenceCountry,nationality,address,idNumber,passportNumber,cniNumber,fatherName,motherName,usualLanguage,motherLanguage,profession,company,academicReason,disabilities,birthDate,idExpirationDate,idIssuanceDate,examSubjects,idType,examTypes,hasDisabilities,agreement,termsAccepted,preferredLanguage,hasExperience,needsAccommodation,isFirstTime
DUPONT,Jean,"Jean DUPONT",Masculin,Homme,jean.dupont@email.com,0123456789,0123456789,Paris,France,Lyon,France,Française,"123 Rue Example, Lyon",FR123456789,FR123456789,FR123456789,Pierre DUPONT,Marie MARTIN,Français,Français,Développeur,TechCorp,Académique,Aucun,1985-03-15,2030-12-31,2020-01-01,Tous,CNI,"CE,CO",Aucun,true,true,Français,true,false,true
```

    newField: "New Value",

},
};

```

### Step 2: Add Field Mappings

## 🎨 Interface utilisateur

L'extension propose une interface moderne avec :

- **Section upload** : Zone de glisser-déposer pour les fichiers CSV
- **Status en temps réel** : Indication du statut de chargement
- **Bouton de remplissage** : Action principale avec feedback visuel
- **Statistiques détaillées** : Rapport complet avec métriques
- **Résultats détaillés** : Liste des champs traités

## 🔍 Types de champs supportés

- ✅ **Champs texte** : input[type="text"], textarea
- ✅ **Emails** : input[type="email"]
- ✅ **Téléphones** : input[type="tel"]
- ✅ **Dates** : input[type="date"]
- ✅ **Sélections** : select, dropdown
- ✅ **Boutons radio** : input[type="radio"], role="radio"
- ✅ **Cases à cocher** : input[type="checkbox"], role="checkbox"

## 🌐 Sites supportés

- **Google Forms** : Support complet avec sélecteurs optimisés
- **Formulaires génériques** : Détection automatique des champs
- **Pages locales** : Mode test pour le développement

## � Développement

### Structure du code

- `content.js` : Logique principale de détection et remplissage
- `popup.js` : Interface utilisateur et gestion CSV
- `background.js` : Gestion des permissions et communication

### Classes principales

- `FormDetector` : Détection des éléments de formulaire
- `FieldMatcher` : Correspondance intelligente des champs
- `FieldFiller` : Remplissage des différents types de champs
- `FormAutoFiller` : Orchestration principale

## � Sécurité et confidentialité

- ✅ **Données locales** : Aucune transmission de données
- ✅ **Permissions minimales** : Accès uniquement aux onglets actifs
- ✅ **Code open source** : Transparence totale
- ✅ **Pas de tracking** : Aucune collecte de données

## 🐛 Dépannage

### Problèmes courants

1. **Champs non remplis** :
   - Vérifiez que votre CSV est correctement formaté
   - Consultez la console pour les erreurs

2. **CSV non reconnu** :
   - Vérifiez le nombre de colonnes (37 requis)
   - Utilisez l'exemple fourni comme base

3. **Formulaire non détecté** :
   - Actualisez la page
   - Vérifiez que la page contient des formulaires

### Debug

Ouvrez la console développeur (F12) pour voir les logs détaillés :
- `[AutoFill]` : Messages de l'extension
- Statistiques de détection
- Erreurs de remplissage

## 📊 Métriques

L'extension fournit des statistiques complètes :

- **Questions détectées** : Nombre total de champs trouvés
- **Champs remplis** : Nombre de champs complétés avec succès
- **Taux de réussite** : Pourcentage de réussite global
- **Détails par champ** : Statut individuel de chaque champ

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à :

1. Signaler des bugs
2. Proposer des améliorations
3. Soumettre des pull requests
4. Améliorer la documentation

## 📄 Licence

Ce projet est distribué sous licence MIT. Voir le fichier LICENSE pour plus de détails.

## 🆘 Support

Pour obtenir de l'aide :

1. Consultez ce README et le `CSV_GUIDE.md`
2. Vérifiez les issues existantes
3. Créez une nouvelle issue si nécessaire
4. Incluez les logs de la console pour les bugs

---

**Développé avec ❤️ pour simplifier le remplissage de formulaires web**
```
