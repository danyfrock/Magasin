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

    const responseUtilisateur = await fetch("/api/auth/me");

    if (responseUtilisateur.ok) {
        const utilisateur = await responseUtilisateur.json();

        document.getElementById("connectedUser").textContent =
            utilisateur.username;
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

document.addEventListener("DOMContentLoaded", chargerBandeau);