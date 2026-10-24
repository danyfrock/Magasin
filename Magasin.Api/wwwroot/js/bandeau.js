// Appliquer le thème le plus tôt possible (évite le flash)
(function () {
    const theme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', theme);
})();

function setTitle(titre) {
    document.title = `${titre} - Magasin`;

    const pageTitle = document.getElementById("pageTitle");
    if (pageTitle) {
        pageTitle.textContent = titre;
    }
}

function changerTheme(nomTheme) {
    document.documentElement.setAttribute('data-theme', nomTheme);
    localStorage.setItem('theme', nomTheme);
}

async function chargerBandeau() {
    const conteneur = document.getElementById("bandeau");
    if (!conteneur) return;

    const response = await fetch("/components/bandeau.html");
    if (!response.ok) {
        throw new Error("Impossible de charger le bandeau.");
    }

    conteneur.innerHTML = await response.text();

    const titre = conteneur.dataset.title || "Magasin";
    setTitle(titre);

    // Synchroniser uniquement le sélecteur (le thème est déjà appliqué)
    const themeSauvegarde = localStorage.getItem('theme') || 'light';
    const selectTheme = document.getElementById("themeSelector");
    if (selectTheme) {
        selectTheme.value = themeSauvegarde;
    }

    gererLienRetour(conteneur);

    try {
        const responseUtilisateur = await fetch("/api/auth/me");
        if (responseUtilisateur.ok) {
            const utilisateur = await responseUtilisateur.json();

            const connectedUserEl = document.getElementById("connectedUser");
            if (connectedUserEl) {
                connectedUserEl.textContent = `${utilisateur.username} (${utilisateur.role})`;
            }
            sessionStorage.setItem("userRole", utilisateur.role);
        }
    } catch (error) {
        console.error("Erreur lors du chargement de l'utilisateur connecté :", error);
    }
}

async function logout() {
    const response = await fetch("/api/auth/logout", {
        method: "POST"
    });
    if (response.ok) {
        window.location.href = "/pages/login.html";
    }
}

function gererLienRetour(conteneur) {
    const backLink = conteneur.querySelector(".back-link");
    if (!backLink) return;

    const cheminActuel = window.location.pathname;
    if (cheminActuel.endsWith("index.html") || cheminActuel === "/") {
        backLink.style.display = "none";
    }
}

document.addEventListener("DOMContentLoaded", chargerBandeau);