import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import { getDatabase, ref, push, onValue } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyARc68C9RvqPHedrAtxJcZCUeZIEfn1XnA",
  authDomain: "dashbord-10e83.firebaseapp.com",
  databaseURL: "https://dashbord-10e83-default-rtdb.firebaseio.com",
  projectId: "dashbord-10e83",
  storageBucket: "dashbord-10e83.firebasestorage.app",
  messagingSenderId: "1060154426951",
  appId: "1:1060154426951:web:121e08b5f1ec5323f49362",
  measurementId: "G-97L4PN4Q0P"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);

document.addEventListener("DOMContentLoaded", () => {
  const loginContainer = document.getElementById("login-container");
  const dashboardContainer = document.getElementById("dashboard-container");
  const errorMessage = document.getElementById("error-message");
  const loginBtn = document.getElementById("login-btn");
  const logoutBtn = document.getElementById("logout-btn");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const mainContent = document.querySelector(".main-content");
  const sectionTitle = document.getElementById("section-title");
  const breadcrumbSection = document.getElementById("breadcrumb-section");
  const userEmail = document.getElementById("user-email");
  const sidebar = document.querySelector(".w-72");
  const hamburger = document.querySelector(".hamburger");

  // Initialize auditData structure
  let auditData = {
    "Audit 5S": [],
    "Audit Gemba": [],
    "TAU Emplissage": [],
    "Taux Absenteisme": [],
    "Taux Realisation 5S": [],
    "Taux Realisation Gemba": [],
    "Top Action 5S": [],
    "Top Action Gemba": []
  };

  let currentUser = null;

  // Ligne options
  const lignes = [
    "50T", "80T", "120T", "125T", "520T", "400T", "550T", "420T", "450T",
    "A12", "Boy2", "Boy3", "F06", "L101", "L108", "SKOUDA", "F73", "F27",
    "F87", "L84", "Magasin general", "Magasin P1", "Magasin P2", "F15",
    "F01", "F02", "F83", "F99", "F86", "F85", "L76", "L77", "Mure qualite"
  ];

  // UAP options
  const uaps = ["UAP1", "UAP2"];

  // Employee names for Taux Absenteisme
  const employees = [
    "Ahmed KHAMESI", "Anis YAHYAOUI", "Chemsi Mohamed", "Maugendre Jérémie",
    "Gargouri Mohamed Amine", "Hafaiedh Sami", "Tarek Jaouada", "Sghair Bedis",
    "Amine Aloui", "Chakroun Sahbi"
  ];

  // Predefined colors for charts
  const colors = [
    "#dc2626", "#ef4444", "#f87171", "#b91c1c", "#991b1b", "#7f1d1d",
    "#374151", "#4b5563", "#6b7280", "#9ca3af", "#d1d5db", "#e5e7eb",
    "#3b82f6", "#2563eb", "#1d4ed8", "#60a5fa", "#93c5fd", "#bfdbfe",
    "#10b981", "#059669", "#047857", "#34d399", "#6ee7b7", "#a7f3d0",
    "#f97316", "#ea580c", "#c2410c", "#fb923c", "#fdba74", "#fed7aa",
    "#8b5cf6", "#7c3aed", "#6d28d9", "#a78bfa", "#c4b5fd", "#ddd6fe"
  ];

  // Load data from Firebase
  function loadFirebaseData(callback) {
    let loadedSections = 0;
    const totalSections = Object.keys(auditData).length;
    Object.keys(auditData).forEach((section) => {
      const dataRef = ref(database, `auditData/${section}`);
      onValue(dataRef, (snapshot) => {
        try {
          const data = snapshot.val();
          auditData[section] = data ? Object.values(data) : [];
          console.log(`Loaded data for ${section}:`, auditData[section]);
          loadedSections++;
          if (loadedSections === totalSections && callback) {
            console.log("All Firebase data loaded:", auditData);
            callback();
          }
        } catch (error) {
          console.error(`Error loading data for ${section}:`, error);
        }
      }, (error) => {
        console.error(`Firebase error for ${section}:`, error);
        loadedSections++;
        if (loadedSections === totalSections && callback) {
          callback();
        }
      });
    });
  }

  // Login functionality with Firebase Auth
  loginBtn.addEventListener("click", () => {
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    if (!email || !password) {
      errorMessage.textContent = "Please enter both email and password";
      errorMessage.classList.remove("hidden");
      return;
    }

    signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        currentUser = userCredential.user;
        userEmail.textContent = currentUser.email;
        loginContainer.classList.add("hidden");
        loginContainer.style.display = "none";
        dashboardContainer.classList.remove("hidden");
        dashboardContainer.style.display = "block";
        dashboardContainer.style.opacity = "0";
        setTimeout(() => {
          dashboardContainer.style.opacity = "1";
          dashboardContainer.style.transition = "opacity 0.5s ease";
        }, 10);
        errorMessage.classList.add("hidden");
        if (hamburger) hamburger.classList.remove("hidden");
        loadFirebaseData(() => {
          console.log("Rendering Dashboard after login");
          renderSection("Dashboard");
        });
        const dashboardLink = document.querySelector('a[data-section="Dashboard"]');
        if (dashboardLink) {
          sidebarLinks.forEach((link) => link.classList.remove("active"));
          dashboardLink.classList.add("active");
        }
      })
      .catch((error) => {
        console.error("Login error:", error);
        errorMessage.textContent = "Invalid email or password";
        errorMessage.classList.remove("hidden");
      });
  });

  // Logout functionality
  logoutBtn.addEventListener("click", () => {
    signOut(auth).then(() => {
      currentUser = null;
      loginContainer.classList.remove("hidden");
      loginContainer.style.display = "flex";
      dashboardContainer.classList.add("hidden");
      dashboardContainer.style.display = "none";
      emailInput.value = "";
      passwordInput.value = "";
      errorMessage.classList.add("hidden");
      if (sidebar) sidebar.classList.remove("active");
      if (hamburger) hamburger.classList.add("hidden");
      sidebarLinks.forEach((link) => link.classList.remove("active"));
    }).catch((error) => {
      console.error("Logout error:", error);
    });
  });

  // Hamburger menu toggle
  if (hamburger) {
    hamburger.addEventListener("click", () => {
      console.log("Hamburger clicked, toggling sidebar");
      sidebar.classList.toggle("active");
    });
  }

  // Sidebar navigation
  const sidebarLinks = document.querySelectorAll(".w-72 ul li a:not(#logout-btn)");
  sidebarLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const section = link.getAttribute("data-section");
      console.log(`Sidebar link clicked: ${section}`);
      loadFirebaseData(() => {
        console.log(`Rendering section: ${section}`);
        renderSection(section);
      });
      if (sidebar) sidebar.classList.remove("active");
      sidebarLinks.forEach((l) => l.classList.remove("active"));
      link.classList.add("active");
    });
  });

  // Success and error messages
  function showSuccess(element, message) {
    element.textContent = message;
    element.classList.remove("text-red-600");
    element.classList.add("text-green-600");
    element.classList.remove("hidden");
    setTimeout(() => {
      element.classList.add("hidden");
    }, 3000);
  }

  function showError(element, message) {
    element.textContent = message;
    element.classList.remove("text-green-600");
    element.classList.add("text-red-600");
    element.classList.remove("hidden");
  }

  // Render content based on sidebar selection
  function renderSection(section) {
    console.log(`Starting renderSection for: ${section}`);
    mainContent.style.opacity = "0";
    setTimeout(() => {
      try {
        sectionTitle.textContent = section;
        breadcrumbSection.textContent = section;
        mainContent.innerHTML = "";

        if (section === "Audit 5S" || section === "Audit Gemba") {
          mainContent.innerHTML = `
            <h1 class="text-4xl font-extrabold text-gray-800">${section}</h1>
            <p class="mt-6 text-lg text-gray-600">Enter audit data below.</p>
            <div class="mt-6 bg-white p-6 rounded-lg shadow-lg">
              <div class="mb-4">
                <label for="date" class="block text-sm font-semibold text-gray-700">Date</label>
                <input type="date" id="date" class="mt-2 p-3 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent">
              </div>
              <div class="mb-4">
                <label for="week" class="block text-sm font-semibold text-gray-700">Week</label>
                <input type="number" id="week" min="1" max="52" class="mt-2 p-3 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent" placeholder="Enter week number (1-52)">
              </div>
              <div class="mb-4">
                <label for="uap" class="block text-sm font-semibold text-gray-700">UAP</label>
                <select id="uap" class="mt-2 p-3 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent">
                  <option value="">Select a UAP</option>
                  ${uaps.map((uap) => `<option value="${uap}">${uap}</option>`).join("")}
                </select>
              </div>
              <div class="mb-4">
                <label for="ligne" class="block text-sm font-semibold text-gray-700">Ligne</label>
                <select id="ligne" class="mt-2 p-3 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent">
                  <option value="">Select a ligne</option>
                  ${lignes.map((ligne) => `<option value="${ligne}">${ligne}</option>`).join("")}
                </select>
              </div>
              <div class="mb-4">
                <label for="score" class="block text-sm font-semibold text-gray-700">Score (%)</label>
                <input type="number" id="score" min="0" max="100" step="0.1" class="mt-2 p-3 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent" placeholder="Enter score (0-100)">
              </div>
              <button id="submit-audit" class="w-full bg-red-600 text-white p-3 rounded-lg font-semibold hover:bg-red-700 transition-all duration-200">Submit</button>
              <p id="form-error" class="hidden text-red-600 mt-4 text-center font-medium" aria-live="polite"></p>
            </div>
          `;

          const submitBtn = document.getElementById("submit-audit");
          submitBtn.addEventListener("click", () => {
            const date = document.getElementById("date").value;
            const week = document.getElementById("week").value;
            const uap = document.getElementById("uap").value;
            const ligne = document.getElementById("ligne").value;
            const score = document.getElementById("score").value;
            const formError = document.getElementById("form-error");

            const missingFields = [];
            if (!date) missingFields.push("Date");
            if (!week) missingFields.push("Week");
            if (!uap) missingFields.push("UAP");
            if (!ligne) missingFields.push("Ligne");
            if (!score) missingFields.push("Score");

            if (missingFields.length) {
              showError(formError, `Please fill: ${missingFields.join(", ")}`);
              return;
            }

            if (week < 1 || week > 52) {
              showError(formError, "Week must be between 1 and 52");
              return;
            }
            if (score < 0 || score > 100) {
              showError(formError, "Score must be between 0 and 100");
              return;
            }

            const dataRef = ref(database, `auditData/${section}`);
            push(dataRef, {
              date,
              week: parseInt(week),
              uap,
              ligne,
              score: parseFloat(score)
            }).then(() => {
              showSuccess(formError, "Data submitted successfully!");
              loadFirebaseData(() => renderSection(section));
            }).catch((error) => {
              console.error(`Error submitting ${section} data:`, error);
              showError(formError, "Failed to submit data");
            });
          });
        } else if (section === "TAU Emplissage") {
          mainContent.innerHTML = `
            <h1 class="text-4xl font-extrabold text-gray-800">${section}</h1>
            <p class="mt-6 text-lg text-gray-600">Enter TAU Emplissage data below.</p>
            <div class="mt-6 bg-white p-6 rounded-lg shadow-lg">
              <div class="mb-4">
                <label for="date" class="block text-sm font-semibold text-gray-700">Date</label>
                <input type="date" id="date" class="mt-2 p-3 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent">
              </div>
              <div class="mb-4">
                <label for="week" class="block text-sm font-semibold text-gray-700">Week</label>
                <input type="number" id="week" min="1" max="52" class="mt-2 p-3 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent" placeholder="Enter week number (1-52)">
              </div>
              <div class="mb-4">
                <label for="uap" class="block text-sm font-semibold text-gray-700">UAP</label>
                <select id="uap" class="mt-2 p-3 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent">
                  <option value="">Select a UAP</option>
                  ${uaps.map((uap) => `<option value="${uap}">${uap}</option>`).join("")}
                </select>
              </div>
              <div class="mb-4">
                <label for="resultat" class="block text-sm font-semibold text-gray-700">Resultat (%)</label>
                <input type="number" id="resultat" min="0" max="100" step="0.1" class="mt-2 p-3 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent" placeholder="Enter resultat (0-100)">
              </div>
              <div class="mb-4">
                <label for="commentaire" class="block text-sm font-semibold text-gray-700">Commentaire</label>
                <input type="text" id="commentaire" class="mt-2 p-3 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent" placeholder="Enter comment (optional)">
              </div>
              <button id="submit-tau" class="w-full bg-red-600 text-white p-3 rounded-lg font-semibold hover:bg-red-700 transition-all duration-200">Submit</button>
              <p id="form-error" class="hidden text-red-600 mt-4 text-center font-medium" aria-live="polite"></p>
            </div>
          `;

          const submitBtn = document.getElementById("submit-tau");
          submitBtn.addEventListener("click", () => {
            const date = document.getElementById("date").value;
            const week = document.getElementById("week").value;
            const uap = document.getElementById("uap").value;
            const resultat = document.getElementById("resultat").value;
            const commentaire = document.getElementById("commentaire").value;
            const formError = document.getElementById("form-error");

            const missingFields = [];
            if (!date) missingFields.push("Date");
            if (!week) missingFields.push("Week");
            if (!uap) missingFields.push("UAP");
            if (!resultat) missingFields.push("Resultat");

            if (missingFields.length) {
              showError(formError, `Please fill: ${missingFields.join(", ")}`);
              return;
            }

            if (week < 1 || week > 52) {
              showError(formError, "Week must be between 1 and 52");
              return;
            }
            if (resultat < 0 || resultat > 100) {
              showError(formError, "Resultat must be between 0 and 100");
              return;
            }

            const dataRef = ref(database, `auditData/${section}`);
            push(dataRef, {
              date,
              week: parseInt(week),
              uap,
              resultat: parseFloat(resultat),
              commentaire
            }).then(() => {
              showSuccess(formError, "Data submitted successfully!");
              loadFirebaseData(() => renderSection(section));
            }).catch((error) => {
              console.error(`Error submitting ${section} data:`, error);
              showError(formError, "Failed to submit data");
            });
          });
        } else if (section === "Taux Absenteisme") {
          mainContent.innerHTML = `
            <h1 class="text-4xl font-extrabold text-gray-800">${section}</h1>
            <p class="mt-6 text-lg text-gray-600">Enter attendance data below.</p>
            <div class="mt-6 bg-white p-6 rounded-lg shadow-lg">
              <div class="mb-4">
                <label for="date" class="block text-sm font-semibold text-gray-700">Date</label>
                <input type="date" id="date" class="mt-2 p-3 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent">
              </div>
              <div class="mb-4">
                <label for="week" class="block text-sm font-semibold text-gray-700">Week</label>
                <input type="number" id="week" min="1" max="52" class="mt-2 p-3 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent" placeholder="Enter week number (1-52)">
              </div>
              <div class="mb-4">
                <label for="nom" class="block text-sm font-semibold text-gray-700">Nom</label>
                <select id="nom" class="mt-2 p-3 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent">
                  <option value="">Select an employee</option>
                  ${employees.map((nom) => `<option value="${nom}">${nom}</option>`).join("")}
                </select>
              </div>
              <div class="mb-4">
                <label for="statut" class="block text-sm font-semibold text-gray-700">Statut</label>
                <select id="statut" class="mt-2 p-3 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent">
                  <option value="">Select status</option>
                  <option value="Présent">Présent</option>
                  <option value="Absent">Absent</option>
                </select>
              </div>
              <div class="mb-4">
                <label for="commentaire" class="block text-sm font-semibold text-gray-700">Commentaire (Optional)</label>
                <input type="text" id="commentaire" class="mt-2 p-3 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent" placeholder="Enter comment (optional)">
              </div>
              <button id="submit-absenteisme" class="w-full bg-red-600 text-white p-3 rounded-lg font-semibold hover:bg-red-700 transition-all duration-200">Submit</button>
              <p id="form-error" class="hidden text-red-600 mt-4 text-center font-medium" aria-live="polite"></p>
            </div>
          `;

          const submitBtn = document.getElementById("submit-absenteisme");
          submitBtn.addEventListener("click", () => {
            const date = document.getElementById("date").value;
            const week = document.getElementById("week").value;
            const nom = document.getElementById("nom").value;
            const statut = document.getElementById("statut").value;
            const commentaire = document.getElementById("commentaire").value;
            const formError = document.getElementById("form-error");

            const missingFields = [];
            if (!date) missingFields.push("Date");
            if (!week) missingFields.push("Week");
            if (!nom) missingFields.push("Nom");
            if (!statut) missingFields.push("Statut");

            if (missingFields.length) {
              showError(formError, `Please fill: ${missingFields.join(", ")}`);
              return;
            }

            if (week < 1 || week > 52) {
              showError(formError, "Week must be between 1 and 52");
              return;
            }

            const percentage = statut === "Présent" ? 100 : 0;
            const dataRef = ref(database, `auditData/${section}`);
            push(dataRef, {
              date,
              week: parseInt(week),
              nom,
              statut,
              percentage,
              commentaire
            }).then(() => {
              showSuccess(formError, "Data submitted successfully!");
              loadFirebaseData(() => renderSection(section));
            }).catch((error) => {
              console.error(`Error submitting ${section} data:`, error);
              showError(formError, "Failed to submit data");
            });
          });
        } else if (section === "Taux Realisation 5S" || section === "Taux Realisation Gemba") {
          mainContent.innerHTML = `
            <h1 class="text-4xl font-extrabold text-gray-800">${section}</h1>
            <p class="mt-6 text-lg text-gray-600">Enter audit realisation data below.</p>
            <div class="mt-6 bg-white p-6 rounded-lg shadow-lg">
              <div class="mb-4">
                <label for="date" class="block text-sm font-semibold text-gray-700">Date</label>
                <input type="date" id="date" class="mt-2 p-3 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent">
              </div>
              <div class="mb-4">
                <label for="week" class="block text-sm font-semibold text-gray-700">Week</label>
                <input type="number" id="week" min="1" max="52" class="mt-2 p-3 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent" placeholder="Enter week number (1-52)">
              </div>
              <div class="mb-4">
                <label for="audits-realises" class="block text-sm font-semibold text-gray-700">Nombre Audit Réalisé</label>
                <input type="number" id="audits-realises" min="0" class="mt-2 p-3 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent" placeholder="Enter number of audits realised">
              </div>
              <div class="mb-4">
                <label for="audits-planifies" class="block text-sm font-semibold text-gray-700">Nombre Audit Planifié</label>
                <input type="number" id="audits-planifies" min="0" class="mt-2 p-3 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent" placeholder="Enter number of audits planned">
              </div>
              <button id="submit-realisation" class="w-full bg-red-600 text-white p-3 rounded-lg font-semibold hover:bg-red-700 transition-all duration-200">Submit</button>
              <p id="form-error" class="hidden text-red-600 mt-4 text-center font-medium" aria-live="polite"></p>
            </div>
          `;

          const submitBtn = document.getElementById("submit-realisation");
          submitBtn.addEventListener("click", () => {
            const date = document.getElementById("date").value;
            const week = document.getElementById("week").value;
            const auditsRealises = document.getElementById("audits-realises").value;
            const auditsPlanifies = document.getElementById("audits-planifies").value;
            const formError = document.getElementById("form-error");

            const missingFields = [];
            if (!date) missingFields.push("Date");
            if (!week) missingFields.push("Week");
            if (!auditsRealises) missingFields.push("Audits Réalisés");
            if (!auditsPlanifies) missingFields.push("Audits Planifiés");

            if (missingFields.length) {
              showError(formError, `Please fill: ${missingFields.join(", ")}`);
              return;
            }

            if (week < 1 || week > 52) {
              showError(formError, "Week must be between 1 and 52");
              return;
            }
            if (auditsRealises < 0 || auditsPlanifies < 0) {
              showError(formError, "Audits must be non-negative");
              return;
            }

            const dataRef = ref(database, `auditData/${section}`);
            push(dataRef, {
              date,
              week: parseInt(week),
              auditsRealises: parseInt(auditsRealises),
              auditsPlanifies: parseInt(auditsPlanifies)
            }).then(() => {
              showSuccess(formError, "Data submitted successfully!");
              loadFirebaseData(() => renderSection(section));
            }).catch((error) => {
              console.error(`Error submitting ${section} data:`, error);
              showError(formError, "Failed to submit data");
            });
          });
        } else if (section === "Top Action 5S" || section === "Top Action Gemba") {
          mainContent.innerHTML = `
            <h1 class="text-4xl font-extrabold text-gray-800">${section}</h1>
            <p class="mt-6 text-lg text-gray-600">Enter action data below (up to 5 actions).</p>
            <div class="mt-6 bg-white p-6 rounded-lg shadow-lg">
              <div class="mb-4">
                <label for="date" class="block text-sm font-semibold text-gray-700">Date</label>
                <input type="date" id="date" class="mt-2 p-3 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent">
              </div>
              <div class="mb-4">
                <label for="week" class="block text-sm font-semibold text-gray-700">Week</label>
                <input type="number" id="week" min="1" max="52" class="mt-2 p-3 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent" placeholder="Enter week number (1-52)">
              </div>
              <div class="mb-4">
                <label for="ligne" class="block text-sm font-semibold text-gray-700">Ligne</label>
                <select id="ligne" class="mt-2 p-3 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent">
                  <option value="">Select a ligne</option>
                  ${lignes.map((ligne) => `<option value="${ligne}">${ligne}</option>`).join("")}
                </select>
              </div>
              <div class="mb-4">
                <label for="action" class="block text-sm font-semibold text-gray-700">Action (Optional)</label>
                <input type="text" id="action" class="mt-2 p-3 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent" placeholder="Enter action (optional)">
              </div>
              <button id="submit-action" class="w-full bg-red-600 text-white p-3 rounded-lg font-semibold hover:bg-red-700 transition-all duration-200">Submit</button>
              <p id="form-error" class="hidden text-red-600 mt-4 text-center font-medium" aria-live="polite"></p>
            </div>
          `;

          const submitBtn = document.getElementById("submit-action");
          submitBtn.addEventListener("click", () => {
            const date = document.getElementById("date").value;
            const week = document.getElementById("week").value;
            const ligne = document.getElementById("ligne").value;
            const action = document.getElementById("action").value;
            const formError = document.getElementById("form-error");

            const missingFields = [];
            if (!date) missingFields.push("Date");
            if (!week) missingFields.push("Week");
            if (!ligne) missingFields.push("Ligne");

            if (missingFields.length) {
              showError(formError, `Please fill: ${missingFields.join(", ")}`);
              return;
            }

            if (week < 1 || week > 52) {
              showError(formError, "Week must be between 1 and 52");
              return;
            }

            const existingActions = auditData[section].filter(
              (entry) => entry.week === parseInt(week) && entry.ligne === ligne && entry.action
            );
            if (existingActions.length >= 5 && action) {
              showError(formError, "Maximum 5 actions per ligne and week reached");
              return;
            }

            const dataRef = ref(database, `auditData/${section}`);
            push(dataRef, {
              date,
              week: parseInt(week),
              ligne,
              action: action || ""
            }).then(() => {
              showSuccess(formError, "Data submitted successfully!");
              loadFirebaseData(() => renderSection(section));
            }).catch((error) => {
              console.error(`Error submitting ${section} data:`, error);
              showError(formError, "Failed to submit data");
            });
          });
        } else if (section === "Dashboard") {
          mainContent.innerHTML = `
            <h2 class="text-2xl font-bold text-gray-800 mb-4">Filter Data</h2>
            <div class="mt-6 bg-white p-6 rounded-lg shadow-lg">
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
                <div>
                  <label for="filter-start-date" class="block text-sm font-semibold text-gray-700">Start Date</label>
                  <input type="date" id="filter-start-date" class="mt-2 p-3 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent">
                </div>
                <div>
                  <label for="filter-end-date" class="block text-sm font-semibold text-gray-700">End Date</label>
                  <input type="date" id="filter-end-date" class="mt-2 p-3 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent">
                </div>
                <div>
                  <label for="filter-week" class="block text-sm font-semibold text-gray-700">Week</label>
                  <input type="number" id="filter-week" min="1" max="52" class="mt-2 p-3 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent" placeholder="Enter week (1-52)">
                </div>
                <div>
                  <label for="filter-uap" class="block text-sm font-semibold text-gray-700">UAP/Nom</label>
                  <select id="filter-uap" class="mt-2 p-3 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent">
                    <option value="">All UAPs/Employees</option>
                    ${uaps.map((uap) => `<option value="${uap}">${uap}</option>`).join("")}
                    ${employees.map((nom) => `<option value="${nom}">${nom}</option>`).join("")}
                  </select>
                </div>
                <div>
                  <label for="filter-ligne" class="block text-sm font-semibold text-gray-700">Ligne</label>
                  <select id="filter-ligne" class="mt-2 p-3 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent">
                    <option value="">All Lignes</option>
                    ${lignes.map((ligne) => `<option value="${ligne}">${ligne}</option>`).join("")}
                  </select>
                </div>
              </div>
              <button id="apply-filter" class="w-full md:w-auto bg-red-600 text-white p-3 rounded-lg font-semibold hover:bg-red-700 transition-all duration-200">Apply Filter</button>
              <p id="filter-error" class="hidden text-red-600 mt-4 text-center font-medium" aria-live="polite"></p>
            </div>
            <div class="mt-8">
              <h2 class="text-2xl font-bold text-gray-800 mb-4">Audit 5S</h2>
              <canvas id="audit-5s-chart" class="mt-4"></canvas>
            </div>
            <div class="mt-8">
              <h2 class="text-2xl font-bold text-gray-800 mb-4">Audit Gemba</h2>
              <canvas id="audit-gemba-chart" class="mt-4"></canvas>
            </div>
            <div class="mt-8">
              <h2 class="text-2xl font-bold text-gray-800 mb-4">TAU Emplissage</h2>
              <canvas id="tau-emplissage-chart" class="mt-4"></canvas>
            </div>
            <div class="mt-8">
              <h2 class="text-2xl font-bold text-gray-800 mb-4">Taux Absenteisme</h2>
              <canvas id="taux-absenteisme-chart" class="mt-4"></canvas>
            </div>
            <div class="mt-8">
              <h2 class="text-2xl font-bold text-gray-800 mb-4">Taux Realisation 5S</h2>
              <canvas id="taux-realisation-5s-chart" class="mt-4"></canvas>
            </div>
            <div class="mt-8">
              <h2 class="text-2xl font-bold text-gray-800 mb-4">Taux Realisation Gemba</h2>
              <canvas id="taux-realisation-gemba-chart" class="mt-4"></canvas>
            </div>
            <div class="mt-8">
              <h2 class="text-2xl font-bold text-gray-800 mb-4">Top Action 5S</h2>
              <div class="bg-white p-6 rounded-lg shadow-lg overflow-x-auto">
                <table class="w-full text-left border-collapse">
                  <thead>
                    <tr class="bg-gray-200">
                      <th class="p-3 text-sm font-semibold text-gray-700">Week</th>
                      <th class="p-3 text-sm font-semibold text-gray-700">Ligne</th>
                      <th class="p-3 text-sm font-semibold text-gray-700">Action</th>
                    </tr>
                  </thead>
                  <tbody id="top-action-5s-table"></tbody>
                </table>
              </div>
            </div>
            <div class="mt-8">
              <h2 class="text-2xl font-bold text-gray-800 mb-4">Top Action Gemba</h2>
              <div class="bg-white p-6 rounded-lg shadow-lg overflow-x-auto">
                <table class="w-full text-left border-collapse">
                  <thead>
                    <tr class="bg-gray-200">
                      <th class="p-3 text-sm font-semibold text-gray-700">Week</th>
                      <th class="p-3 text-sm font-semibold text-gray-700">Ligne</th>
                      <th class="p-3 text-sm font-semibold text-gray-700">Action</th>
                    </tr>
                  </thead>
                  <tbody id="top-action-gemba-table"></tbody>
                </table>
              </div>
            </div>
          `;

          function renderChartsAndTables() {
            console.log("Rendering charts and tables for Dashboard");
            const startDate = document.getElementById("filter-start-date").value;
            const endDate = document.getElementById("filter-end-date").value;
            const week = document.getElementById("filter-week").value;
            const uap = document.getElementById("filter-uap").value;
            const ligne = document.getElementById("filter-ligne").value;
            const filterError = document.getElementById("filter-error");

            if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
              showError(filterError, "Start date must be before end date");
              return;
            }
            if (week && (week < 1 || week > 52)) {
              showError(filterError, "Week must be between 1 and 52");
              return;
            }

            const filterData = (sectionData, section) => {
              return sectionData.filter((entry) => {
                let pass = true;
                if (startDate) pass = pass && new Date(entry.date) >= new Date(startDate);
                if (endDate) pass = pass && new Date(entry.date) <= new Date(endDate);
                if (week) pass = pass && entry.week === parseInt(week);
                if (uap) {
                  if (section === "Audit 5S" || section === "Audit Gemba" || section === "TAU Emplissage") {
                    pass = pass && entry.uap === uap;
                  } else if (section === "Taux Absenteisme") {
                    pass = pass && entry.nom === uap;
                  }
                }
                if (ligne && (section === "Audit 5S" || section === "Audit Gemba" || section === "Top Action 5S" || section === "Top Action Gemba")) {
                  pass = pass && entry.ligne === ligne;
                }
                return pass;
              });
            };

            function renderAuditChart(section, canvasId) {
              const filteredData = filterData(auditData[section], section);
              const weeks = [...new Set(filteredData.map((d) => d.week))].sort((a, b) => a - b);
              const datasets = lignes.map((ligne, index) => {
                const data = weeks.map((week) => {
                  const entries = filteredData
                    .filter((d) => d.ligne === ligne && d.week === week)
                    .sort((a, b) => new Date(b.date) - new Date(a.date));
                  return entries.length ? entries[0].score : 0;
                });
                return {
                  label: ligne,
                  data,
                  backgroundColor: colors[index % colors.length] + "80",
                  borderColor: colors[index % colors.length],
                  borderWidth: 1,
                };
              }).filter((ds) => ds.data.some((d) => d > 0));

              const chartData = {
                labels: weeks.map((w) => `Week ${w}`),
                datasets,
              };

              try {
                const ctx = document.getElementById(canvasId).getContext("2d");
                new Chart(ctx, {
                  type: "bar",
                  data: chartData,
                  options: {
                    responsive: true,
                    scales: {
                      y: {
                        beginAtZero: true,
                        max: 100,
                        title: { display: true, text: "Score (%)" },
                      },
                      x: { title: { display: true, text: "Week" } },
                    },
                    plugins: {
                      legend: { display: datasets.length <= 10 }
                    }
                  },
                });
                console.log(`Rendered chart for ${section}`);
              } catch (error) {
                console.error(`Error rendering chart for ${section}:`, error);
              }
            }

            function renderTauChart() {
              const filteredData = filterData(auditData["TAU Emplissage"], "TAU Emplissage");
              const weeks = [...new Set(filteredData.map((d) => d.week))].sort((a, b) => a - b);
              const datasets = uaps.map((uap, index) => {
                const data = weeks.map((week) => {
                  const entries = filteredData.filter((d) => d.uap === uap && d.week === week);
                  const avg = entries.length
                    ? entries.reduce((sum, d) => sum + d.resultat, 0) / entries.length
                    : 0;
                  return avg;
                });
                return {
                  label: uap,
                  data,
                  backgroundColor: colors[index % colors.length] + "80",
                  borderColor: colors[index % colors.length],
                  borderWidth: 1,
                };
              }).filter((ds) => ds.data.some((d) => d > 0));

              const chartData = {
                labels: weeks.map((w) => `Week ${w}`),
                datasets,
              };

              try {
                const ctx = document.getElementById("tau-emplissage-chart").getContext("2d");
                new Chart(ctx, {
                  type: "bar",
                  data: chartData,
                  options: {
                    responsive: true,
                    scales: {
                      y: {
                        beginAtZero: true,
                        max: 100,
                        title: { display: true, text: "Average Resultat (%)" },
                      },
                      x: { title: { display: true, text: "Week" } },
                    },
                    plugins: {
                      legend: { display: true }
                    }
                  },
                });
                console.log("Rendered TAU Emplissage chart");
              } catch (error) {
                console.error("Error rendering TAU Emplissage chart:", error);
              }
            }

            function renderAbsenteismeChart() {
              const filteredData = filterData(auditData["Taux Absenteisme"], "Taux Absenteisme");
              const weeks = [...new Set(filteredData.map((d) => d.week))].sort((a, b) => a - b);
              const datasets = employees.map((nom, index) => {
                const data = weeks.map((week) => {
                  const entries = filteredData.filter((d) => d.nom === nom && d.week === week);
                  const avg = entries.length
                    ? entries.reduce((sum, d) => sum + d.percentage, 0) / entries.length
                    : 0;
                  return avg;
                });
                return {
                  label: nom,
                  data,
                  backgroundColor: colors[index % colors.length] + "80",
                  borderColor: colors[index % colors.length],
                  borderWidth: 1,
                };
              }).filter((ds) => ds.data.some((d) => d > 0));

              const chartData = {
                labels: weeks.map((w) => `Week ${w}`),
                datasets,
              };

              try {
                const ctx = document.getElementById("taux-absenteisme-chart").getContext("2d");
                new Chart(ctx, {
                  type: "bar",
                  data: chartData,
                  options: {
                    responsive: true,
                    scales: {
                      y: {
                        beginAtZero: true,
                        max: 100,
                        title: { display: true, text: "Average Attendance (%)" },
                      },
                      x: { title: { display: true, text: "Week" } },
                    },
                    plugins: {
                      legend: { display: datasets.length <= 10 }
                    }
                  },
                });
                console.log("Rendered Taux Absenteisme chart");
              } catch (error) {
                console.error("Error rendering Taux Absenteisme chart:", error);
              }
            }

            function renderRealisationChart(section, canvasId) {
              const filteredData = filterData(auditData[section], section);
              const weeks = [...new Set(filteredData.map((d) => d.week))].sort((a, b) => a - b);
              const datasets = [
                {
                  label: "Audits Réalisés",
                  data: weeks.map((week) => {
                    const entries = filteredData.filter((d) => d.week === week);
                    return entries.length
                      ? entries.reduce((sum, d) => sum + d.auditsRealises, 0)
                      : 0;
                  }),
                  backgroundColor: colors[0] + "80",
                  borderColor: colors[0],
                  borderWidth: 1,
                },
                {
                  label: "Audits Planifiés (Remaining)",
                  data: weeks.map((week) => {
                    const entries = filteredData.filter((d) => d.week === week);
                    const realises = entries.length
                      ? entries.reduce((sum, d) => sum + d.auditsRealises, 0)
                      : 0;
                    const planifies = entries.length
                      ? entries.reduce((sum, d) => sum + d.auditsPlanifies, 0)
                      : 0;
                    return planifies - realises;
                  }),
                  backgroundColor: colors[1] + "80",
                  borderColor: colors[1],
                  borderWidth: 1,
                },
              ].filter((ds) => ds.data.some((d) => d > 0));

              const chartData = {
                labels: weeks.map((w) => `Week ${w}`),
                datasets,
              };

              try {
                const ctx = document.getElementById(canvasId).getContext("2d");
                new Chart(ctx, {
                  type: "bar",
                  data: chartData,
                  options: {
                    responsive: true,
                    scales: {
                      y: {
                        stacked: true,
                        beginAtZero: true,
                        title: { display: true, text: "Number of Audits" },
                      },
                      x: {
                        stacked: true,
                        title: { display: true, text: "Week" },
                      },
                    },
                    plugins: {
                      legend: { display: true }
                    }
                  },
                });
                console.log(`Rendered realisation chart for ${section}`);
              } catch (error) {
                console.error(`Error rendering realisation chart for ${section}:`, error);
              }
            }

            function renderActionTable(section, tableId) {
              const filteredData = filterData(auditData[section], section);
              const tableBody = document.getElementById(tableId);
              tableBody.innerHTML = filteredData
                .filter((entry) => entry.action)
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .map(
                  (entry, index) => `
                    <tr class="${index % 2 === 0 ? "bg-gray-50" : "bg-white"}">
                      <td class="p-3 text-sm text-gray-600">${entry.week}</td>
                      <td class="p-3 text-sm text-gray-600">${entry.ligne}</td>
                      <td class="p-3 text-sm text-gray-600">${entry.action}</td>
                    </tr>
                  `
                )
                .join("");
              console.log(`Rendered table for ${section}`);
            }

            const canvases = [
              "audit-5s-chart",
              "audit-gemba-chart",
              "tau-emplissage-chart",
              "taux-absenteisme-chart",
              "taux-realisation-5s-chart",
              "taux-realisation-gemba-chart"
            ];
            canvases.forEach((id) => {
              const canvas = document.getElementById(id);
              const ctx = canvas.getContext("2d");
              ctx.clearRect(0, 0, canvas.width, canvas.height);
            });

            try {
              renderAuditChart("Audit 5S", "audit-5s-chart");
              renderAuditChart("Audit Gemba", "audit-gemba-chart");
              renderTauChart();
              renderAbsenteismeChart();
              renderRealisationChart("Taux Realisation 5S", "taux-realisation-5s-chart");
              renderRealisationChart("Taux Realisation Gemba", "taux-realisation-gemba-chart");
              renderActionTable("Top Action 5S", "top-action-5s-table");
              renderActionTable("Top Action Gemba", "top-action-gemba-table");
              filterError.classList.add("hidden");
            } catch (error) {
              console.error("Error rendering Dashboard charts/tables:", error);
              showError(filterError, "Failed to render dashboard data");
            }
          }

          loadFirebaseData(renderChartsAndTables);
          document.getElementById("apply-filter").addEventListener("click", () => {
            console.log("Apply filter clicked");
            loadFirebaseData(renderChartsAndTables);
          });
        } else if (section === "Archive") {
          mainContent.innerHTML = `
            <h2 class="text-2xl font-bold text-gray-800 mb-4">Archive Data</h2>
            <div class="mt-6 bg-white p-6 rounded-lg shadow-lg">
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
                <div>
                  <label for="filter-section" class="block text-sm font-semibold text-gray-700">Section</label>
                  <select id="filter-section" class="mt-2 p-3 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent">
                    <option value="">All Sections</option>
                    <option value="Audit 5S">Audit 5S</option>
                    <option value="Audit Gemba">Audit Gemba</option>
                    <option value="TAU Emplissage">TAU Emplissage</option>
                    <option value="Taux Absenteisme">Taux Absenteisme</option>
                    <option value="Taux Realisation 5S">Taux Realisation 5S</option>
                    <option value="Taux Realisation Gemba">Taux Realisation Gemba</option>
                    <option value="Top Action 5S">Top Action 5S</option>
                    <option value="Top Action Gemba">Top Action Gemba</option>
                  </select>
                </div>
                <div>
                  <label for="filter-start-date" class="block text-sm font-semibold text-gray-700">Start Date</label>
                  <input type="date" id="filter-start-date" class="mt-2 p-3 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent">
                </div>
                <div>
                  <label for="filter-end-date" class="block text-sm font-semibold text-gray-700">End Date</label>
                  <input type="date" id="filter-end-date" class="mt-2 p-3 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent">
                </div>
                <div>
                  <label for="filter-week" class="block text-sm font-semibold text-gray-700">Week</label>
                  <input type="number" id="filter-week" min="1" max="52" class="mt-2 p-3 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent" placeholder="Enter week (1-52)">
                </div>
                <div>
                  <label for="filter-uap" class="block text-sm font-semibold text-gray-700">UAP/Nom</label>
                  <select id="filter-uap" class="mt-2 p-3 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent">
                    <option value="">All UAPs/Employees</option>
                    ${uaps.map((uap) => `<option value="${uap}">${uap}</option>`).join("")}
                    ${employees.map((nom) => `<option value="${nom}">${nom}</option>`).join("")}
                  </select>
                </div>
                <div>
                  <label for="filter-ligne" class="block text-sm font-semibold text-gray-700">Ligne</label>
                  <select id="filter-ligne" class="mt-2 p-3 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent">
                    <option value="">All Lignes</option>
                    ${lignes.map((ligne) => `<option value="${ligne}">${ligne}</option>`).join("")}
                  </select>
                </div>
              </div>
              <button id="apply-archive-filter" class="w-full md:w-auto bg-red-600 text-white p-3 rounded-lg font-semibold hover:bg-red-700 transition-all duration-200">Apply Filter</button>
              <button id="export-excel" class="w-full md:w-auto bg-green-600 text-white p-3 rounded-lg font-semibold hover:bg-green-700 transition-all duration-200 mt-4 md:mt-0 md:ml-4">Export to Excel</button>
              <p id="filter-error" class="hidden text-red-600 mt-4 text-center font-medium" aria-live="polite"></p>
            </div>
            <div class="mt-8">
              <h2 class="text-2xl font-bold text-gray-800 mb-4">Filtered Archive Data</h2>
              <div class="bg-white p-6 rounded-lg shadow-lg overflow-x-auto">
                <table class="w-full text-left border-collapse">
                  <thead>
                    <tr class="bg-gray-200">
                      <th class="p-3 text-sm font-semibold text-gray-700">Section</th>
                      <th class="p-3 text-sm font-semibold text-gray-700">Date</th>
                      <th class="p-3 text-sm font-semibold text-gray-700">Week</th>
                      <th class="p-3 text-sm font-semibold text-gray-700">UAP/Nom</th>
                      <th class="p-3 text-sm font-semibold text-gray-700">Ligne</th>
                      <th class="p-3 text-sm font-semibold text-gray-700">Details</th>
                    </tr>
                  </thead>
                  <tbody id="archive-table"></tbody>
                </table>
              </div>
            </div>
          `;

          function renderArchiveTable() {
            console.log("Rendering Archive table");
            const sectionFilter = document.getElementById("filter-section").value;
            const startDate = document.getElementById("filter-start-date").value;
            const endDate = document.getElementById("filter-end-date").value;
            const week = document.getElementById("filter-week").value;
            const uap = document.getElementById("filter-uap").value;
            const ligne = document.getElementById("filter-ligne").value;
            const filterError = document.getElementById("filter-error");

            if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
              showError(filterError, "Start date must be before end date");
              return;
            }
            if (week && (week < 1 || week > 52)) {
              showError(filterError, "Week must be between 1 and 52");
              return;
            }

            let allData = [];
            Object.keys(auditData).forEach((section) => {
              const filteredData = auditData[section].filter((entry) => {
                let pass = true;
                if (sectionFilter && sectionFilter !== section) pass = false;
                if (startDate) pass = pass && new Date(entry.date) >= new Date(startDate);
                if (endDate) pass = pass && new Date(entry.date) <= new Date(endDate);
                if (week) pass = pass && entry.week === parseInt(week);
                if (uap) {
                  if (section === "Audit 5S" || section === "Audit Gemba" || section === "TAU Emplissage") {
                    pass = pass && entry.uap === uap;
                  } else if (section === "Taux Absenteisme") {
                    pass = pass && entry.nom === uap;
                  }
                }
                if (ligne && (section === "Audit 5S" || section === "Audit Gemba" || section === "Top Action 5S" || section === "Top Action Gemba")) {
                  pass = pass && entry.ligne === ligne;
                }
                return pass;
              });
              filteredData.forEach((entry) => {
                let details = "";
                if (section === "Audit 5S" || section === "Audit Gemba") {
                  details = `Score: ${entry.score}%`;
                } else if (section === "TAU Emplissage") {
                  details = `Resultat: ${entry.resultat}%, Commentaire: ${entry.commentaire || "None"}`;
                } else if (section === "Taux Absenteisme") {
                  details = `Statut: ${entry.statut}, Commentaire: ${entry.commentaire || "None"}`;
                } else if (section === "Taux Realisation 5S" || section === "Taux Realisation Gemba") {
                  details = `Audits Réalisés: ${entry.auditsRealises}, Audits Planifiés: ${entry.auditsPlanifies}`;
                } else if (section === "Top Action 5S" || section === "Top Action Gemba") {
                  details = `Action: ${entry.action || "None"}`;
                }
                allData.push({
                  section,
                  date: entry.date,
                  week: entry.week,
                  uap: entry.uap || entry.nom || "N/A",
                  ligne: entry.ligne || "N/A",
                  details
                });
              });
            });

            const tableBody = document.getElementById("archive-table");
            tableBody.innerHTML = allData
              .sort((a, b) => new Date(b.date) - new Date(a.date))
              .map(
                (entry, index) => `
                  <tr class="${index % 2 === 0 ? "bg-gray-50" : "bg-white"}">
                    <td class="p-3 text-sm text-gray-600">${entry.section}</td>
                    <td class="p-3 text-sm text-gray-600">${entry.date}</td>
                    <td class="p-3 text-sm text-gray-600">${entry.week}</td>
                    <td class="p-3 text-sm text-gray-600">${entry.uap}</td>
                    <td class="p-3 text-sm text-gray-600">${entry.ligne}</td>
                    <td class="p-3 text-sm text-gray-600">${entry.details}</td>
                  </tr>
                `
              )
              .join("");

            document.getElementById("export-excel").onclick = () => {
              try {
                const worksheet = XLSX.utils.json_to_sheet(allData);
                const workbook = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(workbook, worksheet, "Archive Data");
                XLSX.write_file(workbook, "archive_data.xlsx");
                console.log("Exported archive data to Excel");
              } catch (error) {
                console.error("Error exporting to Excel:", error);
                showError(filterError, "Failed to export data");
              }
            };

            filterError.classList.add("hidden");
            console.log("Archive table rendered");
          }

          loadFirebaseData(renderArchiveTable);
          document.getElementById("apply-archive-filter").addEventListener("click", () => {
            console.log("Apply archive filter clicked");
            loadFirebaseData(renderArchiveTable);
          });
        }

        mainContent.style.opacity = "1";
        mainContent.style.transition = "opacity 0.5s ease";
        console.log(`Finished rendering section: ${section}`);
      } catch (error) {
        console.error(`Error in renderSection for ${section}:`, error);
        mainContent.innerHTML = `<p class="text-red-600">Error loading section. Please try again.</p>`;
        mainContent.style.opacity = "1";
      }
    }, 300);
  }
});
