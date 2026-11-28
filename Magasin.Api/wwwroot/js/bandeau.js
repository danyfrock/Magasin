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

            const userId = utilisateur.id ?? utilisateur.utilisateurId ?? null;
            if (userId != null) {
                sessionStorage.setItem("userId", String(userId));
            }
        }
    } catch (error) {
        console.error("Erreur lors du chargement de l'utilisateur connecté :", error);
    }

    await chargerPotCommun();
}

async function chargerPotCommun() {
    const bouton = document.getElementById("pot-commun-toggle");
    if (!bouton) return;

    try {
        if (!document.querySelector('link[href="/css/pot-commun.css"]')) {
            const css = document.createElement("link");
            css.rel = "stylesheet";
            css.href = "/css/pot-commun.css";
            document.head.appendChild(css);
        }

        if (!document.getElementById("pot-commun-drawer")) {
            const response = await fetch("/components/pot-commun.html");
            if (!response.ok) {
                throw new Error("Impossible de charger le Pot commun.");
            }
            document.body.insertAdjacentHTML("beforeend", await response.text());
        }

        if (!window.PotCommun) {
            await new Promise((resolve, reject) => {
                const script = document.createElement("script");
                script.src = "/js/potCommun.js";
                script.onload = resolve;
                script.onerror = () => reject(new Error("Impossible de charger potCommun.js."));
                document.body.appendChild(script);
            });
        }

        window.potCommun = new window.PotCommun({
            getCurrentUserId: () => sessionStorage.getItem("userId"),
            onReprendre: (detail) => {
                document.dispatchEvent(new CustomEvent("pot-commun:reprendre", { detail }));
            }
        });
    } catch (error) {
        console.error("Erreur lors de l'initialisation du Pot commun :", error);
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