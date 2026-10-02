const form = document.getElementById("produit-form");
const produitId = document.getElementById("produit-id");
const codeBarre = document.getElementById("code-barre");
const nom = document.getElementById("nom");
const prix = document.getElementById("prix");
const btnAnnuler = document.getElementById("btn-annuler");
const produitsBody = document.getElementById("produits-body");
const messageSucces = document.getElementById("message-succes");


// Message de succès

function afficherSucces() {
    messageSucces.classList.add("visible");
    setTimeout(function () {
        messageSucces.classList.remove("visible");
    }, 2000);
}

function masquerSucces() {
    messageSucces.classList.remove("visible");
}


// Formulaire

function viderFormulaire() {
    produitId.value = "";
    codeBarre.value = "";
    nom.value = "";
    prix.value = "";

    masquerSucces();
}

function chargerProduitDansFormulaire(produit) {
    produitId.value = produit.id;
    codeBarre.value = produit.codeBarre;
    nom.value = produit.nom;
    prix.value = produit.prix;
}


// Liste des produits

async function chargerProduits() {
    const response = await fetch("/api/produits");

    if (!response.ok) {
        alert("Impossible de charger les produits.");
        return;
    }

    const produits = await response.json();

    produitsBody.innerHTML = "";

    produits.forEach(produit => {
        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${produit.codeBarre}</td>
            <td>${produit.nom}</td>
            <td>${produit.prix}</td>
            <td>
                <button class="action-btn btn-modifier" data-id="${produit.id}">
                    Modifier
                </button>
                <button class="action-btn btn-supprimer" data-id="${produit.id}">
                    Supprimer
                </button>
            </td>
        `;

        produitsBody.appendChild(tr);
    });
}


// Enregistrement

form.addEventListener("submit", async function (event) {
    event.preventDefault();

    const id = produitId.value;
    let response;

    if (id === "") {
        response = await fetch("/api/produits", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                nom: nom.value,
                prix: Number(prix.value)
            })
        });
    } else {
        response = await fetch("/api/produits", {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                id: Number(id),
                codeBarre: codeBarre.value,
                nom: nom.value,
                prix: Number(prix.value)
            })
        });
    }

    if (!response.ok) {
        alert("Une erreur est survenue.");
        return;
    }

    const produit = await response.json();

    chargerProduitDansFormulaire(produit);
    await chargerProduits();

    afficherSucces();
});


// Annuler

btnAnnuler.addEventListener("click", function () {
    viderFormulaire();
});


// Modifier / Supprimer

produitsBody.addEventListener("click", async function (event) {
    const bouton = event.target;

    if (!bouton.dataset.id) {
        return;
    }

    const id = Number(bouton.dataset.id);

    // Modifier

    if (bouton.classList.contains("btn-modifier")) {
        const response = await fetch("/api/produits");

        if (!response.ok) {
            alert("Impossible de charger les produits.");
            return;
        }

        const produits = await response.json();
        const produit = produits.find(p => p.id === id);

        if (produit) {
            chargerProduitDansFormulaire(produit);
            masquerSucces();
        }
    }

    // Supprimer

    if (bouton.classList.contains("btn-supprimer")) {
        const response = await fetch(`/api/produits/${id}`, {
            method: "DELETE"
        });

        if (!response.ok) {
            alert("Impossible de supprimer le produit.");
            return;
        }

        viderFormulaire();
        await chargerProduits();
    }
});


// Masquer le succès si le formulaire est modifié

nom.addEventListener("input", masquerSucces);
prix.addEventListener("input", masquerSucces);


// Chargement initial

chargerProduits();