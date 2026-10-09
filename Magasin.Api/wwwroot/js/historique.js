// --- État global et grilles ---
let ventes = [];
let venteSelectionnee = null;

let grilleVentes = null;
let grilleLignes = null;
let grillePaiements = null;

// Initialisation au chargement de la page
document.addEventListener("DOMContentLoaded", () => {
    chargerVentes();
});

// --- Chargement initial ---
async function chargerVentes() {
    try {
        ventes = await apiCall("/api/ventes");

        creerGrilleVentes();
        initialiserFiltres();

        if (ventes.length > 0) {
            selectionnerVente(ventes[0].id);
        }
    } catch (error) {
        console.error("Erreur lors du chargement des ventes :", error);
    }
}

// --- Filtres ---
function initialiserFiltres() {
    const typePeriode = document.getElementById("type-periode");
    const valeurPeriode = document.getElementById("valeur-periode");
    const produit = document.getElementById("produit");
    const boutonReinitialiser = document.getElementById("btn-reinitialiser");
    const boutonImprimer = document.getElementById("btn-imprimer");

    typePeriode.addEventListener("change", () => {
        changerTypePeriode();
        appliquerFiltres();
    });

    valeurPeriode.addEventListener("change", appliquerFiltres);
    produit.addEventListener("input", appliquerFiltres);

    boutonImprimer.addEventListener("click", imprimerHistorique);
    boutonReinitialiser.addEventListener("click", reinitialiserFiltres);

    changerTypePeriode();
}

function changerTypePeriode() {
    const typePeriode = document.getElementById("type-periode");
    const valeurPeriode = document.getElementById("valeur-periode");
    const groupeValeur = document.querySelector(".filtre-periode-valeur");
    const label = groupeValeur.querySelector("label");

    const type = typePeriode.value;
    valeurPeriode.value = "";

    if (type === "jour") {
        valeurPeriode.type = "date";
        valeurPeriode.placeholder = "";
        label.textContent = "Date";
        groupeValeur.style.display = "block";
    } else if (type === "mois") {
        valeurPeriode.type = "month";
        valeurPeriode.placeholder = "";
        label.textContent = "Mois";
        groupeValeur.style.display = "block";
    } else if (type === "annee") {
        valeurPeriode.type = "number";
        valeurPeriode.placeholder = "Ex. 2026";
        valeurPeriode.min = "2000";
        valeurPeriode.max = "2100";
        label.textContent = "Année";
        groupeValeur.style.display = "block";
    } else {
        groupeValeur.style.display = "none";
    }
}

function appliquerFiltres() {
    const typePeriode = document.getElementById("type-periode").value;
    const valeurPeriode = document.getElementById("valeur-periode").value;
    const produit = document.getElementById("produit").value.trim();

    filtrerVentes(typePeriode, valeurPeriode, produit);
}

function filtrerVentes(typePeriode, valeurPeriode, produit) {
    const ventesFiltrees = ventes.filter(vente => {
        const dateVente = new Date(vente.date);
        let periodeCorrespond = true;

        if (typePeriode && valeurPeriode) {
            if (typePeriode === "jour") {
                const dateVenteFormatee = [
                    dateVente.getFullYear(),
                    String(dateVente.getMonth() + 1).padStart(2, "0"),
                    String(dateVente.getDate()).padStart(2, "0")
                ].join("-");
                periodeCorrespond = dateVenteFormatee === valeurPeriode;
            } else if (typePeriode === "mois") {
                const moisVente = [
                    dateVente.getFullYear(),
                    String(dateVente.getMonth() + 1).padStart(2, "0")
                ].join("-");
                periodeCorrespond = moisVente === valeurPeriode;
            } else if (typePeriode === "annee") {
                periodeCorrespond = String(dateVente.getFullYear()) === valeurPeriode;
            }
        }

        if (!periodeCorrespond) return false;
        if (!produit) return true;

        const termeRecherche = produit.toLowerCase();
        return (vente.lignes || []).some(ligne => 
            String(ligne.produitNom).toLowerCase().includes(termeRecherche)
        );
    });

    grilleVentes.setData(ventesFiltrees);

    if (ventesFiltrees.length > 0) {
        selectionnerVente(ventesFiltrees[0].id);
    } else {
        venteSelectionnee = null;
        document.getElementById("detail-vide").style.display = "block";
        document.getElementById("detail-contenu").style.display = "none";
    }
}

function reinitialiserFiltres() {
    document.getElementById("type-periode").value = "";
    document.getElementById("valeur-periode").value = "";
    // Correction de l'ID du champ produit (aligné sur l'input HTML)
    document.getElementById("produit").value = "";

    changerTypePeriode();
    filtrerVentes("", "", "");
}

// --- Grilles Tabulator ---
function creerGrilleVentes() {
    grilleVentes = new Tabulator("#liste-ventes", {
        data: ventes,
        index: "id",
        layout: "fitColumns",
        height: "400px",
        placeholder: "Aucune vente",
        columns: [
            {
                title: "Date",
                field: "date",
                formatter: cell => new Date(cell.getValue()).toLocaleString("fr-FR")
            },
            {
                title: "Total",
                field: "total",
                formatter: cell => `${cell.getValue()} F`
            },
            {
                title: "Articles",
                field: "lignes",
                formatter: cell => (cell.getValue() || []).reduce((total, ligne) => total + ligne.quantite, 0)
            }
        ]
    });

    grilleVentes.on("cellClick", (event, cell) => {
        const vente = cell.getRow().getData();
        selectionnerVente(vente.id);
    });
}

