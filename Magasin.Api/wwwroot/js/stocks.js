let stockTable = null;

document.addEventListener("DOMContentLoaded", function () {
    initialiserGrille();
    initialiserFormulaire();
    chargerStocks();
});

// Initialise la grille des stocks.
function initialiserGrille() {
    stockTable = new Tabulator("#stock-table", {
        layout: "fitColumns",
        pagination: true,
        paginationSize: 15,
        paginationSizeSelector: [10, 15, 25, 50],
        placeholder: "Aucun stock",

        columns: [
            {
                title: "Produit",
                field: "produitNom",
                headerFilter: "input",
                sorter: "string"
            },
            {
                title: "Code-barres",
                field: "codeBarre",
                headerFilter: "input",
                sorter: "string"
            },
            {
                title: "Code-barres scannable",
                field: "scannableCodebarre",
                formatter: function (cell) {
                    const base64 = cell.getValue();
            
                    if (!base64) {
                        return "";
                    }
            
                    // Affiche l'image du code-barres
                    return `<img src="data:image/png;base64,${base64}" 
                                 alt="Code-barres" 
                                 style="height: 50px; max-width: 180px;">`;
                },
                hozAlign: "center",
                headerSort: false,
                width: 200
            },
            {
                title: "Quantité",
                field: "quantite",
                headerFilter: "input",
                sorter: "number",
                hozAlign: "right"
            }
        ]
    });

    document
        .getElementById("btn-imprimer")
        .addEventListener("click", imprimerStocks);
}

// Initialise les événements du formulaire.
function initialiserFormulaire() {
    const codeBarre = document.getElementById("code-barre");
    const quantite = document.getElementById("quantite");
    const formulaire = document.getElementById("stock-form");
    const boutonAnnuler = document.getElementById("btn-annuler");

    codeBarre.addEventListener("input", verifierFormulaire);
    quantite.addEventListener("input", verifierFormulaire);

    formulaire.addEventListener("submit", mettreAJourStock);
    boutonAnnuler.addEventListener("click", nettoyerFormulaire);
}

// Charge tous les stocks depuis l'API.
async function chargerStocks() {
    try {
        const response = await fetch("/api/stocks");

        if (!response.ok) {
            afficherErreur("Impossible de charger les stocks.");
            return;
        }

        const stocks = await response.json();

        stockTable.setData(stocks);
    }
    catch (error) {
        afficherErreur("Impossible de contacter le serveur.");
    }
}

// Vérifie que le code-barres correspond à un stock existant.
async function verifierFormulaire() {
    const codeBarre = document.getElementById("code-barre").value.trim();
    const quantite = document.getElementById("quantite").value;
    const boutonValider = document.getElementById("btn-valider");

    boutonValider.disabled = true;

    if (codeBarre === "" || quantite === "") {
        return;
    }

    if (!Number.isInteger(Number(quantite))) {
        return;
    }

    try {
        const response = await fetch(
            "/api/stocks/codebarre/" + encodeURIComponent(codeBarre)
        );

        boutonValider.disabled = !response.ok;
    }
    catch (error) {
        boutonValider.disabled = true;
    }
}

// Met à jour la quantité du stock.
async function mettreAJourStock(event) {
    event.preventDefault();

    const codeBarre = document.getElementById("code-barre").value.trim();
    const quantite = Number(document.getElementById("quantite").value);

    if (codeBarre === "" || !Number.isInteger(quantite)) {
        return;
    }

    const boutonValider = document.getElementById("btn-valider");
    boutonValider.disabled = true;

    try {
        const response = await fetch("/api/stocks", {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                codeBarre: codeBarre,
                quantite: quantite
            })
        });

        if (response.status === 404) {
            afficherErreur("Aucun stock trouvé pour ce code-barres.");
            boutonValider.disabled = false;
            return;
        }

        if (!response.ok) {
            afficherErreur("Impossible de mettre à jour le stock.");
            boutonValider.disabled = false;
            return;
        }

        afficherSucces();
        nettoyerFormulaire();
        await chargerStocks();
    }
    catch (error) {
        afficherErreur("Impossible de contacter le serveur.");
        boutonValider.disabled = false;
    }
}

// Réinitialise le formulaire.
function nettoyerFormulaire() {
    document.getElementById("stock-form").reset();
    document.getElementById("btn-valider").disabled = true;
}

// Affiche le message de succès.
function afficherSucces() {
    const message = document.getElementById("message-succes");

    message.textContent = "✓ Stock mis à jour";
    message.classList.add("visible");

    setTimeout(function () {
        message.classList.remove("visible");
    }, 2500);
}

// Affiche un message d'erreur.
function afficherErreur(messageTexte) {
    alert(messageTexte);
}

// Imprime les stocks actuellement affichés.
function imprimerStocks() {
    window.print();
}