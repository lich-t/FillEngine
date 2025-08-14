/**
 * Popup Script for Auto-Fill Google Forms Extension
 * Modern, minimal UI with clean interactions
 */

"use strict";

document.addEventListener("DOMContentLoaded", function () {
  // DOM Elements
  const fillFormBtn = document.getElementById("fillFormBtn");
  const buttonText = fillFormBtn.querySelector(".button-text");
  const statusDiv = document.getElementById("status");
  const statsDiv = document.getElementById("stats");
  const fieldsDetectedSpan = document.getElementById("fieldsDetected");
  const fieldsFilledSpan = document.getElementById("fieldsFilled");
  const successRateSpan = document.getElementById("successRate");
  const resultsDiv = document.getElementById("results");
  const csvFileInput = document.getElementById("csvFileInput");
  const fileStatus = document.getElementById("fileStatus");
  const userProfileDisplay = document.getElementById("userProfileDisplay");
  const profileName = document.getElementById("profileName");
  const profileDetails = document.getElementById("profileDetails");

  // New DOM Elements for profiles
  const profileModeBtn = document.getElementById("profileModeBtn");
  const csvModeBtn = document.getElementById("csvModeBtn");
  const profileSection = document.getElementById("profileSection");
  const csvSection = document.getElementById("csvSection");
  const profileSelect = document.getElementById("profileSelect");

  console.log("🔧 DOM ELEMENTS FOUND:");
  console.log("├── fillFormBtn:", !!fillFormBtn);
  console.log("├── csvFileInput:", !!csvFileInput);
  console.log("├── fileStatus:", !!fileStatus);
  console.log("├── userProfileDisplay:", !!userProfileDisplay);
  console.log("├── profileModeBtn:", !!profileModeBtn);
  console.log("├── csvModeBtn:", !!csvModeBtn);
  console.log("└── profileSelect:", !!profileSelect);

  // Current user data (will be updated when CSV is loaded or profile selected)
  let currentUserData = null;
  let currentMode = "profiles"; // "profiles" or "csv"
  let availableProfiles = [];

  /**
   * Save state to chrome storage
   * @param {string} selectedProfileId - ID of the selected profile
   * @param {string} mode - Current mode ("profiles" or "csv")
   */
  async function saveState(selectedProfileId = null, mode = currentMode) {
    try {
      const state = {
        selectedProfileId: selectedProfileId,
        mode: mode,
        timestamp: Date.now(),
      };

      await chrome.storage.local.set({ appState: state });
      console.log("💾 State saved:", state);
    } catch (error) {
      console.error("Error saving state:", error);
    }
  }

  /**
   * Load state from chrome storage
   * @returns {Object|null} Saved state or null if none exists
   */
  async function loadState() {
    try {
      const result = await chrome.storage.local.get("appState");
      const state = result.appState;

      if (state) {
        console.log("📖 State loaded:", state);
        return state;
      } else {
        console.log("📖 No saved state found, using defaults");
        return null;
      }
    } catch (error) {
      console.error("Error loading state:", error);
      return null;
    }
  }

  /**
   * Clear saved state
   */
  async function clearState() {
    try {
      await chrome.storage.local.remove("appState");
      console.log("🗑️ State cleared");
    } catch (error) {
      console.error("Error clearing state:", error);
    }
  }

  /**
   * Restore the saved state (mode and selected profile)
   */
  async function restoreSavedState() {
    try {
      const savedState = await loadState();

      if (!savedState) {
        console.log("📝 No saved state found, using defaults");
        // Save initial state
        await saveState(null, currentMode);
        return;
      }

      console.log("🔄 Restoring saved state...");
      console.log(`├── Restoring mode: ${savedState.mode}`);
      console.log(`└── Restoring selected profile: ${savedState.selectedProfileId}`);

      // Restore mode
      if (savedState.mode && savedState.mode !== currentMode) {
        switchMode(savedState.mode);
      }

      // Restore selected profile (only in profiles mode)
      if (savedState.mode === "profiles" && savedState.selectedProfileId) {
        // Wait for profiles to be loaded first
        await initializeProfilesMode();

        // Set the selected profile
        const profileOption = profileSelect.querySelector(`option[value="${savedState.selectedProfileId}"]`);
        if (profileOption) {
          profileSelect.value = savedState.selectedProfileId;
          handleProfileSelection(savedState.selectedProfileId);
          console.log(`✅ Restored profile: ${savedState.selectedProfileId}`);
        } else {
          console.warn(`Profile ${savedState.selectedProfileId} not found in available profiles`);
        }
      }
    } catch (error) {
      console.error("Error restoring saved state:", error);
    }
  }

  /**
   * Load and parse the built-in profiles database
   * @returns {Promise<Array>} Array of profile objects
   */
  async function loadProfilesDatabase() {
    try {
      const response = await fetch(chrome.runtime.getURL("profiles.csv"));
      const csvContent = await response.text();

      console.log("🗄️ Profiles database loaded");
      console.log("├── Content length:", csvContent.length);

      return parseProfilesCSV(csvContent);
    } catch (error) {
      console.error("Error loading profiles database:", error);
      throw new Error("Impossible de charger la base de données des profils");
    }
  }

  /**
   * Parse profiles CSV content and convert to array of profile objects
   * @param {string} csvContent - Raw CSV content with multiple profiles
   * @returns {Array} Array of parsed profile objects
   */
  function parseProfilesCSV(csvContent) {
    try {
      const lines = csvContent.trim().split("\n");
      if (lines.length < 2) {
        throw new Error("CSV doit contenir au moins 2 lignes (en-tête + données)");
      }

      // Improved CSV parsing to handle quoted values
      function parseCSVLine(line) {
        const result = [];
        let current = "";
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
          const char = line[i];

          if (char === '"' && (i === 0 || line[i - 1] === ",")) {
            inQuotes = true;
          } else if (char === '"' && inQuotes && (i === line.length - 1 || line[i + 1] === ",")) {
            inQuotes = false;
          } else if (char === "," && !inQuotes) {
            result.push(current.trim());
            current = "";
          } else {
            current += char;
          }
        }
        result.push(current.trim());
        return result.map((value) => value.replace(/^"(.*)"$/, "$1")); // Remove outer quotes
      }

      const headers = parseCSVLine(lines[0]);
      const profiles = [];

      console.log("📋 CSV Headers found:", headers);

      // Parse each profile line
      for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);

        if (headers.length !== values.length) {
          console.warn(
            `Ligne ${i + 1}: Nombre d'en-têtes (${headers.length}) ne correspond pas au nombre de valeurs (${values.length})`
          );
          continue;
        }

        const profile = parseProfileFromValues(headers, values);
        if (profile) {
          profiles.push(profile);
        }
      }

      console.log(`✅ Parsed ${profiles.length} profiles from database`);
      return profiles;
    } catch (error) {
      console.error("Erreur de parsing du CSV des profils:", error);
      throw error;
    }
  }

  /**
   * Parse a single profile from headers and values
   * @param {Array} headers - CSV headers
   * @param {Array} values - CSV values for this profile
   * @returns {Object|null} Parsed profile object or null if error
   */
  function parseProfileFromValues(headers, values) {
    try {
      // Create user profile object
      const userProfile = {
        id: null,
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

      // Map CSV fields to user profile structure
      const fieldMapping = {
        id: ["id"],
        lastName: ["personal", "lastName"],
        firstName: ["personal", "firstName"],
        fullName: ["personal", "fullName"],
        gender: ["personal", "gender"],
        sex: ["personal", "sex"],
        email: ["contact", "email"],
        phone: ["contact", "phone"],
        mobile: ["contact", "mobile"],
        birthPlace: ["location", "birthPlace"],
        birthCountry: ["location", "birthCountry"],
        residence: ["location", "residence"],
        residenceCountry: ["location", "residenceCountry"],
        nationality: ["location", "nationality"],
        address: ["location", "address"],
        idNumber: ["documents", "idNumber"],
        passportNumber: ["documents", "passportNumber"],
        cniNumber: ["documents", "cniNumber"],
        fatherName: ["family", "fatherName"],
        motherName: ["family", "motherName"],
        usualLanguage: ["languages", "usual"],
        motherLanguage: ["languages", "mother"],
        profession: ["professional", "profession"],
        company: ["professional", "company"],
        academicReason: ["professional", "academicReason"],
        disabilities: ["medical", "disabilities"],
        birthDate: ["dates", "birthDate"],
        idExpirationDate: ["dates", "idExpirationDate"],
        idIssuanceDate: ["dates", "idIssuanceDate"],
        examSubjects: ["misc", "examSubjects"],
        idType: ["choices", "idType"],
        examTypes: ["choices", "examTypes"],
        hasDisabilities: ["choices", "hasDisabilities"],
        agreement: ["choices", "agreement"],
        termsAccepted: ["choices", "termsAccepted"],
        preferredLanguage: ["choices", "preferredLanguage"],
        hasExperience: ["choices", "hasExperience"],
        needsAccommodation: ["choices", "needsAccommodation"],
        isFirstTime: ["choices", "isFirstTime"],
      };

      // Populate user profile
      let fieldsProcessed = 0;
      headers.forEach((header, index) => {
        console.log(`Processing field ${index}: ${header} = "${values[index]}"`);
        const mapping = fieldMapping[header];
        if (mapping && values[index] !== undefined && values[index] !== "") {
          let value = values[index];

          // Handle special data types
          if ((header === "examTypes" || header === "examSubjects") && value.includes(",")) {
            console.log(`Splitting comma-separated value for ${header}: "${value}"`);
            value = value.split(",").map((v) => v.trim());
            console.log(`Result after split:`, value);
          } else if (["agreement", "termsAccepted", "hasExperience", "needsAccommodation", "isFirstTime"].includes(header)) {
            console.log(`Converting boolean for ${header}: "${value}" -> ${value.toLowerCase() === "true"}`);
            value = value.toLowerCase() === "true";
          } else if (header === "hasDisabilities") {
            // Special handling for hasDisabilities - can be boolean or text description
            console.log(`Processing hasDisabilities: "${value}"`);
            if (value.toLowerCase() === "true" || value.toLowerCase() === "false") {
              value = value.toLowerCase() === "true";
            } else if (value.toLowerCase() === "aucun" || value.toLowerCase() === "none") {
              value = false;
            } else {
              // Keep as text if it's a description
              value = value;
            }
            console.log(`hasDisabilities result:`, value);
          }

          if (mapping.length === 1) {
            userProfile[mapping[0]] = value;
          } else {
            const [category, field] = mapping;
            userProfile[category][field] = value;

            // Auto-create examTypesFull when examTypes is processed
            if (field === "examTypes" && Array.isArray(value)) {
              const examTypesMapping = {
                CE: "Compréhension écrite",
                CO: "Compréhension orale",
                EE: "Expression écrite",
                EO: "Expression orale",
              };
              const fullNames = value.map((code) => examTypesMapping[code] || code);
              userProfile[category]["examTypesFull"] = fullNames;
              console.log(`Auto-created examTypesFull:`, fullNames);
            }

            // Auto-create examSubjectsFull when examSubjects is processed
            if (field === "examSubjects" && Array.isArray(value)) {
              userProfile.misc["examSubjectsFull"] = value;
              console.log(`Auto-created examSubjectsFull:`, value);
            }
          }
          fieldsProcessed++;
          console.log(`✅ Processed field ${header}, total: ${fieldsProcessed}`);
        } else if (mapping) {
          console.log(`⚠️ Empty value for field: ${header}`);
        } else {
          console.warn(`❌ Unknown field in CSV: ${header}`);
        }
      });

      console.log(`Successfully processed ${fieldsProcessed} fields from CSV`);
      console.log("Final user profile:", userProfile);

      // For CSV upload mode, we don't need an ID, so only check if we have processed fields
      if (fieldsProcessed === 0) {
        console.warn("Profil ignoré: aucun champ valide trouvé");
        return null;
      }

      // If no ID is provided (CSV upload mode), generate a temporary one
      if (!userProfile.id) {
        userProfile.id = `csv_upload_${Date.now()}`;
      }

      return userProfile;
    } catch (error) {
      console.error("Erreur lors du parsing du profil:", error);
      return null;
    }
  }

  /**
   * Switch between profiles and CSV upload modes
   * @param {string} mode - "profiles" or "csv"
   */
  function switchMode(mode) {
    currentMode = mode;

    if (mode === "profiles") {
      profileModeBtn.classList.add("active");
      csvModeBtn.classList.remove("active");
      profileSection.classList.remove("hidden");
      csvSection.classList.add("hidden");

      console.log("🔄 Switched to profiles mode");
    } else {
      csvModeBtn.classList.add("active");
      profileModeBtn.classList.remove("active");
      csvSection.classList.remove("hidden");
      profileSection.classList.add("hidden");

      console.log("🔄 Switched to CSV upload mode");
    }

    // Reset current data when switching modes
    currentUserData = null;
    hideUserProfile();
    updateFillButtonState();

    // Save the new mode to storage
    saveState(null, mode);
  }

  /**
   * Initialize profiles mode by loading the built-in database
   */
  async function initializeProfilesMode() {
    try {
      console.log("🚀 Initializing profiles mode...");

      // Load profiles from database
      availableProfiles = await loadProfilesDatabase();

      // Populate the dropdown
      populateProfileSelect(availableProfiles);

      console.log("✅ Profiles mode initialized successfully");
    } catch (error) {
      console.error("Error initializing profiles mode:", error);
      showStatus("Erreur lors du chargement des profils", "error");
    }
  }

  /**
   * Populate the profile selection dropdown
   * @param {Array} profiles - Array of profile objects
   */
  function populateProfileSelect(profiles) {
    profileSelect.innerHTML = '<option value="">-- Choisir un profil --</option>';

    profiles.forEach((profile) => {
      const option = document.createElement("option");
      option.value = profile.id;

      const name =
        profile.personal?.fullName ||
        `${profile.personal?.firstName || ""} ${profile.personal?.lastName || ""}`.trim() ||
        `Profil ${profile.id}`;

      const profession = profile.professional?.profession || "";
      const company = profile.professional?.company || "";

      let displayText = `[${profile.id}] ${name}`;
      if (profession) {
        displayText += ` - ${profession}`;
      }

      option.textContent = displayText;
      option.dataset.profile = JSON.stringify(profile);

      profileSelect.appendChild(option);
    });

    console.log(`✅ Populated profile selector with ${profiles.length} profiles`);
  }

  /**
   * Handle profile selection
   * @param {string} profileId - Selected profile ID
   */
  function handleProfileSelection(profileId) {
    if (!profileId) {
      currentUserData = null;
      hideUserProfile();
      updateFillButtonState();
      // Clear saved profile ID
      saveState(null, currentMode);
      return;
    }

    const selectedOption = profileSelect.querySelector(`option[value="${profileId}"]`);
    if (!selectedOption) {
      console.error("Profile not found:", profileId);
      return;
    }

    try {
      const profile = JSON.parse(selectedOption.dataset.profile);
      currentUserData = profile;

      console.log("✅ Profile selected:", profile.id);
      console.log("├── Name:", profile.personal?.fullName);
      console.log("├── Email:", profile.contact?.email);
      console.log("└── Profession:", profile.professional?.profession);

      // Update main profile display
      updateProfileDisplay(profile);

      // Update fill button state
      updateFillButtonState();

      // Save selected profile ID to storage
      saveState(profileId, currentMode);
    } catch (error) {
      console.error("Error parsing selected profile:", error);
      currentUserData = null;
      updateFillButtonState();
    }
  }

  /**
   * Update the user profile display section
   * @param {Object} userData - User data object to display
   */
  function updateProfileDisplay(userData) {
    if (!userData) {
      hideUserProfile();
      return;
    }

    const name =
      userData.personal?.fullName ||
      `${userData.personal?.firstName || ""} ${userData.personal?.lastName || ""}`.trim() ||
      "Utilisateur";
    const email = userData.contact?.email || "";
    const profession = userData.professional?.profession || "";

    profileName.textContent = name;

    let details = [];
    if (email) details.push(`📧 ${email}`);
    if (profession) details.push(`💼 ${profession}`);
    if (userData.location?.nationality) details.push(`🌍 ${userData.location.nationality}`);

    profileDetails.innerHTML = details.join("<br>");
    userProfileDisplay.style.display = "block";

    console.log("✅ Profile display updated");
  }

  /**
   * Hide the user profile display
   */
  function hideUserProfile() {
    userProfileDisplay.style.display = "none";
  }

  /**
   * Check if the current tab is a Google Forms page
   * @returns {Promise<boolean>} True if it's a Google Forms page
   */
  async function isGoogleFormsPage() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      return tab.url && tab.url.includes("docs.google.com/forms");
    } catch (error) {
      console.error("Error checking page:", error);
      return false;
    }
  }

  /**
   * Update fill button state based on current data and page
   */
  async function updateFillButtonState() {
    try {
      console.log("🔄 Updating button state...");
      console.log("├── Current mode:", currentMode);
      console.log("├── Current user data exists:", !!currentUserData);
      console.log("└── User data:", currentUserData);

      const isFormsPage = await isGoogleFormsPage();
      console.log("├── Is Google Forms page:", isFormsPage);

      if (!isFormsPage) {
        fillFormBtn.disabled = true;
        fillFormBtn.style.background = "#f1f3f5";
        fillFormBtn.style.color = "#9ca3af";
        fillFormBtn.title = "Naviguez vers une page Google Forms";
        showStatus("Page Google Forms requise", "error");
        console.log("❌ Button disabled: Not on Google Forms page");
      } else if (!currentUserData) {
        fillFormBtn.disabled = true;
        fillFormBtn.style.background = "#f1f3f5";
        fillFormBtn.style.color = "#9ca3af";

        if (currentMode === "profiles") {
          fillFormBtn.title = "Sélectionnez d'abord un profil";
          // Only show status if no other status is currently displayed
          if (!statusDiv.textContent || statusDiv.style.display === "none") {
            showStatus("Sélectionnez un profil pour continuer", "info");
          }
          console.log("❌ Button disabled: No profile selected");
        } else {
          fillFormBtn.title = "Chargez d'abord un fichier CSV";
          // Only show status if no other status is currently displayed
          if (!statusDiv.textContent || statusDiv.style.display === "none") {
            showStatus("Chargez un fichier CSV pour continuer", "info");
          }
          console.log("❌ Button disabled: No CSV data");
        }
      } else {
        fillFormBtn.disabled = false;
        fillFormBtn.style.background = "";
        fillFormBtn.style.color = "";
        fillFormBtn.title = "";
        hideStatus();
        console.log("✅ Button enabled: Ready to fill form");
      }
    } catch (error) {
      console.error("Error updating button state:", error);
    }
  }

  /**
   * Show status message
   * @param {string} message - Status message
   * @param {string} type - Status type ("success", "error", "info")
   */
  function showStatus(message, type = "info") {
    statusDiv.textContent = message;
    statusDiv.className = `status ${type}`;
    statusDiv.style.display = "block";
  }

  /**
   * Hide status message
   */
  function hideStatus() {
    statusDiv.style.display = "none";
  }

  /**
   * CSV File handling for upload mode
   */
  function handleCSVFile(event) {
    const file = event.target.files[0];
    if (!file) {
      currentUserData = null;
      hideUserProfile();
      updateFillButtonState();
      return;
    }

    console.log("📄 CSV file selected:", file.name, `(${file.size} bytes)`);

    // Validate file type
    if (!file.name.toLowerCase().endsWith(".csv")) {
      showStatus("Veuillez sélectionner un fichier CSV", "error");
      currentUserData = null;
      updateFillButtonState();
      return;
    }

    // Show loading status
    showStatus("Chargement du fichier...", "info");

    const reader = new FileReader();
    reader.onload = function (e) {
      try {
        const csvContent = e.target.result;
        console.log("📄 CSV content loaded, parsing...");

        const userData = parseCSV(csvContent);

        if (userData) {
          currentUserData = userData;
          console.log("✅ CSV parsed successfully:", userData);

          // Update profile display
          updateProfileDisplay(userData);

          // Show success message
          const fieldCount =
            Object.keys(userData.personal || {}).length +
            Object.keys(userData.contact || {}).length +
            Object.keys(userData.location || {}).length +
            Object.keys(userData.choices || {}).length;

          showStatus(`✅ Fichier CSV chargé avec succès! ${fieldCount} champs détectés`, "success");

          // Auto-hide success message after 3 seconds to not interfere with button state
          setTimeout(() => {
            if (currentUserData) {
              hideStatus();
            }
          }, 3000);
        } else {
          throw new Error("Aucune donnée valide trouvée dans le CSV");
        }
      } catch (error) {
        console.error("Erreur de parsing CSV:", error);
        showStatus(`❌ Erreur CSV: ${error.message}`, "error");
        currentUserData = null;
        hideUserProfile();
      }

      // Always update button state at the end
      updateFillButtonState();
    };

    reader.onerror = function () {
      console.error("Erreur de lecture du fichier");
      showStatus("❌ Erreur lors de la lecture du fichier", "error");
      currentUserData = null;
      hideUserProfile();
      updateFillButtonState();
    };

    reader.readAsText(file, "UTF-8");
  }

  /**
   * Parse CSV content and return user data
   * @param {string} csvContent - Raw CSV content
   * @returns {Object|null} Parsed user data or null if error
   */
  function parseCSV(csvContent) {
    try {
      const lines = csvContent
        .trim()
        .split("\n")
        .filter((line) => line.trim().length > 0);
      console.log(`📋 CSV Lines found: ${lines.length}`);

      if (lines.length < 2) {
        throw new Error("CSV doit contenir au moins 2 lignes (en-tête + données)");
      }

      // Improved CSV parsing to handle quoted values with commas
      function parseCSVLine(line) {
        const result = [];
        let current = "";
        let inQuotes = false;
        let i = 0;

        while (i < line.length) {
          const char = line[i];

          if (char === '"') {
            if (!inQuotes) {
              // Starting quotes
              inQuotes = true;
            } else if (i + 1 < line.length && line[i + 1] === '"') {
              // Escaped quotes ("")
              current += '"';
              i++; // Skip next quote
            } else {
              // Ending quotes
              inQuotes = false;
            }
          } else if (char === "," && !inQuotes) {
            // Field separator (not in quotes)
            result.push(current.trim());
            current = "";
          } else {
            current += char;
          }
          i++;
        }

        // Add the last field
        result.push(current.trim());

        // Clean up quotes from fields
        return result.map((field) => {
          // Remove surrounding quotes if they exist
          if (field.startsWith('"') && field.endsWith('"')) {
            return field.slice(1, -1);
          }
          return field;
        });
      }

      const headers = parseCSVLine(lines[0]);
      console.log("📋 CSV Headers:", headers);
      console.log(`📋 Headers count: ${headers.length}`);

      // Parse all data lines (skip header)
      const allUserData = [];
      for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        console.log(`📋 CSV Line ${i} Values (first 5):`, values.slice(0, 5));
        console.log(`📋 Line ${i} - Headers: ${headers.length}, Values: ${values.length}`);

        if (headers.length !== values.length) {
          console.error(`Line ${i} mismatch details:`);
          console.error("Headers:", headers);
          console.error("Values:", values);
          throw new Error(
            `Ligne ${i}: Nombre d'en-têtes (${headers.length}) ne correspond pas au nombre de valeurs (${values.length})`
          );
        }

        // Use the same parsing logic as profiles
        const userData = parseProfileFromValues(headers, values);

        if (!userData) {
          throw new Error(`Impossible de parser les données de la ligne ${i}`);
        }

        allUserData.push(userData);
        console.log(`✅ Parsed user data line ${i}:`, userData);
      }

      // For now, return the first user data (single user mode)
      // TODO: In the future, could support multiple profiles
      if (allUserData.length === 0) {
        throw new Error("Aucune donnée utilisateur trouvée");
      }

      console.log(`✅ Successfully parsed ${allUserData.length} user record(s)`);
      return allUserData[0]; // Return first profile for now
    } catch (error) {
      console.error("Erreur de parsing CSV:", error);
      throw error;
    }
  }

  /**
   * Keep popup open during operations
   */
  function keepPopupOpen() {
    // Prevent popup from closing during operations
    document.addEventListener("click", function (event) {
      event.stopPropagation();
    });
  }

  /**
   * Main form filling function
   */
  async function fillForm() {
    if (!currentUserData) {
      showStatus("Aucune donnée utilisateur disponible", "error");
      return;
    }

    try {
      // Visual feedback
      fillFormBtn.disabled = true;
      buttonText.textContent = "Remplissage...";
      showStatus("Remplissage du formulaire en cours...", "info");
      hideResults();

      console.log("🚀 Starting form fill process");
      console.log("User data:", currentUserData);

      // Send message to content script
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      const response = await chrome.tabs.sendMessage(tab.id, {
        action: "fillForm",
        userData: currentUserData,
      });

      if (response && response.success) {
        console.log("✅ Form filled successfully");
        console.log("Results:", response.results);

        // Update UI with results - note: response.results should be the stats object
        if (response.results && response.results.detectionResults) {
          updateStats(response.results.detectionResults);
          showResults(response.results.detectionResults);
        } else if (Array.isArray(response.results)) {
          updateStats(response.results);
          showResults(response.results);
        }

        const filledCount = Array.isArray(response.results)
          ? response.results.filter((r) => r.matched).length
          : response.results.fieldsFilled || 0;

        showStatus(`Formulaire rempli avec succès! ${filledCount} champs remplis`, "success");
      } else {
        throw new Error(response?.error || "Erreur lors du remplissage");
      }
    } catch (error) {
      console.error("Error filling form:", error);
      showStatus(`Erreur: ${error.message}`, "error");
    } finally {
      // Reset button state
      fillFormBtn.disabled = false;
      buttonText.textContent = "Remplir le formulaire";
      updateFillButtonState();
    }
  }

  /**
   * Update statistics display
   * @param {Array} results - Array of field fill results
   */
  function updateStats(results) {
    const totalFields = results.length;
    const filledFields = results.filter((result) => result.matched).length;
    const successRate = totalFields > 0 ? Math.round((filledFields / totalFields) * 100) : 0;

    fieldsDetectedSpan.textContent = totalFields;
    fieldsFilledSpan.textContent = filledFields;
    successRateSpan.textContent = `${successRate}%`;

    statsDiv.style.display = "block";
  }

  /**
   * Show detailed results
   * @param {Array} results - Array of field fill results
   */
  function showResults(results) {
    resultsDiv.innerHTML = "";

    const filledResults = results.filter((result) => result.matched);
    const unfilledResults = results.filter((result) => !result.matched);

    // Show filled fields
    if (filledResults.length > 0) {
      const filledSection = document.createElement("div");
      filledSection.className = "results-section";
      filledSection.innerHTML = `<h4>✅ Champs remplis (${filledResults.length})</h4>`;

      filledResults.forEach((result) => {
        const item = document.createElement("div");
        item.className = "result-item success";
        item.innerHTML = `
          <strong>${result.field}</strong>: ${result.value}
          <small>${result.element}</small>
        `;
        filledSection.appendChild(item);
      });

      resultsDiv.appendChild(filledSection);
    }

    // Show unfilled fields
    if (unfilledResults.length > 0) {
      const unfilledSection = document.createElement("div");
      unfilledSection.className = "results-section";
      unfilledSection.innerHTML = `<h4>❌ Champs non trouvés (${unfilledResults.length})</h4>`;

      unfilledResults.forEach((result) => {
        const item = document.createElement("div");
        item.className = "result-item error";
        item.innerHTML = `<strong>${result.field}</strong>: ${result.value}`;
        unfilledSection.appendChild(item);
      });

      resultsDiv.appendChild(unfilledSection);
    }

    resultsDiv.style.display = "block";
  }

  /**
   * Hide results section
   */
  function hideResults() {
    resultsDiv.style.display = "none";
    statsDiv.style.display = "none";
  }

  /**
   * Initialize the popup
   */
  async function initialize() {
    console.log("🚀 Initializing popup...");

    // Keep popup open during operations
    keepPopupOpen();

    // Initialize profiles mode by default
    await initializeProfilesMode();

    // Restore saved state
    await restoreSavedState();

    // Add mode switcher handlers
    profileModeBtn.addEventListener("click", () => switchMode("profiles"));
    csvModeBtn.addEventListener("click", () => switchMode("csv"));

    // Add profile selection handler
    profileSelect.addEventListener("change", (e) => {
      console.log("📋 Profile selection changed:", e.target.value);
      handleProfileSelection(e.target.value);
    });

    // Add CSV file input handler
    csvFileInput.addEventListener("change", handleCSVFile);

    // Add fill form button handler
    fillFormBtn.addEventListener("click", fillForm);

    // Initial button state update
    await updateFillButtonState();

    console.log("✅ Popup initialized successfully");
  }

  // Initialize the popup
  initialize();
});
