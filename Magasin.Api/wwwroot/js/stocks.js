// --- État global du stock ---
let stockTable = null;

document.addEventListener("DOMContentLoaded", () => {
    initialiserGrille();
    initialiserFormulaire();
    chargerStocks();
});

// --- Grille (Tabulator) ---
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
                formatter: (cell) => {
                    const base64 = cell.getValue();
                    if (!base64) return "";
                    return `<img src="data:image/png;base64,${base64}" alt="Code-barres" style="height: 50px; max-width: 180px;">`;
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

    document.getElementById("btn-imprimer").addEventListener("click", () => window.print());
}

// --- Formulaire & Événements ---
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

// --- Chargement des données ---
async function chargerStocks() {
    try {
        const stocks = await apiCall("/api/stocks");
        stockTable.setData(stocks);
    } catch (error) {
        afficherErreur("Impossible de charger les stocks.");
    }
}

// --- Vérification interactive du formulaire ---
async function verifierFormulaire() {
    const codeBarre = document.getElementById("code-barre").value.trim();
    const quantite = document.getElementById("quantite").value;
    const boutonValider = document.getElementById("btn-valider");

    boutonValider.disabled = true;

    if (codeBarre === "" || quantite === "" || !Number.isInteger(Number(quantite))) {
        return;
    }

    try {
        await apiCall(`/api/stocks/codebarre/${encodeURIComponent(codeBarre)}`);
        boutonValider.disabled = false;
    } catch (error) {
        boutonValider.disabled = true;
    }
}

// --- Mise à jour du stock ---
async function mettreAJourStock(event) {
    event.preventDefault();

    const codeBarre = document.getElementById("code-barre").value.trim();
    const quantite = Number(document.getElementById("quantite").value);
    const boutonValider = document.getElementById("btn-valider");

    if (codeBarre === "" || !Number.isInteger(quantite)) return;

    boutonValider.disabled = true;

    try {
        await apiCall("/api/stocks", {
            method: "PUT",
            body: JSON.stringify({ codeBarre, quantite })
        });

        afficherSucces();
        nettoyerFormulaire();
        await chargerStocks();
    } catch (error) {
        if (error.response && error.response.status === 404) {
            afficherErreur("Aucun stock trouvé pour ce code-barres.");
        } else {
            afficherErreur("Impossible de mettre à jour le stock.");
        }
        boutonValider.disabled = false;
    }
}

// --- Utilitaires visuels et de réinitialisation ---
function nettoyerFormulaire() {
    document.getElementById("stock-form").reset();
    document.getElementById("btn-valider").disabled = true;
}

function afficherSucces() {
    const message = document.getElementById("message-succes");
    message.textContent = "✓ Stock mis à jour";
    message.classList.add("visible");

    setTimeout(() => {
        message.classList.remove("visible");
    }, 2500);
}

function afficherErreur(messageTexte) {
    alert(messageTexte);
}