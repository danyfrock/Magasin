function setTitle(titre) {
    document.title = `${titre} - Magasin`;

    const pageTitle = document.getElementById("pageTitle");

    if (pageTitle) {
        pageTitle.textContent = titre;
    }
}

async function chargerBandeau() {
    const conteneur = document.getElementById("bandeau");

    if (!conteneur) {
        return;
    }

    const response = await fetch("/components/bandeau.html");

    if (!response.ok) {
        throw new Error("Impossible de charger le bandeau.");
    }

    conteneur.innerHTML = await response.text();

    const titre = conteneur.dataset.title || "Magasin";
    setTitle(titre);

    // Appel de notre fonction dédiée
    gererLienRetour(conteneur);
    
    try {
        const responseUtilisateur = await fetch("/api/auth/me");

        if (responseUtilisateur.ok) {
            const utilisateur = await responseUtilisateur.json();

            const connectedUserEl = document.getElementById("connectedUser");
            if (connectedUserEl) {
                // Affichage propre : Nom (Rôle)
                connectedUserEl.textContent = `${utilisateur.username} (${utilisateur.role})`;
            }

            // Optionnel : On stocke le rôle en global ou dans sessionStorage si d'autres scripts en ont besoin
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

    // Si on est déjà sur l'accueil, on masque le lien de retour
    if (cheminActuel.endsWith("index.html") || cheminActuel === "/") {
        backLink.style.display = "none";
    }
}

document.addEventListener("DOMContentLoaded", chargerBandeau);