function selectionnerVente(id) {
    venteSelectionnee = ventes.find(vente => vente.id === id);

    if (!venteSelectionnee) return;

    document.getElementById("detail-vide").style.display = "none";
    document.getElementById("detail-contenu").style.display = "block";

    document.getElementById("detail-date").textContent = new Date(venteSelectionnee.date).toLocaleString("fr-FR");
    document.getElementById("detail-total").textContent = `${venteSelectionnee.total} F`;

    afficherGrilleLignes();
    afficherGrillePaiements();
}

function afficherGrilleLignes() {
    if (grilleLignes) grilleLignes.destroy();

    grilleLignes = new Tabulator("#detail-lignes", {
        data: venteSelectionnee.lignes || [],
        layout: "fitColumns",
        height: "200px",
        placeholder: "Aucun article",
        columns: [
            { title: "Produit", field: "produitNom" },
            { title: "Qté", field: "quantite" },
            { title: "Prix unit.", field: "prixUnitaire", formatter: cell => `${cell.getValue()} F` },
            { 
                title: "Sous-total", 
                formatter: cell => {
                    const ligne = cell.getRow().getData();
                    return `${ligne.quantite * ligne.prixUnitaire} F`;
                } 
            }
        ]
    });
}

function afficherGrillePaiements() {
    if (grillePaiements) grillePaiements.destroy();

    grillePaiements = new Tabulator("#detail-paiements", {
        data: venteSelectionnee.paiements || [],
        layout: "fitColumns",
        height: "150px",
        placeholder: "Aucun paiement",
        columns: [
            { title: "Type", field: "type" },
            { title: "Moyen", field: "moyenPaiement" },
            { title: "Montant", field: "montant", formatter: cell => `${cell.getValue()} F` }
        ]
    });
}

// --- Impression ---
function imprimerHistorique() {
    const ventesAImprimer = grilleVentes.getData();

    if (ventesAImprimer.length === 0) {
        alert("Aucune vente à imprimer.");
        return;
    }

    const fenetre = window.open("", "_blank");
    if (!fenetre) {
        alert("La fenêtre d'impression a été bloquée par le navigateur.");
        return;
    }

    let totalGeneral = 0;

    const ventesHtml = ventesAImprimer.map(vente => {
        totalGeneral += Number(vente.total) || 0;

        const lignesHtml = (vente.lignes || []).map(ligne => {
            const sousTotal = Number(ligne.quantite) * Number(ligne.prixUnitaire);
            return `
                <tr>
                    <td>${ligne.produitNom}</td>
                    <td>${ligne.quantite}</td>
                    <td class="montant">${ligne.prixUnitaire} F</td>
                    <td class="montant">${sousTotal} F</td>
                </tr>
            `;
        }).join("");

        const paiementsHtml = (vente.paiements || []).map(paiement => `
            <tr>
                <td>${paiement.type}</td>
                <td>${paiement.moyenPaiement}</td>
                <td class="montant">${paiement.montant} F</td>
            </tr>
        `).join("");

        return `
            <div class="vente">
                <div class="vente-entete">
                    <span>${new Date(vente.date).toLocaleString("fr-FR")}</span>
                    <span>${vente.total} F</span>
                </div>

                <div class="section">Articles</div>
                <table>
                    <thead>
                        <tr>
                            <th>Produit</th>
                            <th>Quantité</th>
                            <th>Prix unitaire</th>
                            <th>Sous-total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${lignesHtml}
                    </tbody>
                </table>

                <div class="section">Paiements</div>
                <table>
                    <thead>
                        <tr>
                            <th>Type</th>
                            <th>Moyen</th>
                            <th>Montant</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${paiementsHtml}
                    </tbody>
                </table>
            </div>
        `;
    }).join("");

    const contenu = `
        <!DOCTYPE html>
        <html lang="fr">
        <head>
            <meta charset="UTF-8">
            <title>Historique des ventes</title>
            <style>
                body { font-family: Arial, sans-serif; color: #222; margin: 30px; }
                h1 { margin-bottom: 25px; font-size: 24px; }
                .vente { margin-bottom: 30px; page-break-inside: avoid; }
                .vente-entete { display: flex; justify-content: space-between; border-bottom: 2px solid #333; padding-bottom: 8px; margin-bottom: 10px; font-weight: bold; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
                th, td { border: 1px solid #ccc; padding: 7px; text-align: left; }
                th { background: #f2f2f2; }
                .montant { text-align: right; }
                .section { margin-top: 12px; margin-bottom: 5px; font-weight: bold; }
                .total-general { border-top: 2px solid #333; margin-top: 25px; padding-top: 10px; font-size: 18px; font-weight: bold; text-align: right; }
                @media print { body { margin: 15mm; } }
            </style>
        </head>
        <body>
            <h1>Historique des ventes</h1>
            ${ventesHtml}
            <div class="total-general">
                Total des ventes : ${totalGeneral} F
            </div>
        </body>
        </html>
    `;

    fenetre.document.write(contenu);
    fenetre.document.close();
    fenetre.focus();
    fenetre.print();
    fenetre.close();
}