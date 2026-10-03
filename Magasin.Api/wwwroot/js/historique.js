let ventes = [];
let venteSelectionnee = null;

let grilleVentes = null;
let grilleLignes = null;
let grillePaiements = null;


/**
 * Charge toutes les ventes depuis l'API.
 * Puis crée la grille principale et initialise les filtres.
 */
async function chargerVentes() {
    try {
        const response = await fetch("/api/ventes");

        if (!response.ok) {
            throw new Error("Erreur lors du chargement des ventes.");
        }

        ventes = await response.json();

        creerGrilleVentes();
        initialiserFiltres();

        if (ventes.length > 0) {
            selectionnerVente(ventes[0].id);
        }

    } catch (error) {
        console.error(error);
    }
}


/**
 * Initialise les événements des différents filtres.
 * Chaque modification relance automatiquement le filtrage.
 */
function initialiserFiltres() {
    const typePeriode = document.getElementById("type-periode");
    const valeurPeriode = document.getElementById("valeur-periode");
    const produit = document.getElementById("produit");
    const boutonReinitialiser = document.getElementById("btn-reinitialiser");
    const boutonImprimer = document.getElementById("btn-imprimer");

    typePeriode.addEventListener("change", function () {
        changerTypePeriode();
        appliquerFiltres();
    });

    valeurPeriode.addEventListener("change", function () {
        appliquerFiltres();
    });

    produit.addEventListener("input", function () {
        appliquerFiltres();
    });

    boutonImprimer.addEventListener("click", function () {
        imprimerHistorique();
    });
    boutonReinitialiser.addEventListener("click", function () {
        reinitialiserFiltres();
    });

    changerTypePeriode();
}


/**
 * Adapte le champ de saisie de la période selon le type sélectionné.
 *
 * Jour  -> date complète
 * Mois  -> mois et année
 * Année -> année
 * Vide  -> aucun champ de période
 */
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
    }
    else if (type === "mois") {
        valeurPeriode.type = "month";
        valeurPeriode.placeholder = "";
        label.textContent = "Mois";
        groupeValeur.style.display = "block";
    }
    else if (type === "annee") {
        valeurPeriode.type = "number";
        valeurPeriode.placeholder = "Ex. 2026";
        valeurPeriode.min = "2000";
        valeurPeriode.max = "2100";
        label.textContent = "Année";
        groupeValeur.style.display = "block";
    }
    else {
        groupeValeur.style.display = "none";
    }
}


/**
 * Récupère les valeurs actuelles des filtres
 * puis applique le filtrage aux ventes.
 */
function appliquerFiltres() {
    const typePeriode = document.getElementById("type-periode").value;
    const valeurPeriode = document.getElementById("valeur-periode").value;
    const produit = document.getElementById("produit").value.trim();

    filtrerVentes(typePeriode, valeurPeriode, produit);
}


/**
 * Filtre les ventes selon une période et/ou un produit.
 *
 * typePeriode :
 * - "jour"
 * - "mois"
 * - "annee"
 *
 * valeurPeriode :
 * - jour : "2026-10-03"
 * - mois : "2026-10"
 * - annee : "2026"
 *
 * produit :
 * - nom ou partie du nom du produit à rechercher
 * - chaîne vide pour ne pas filtrer sur le produit
 */
function filtrerVentes(typePeriode, valeurPeriode, produit) {
    const ventesFiltrees = ventes.filter(function (vente) {
        const dateVente = new Date(vente.date);

        let periodeCorrespond;

        if (!typePeriode || !valeurPeriode) {
            periodeCorrespond = true;
        }
        else if (typePeriode === "jour") {
            const dateVenteFormatee =
                dateVente.getFullYear() +
                "-" +
                String(dateVente.getMonth() + 1).padStart(2, "0") +
                "-" +
                String(dateVente.getDate()).padStart(2, "0");

            periodeCorrespond = dateVenteFormatee === valeurPeriode;
        }
        else if (typePeriode === "mois") {
            const moisVente =
                dateVente.getFullYear() +
                "-" +
                String(dateVente.getMonth() + 1).padStart(2, "0");

            periodeCorrespond = moisVente === valeurPeriode;
        }
        else if (typePeriode === "annee") {
            periodeCorrespond =
                String(dateVente.getFullYear()) === valeurPeriode;
        }
        else {
            periodeCorrespond = true;
        }

        if (!periodeCorrespond) {
            return false;
        }

        if (!produit) {
            return true;
        }

        return (vente.lignes || []).some(function (ligne) {
            return String(ligne.produitNom)
                .toLowerCase()
                .includes(produit.toLowerCase());
        });
    });

    grilleVentes.setData(ventesFiltrees);

    if (ventesFiltrees.length > 0) {
        selectionnerVente(ventesFiltrees[0].id);
    }
    else {
        venteSelectionnee = null;

        document.getElementById("detail-vide").style.display = "block";
        document.getElementById("detail-contenu").style.display = "none";
    }
}



/**
 * Réinitialise tous les filtres et affiche à nouveau
 * l'ensemble des ventes.
 */
function reinitialiserFiltres() {
    document.getElementById("type-periode").value = "";
    document.getElementById("valeur-periode").value = "";
    document.getElementById("code-barres").value = "";

    changerTypePeriode();
    filtrerVentes("", "", "");
}


/**
 * Crée la grille principale contenant la liste des ventes.
 * La grille affiche la date, le total et le nombre d'articles.
 */
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
                formatter: function (cell) {
                    return new Date(cell.getValue()).toLocaleString("fr-FR");
                }
            },
            {
                title: "Total",
                field: "total",
                formatter: function (cell) {
                    return cell.getValue() + " F";
                }
            },
            {
                title: "Articles",
                field: "lignes",
                formatter: function (cell) {
                    return cell.getValue().reduce(
                        function (total, ligne) {
                            return total + ligne.quantite;
                        },
                        0
                    );
                }
            }
        ]
    });

    grilleVentes.on("cellClick", function (event, cell) {
        const vente = cell.getRow().getData();

        selectionnerVente(vente.id);
    });
}


/**
 * Sélectionne une vente et affiche ses informations détaillées.
 * Les grilles des articles et des paiements sont ensuite actualisées.
 */
function selectionnerVente(id) {
    venteSelectionnee = ventes.find(function (vente) {
        return vente.id === id;
    });

    if (!venteSelectionnee) {
        return;
    }

    document.getElementById("detail-vide").style.display = "none";
    document.getElementById("detail-contenu").style.display = "block";

    document.getElementById("detail-date").textContent =
        new Date(venteSelectionnee.date).toLocaleString("fr-FR");

    document.getElementById("detail-total").textContent =
        venteSelectionnee.total + " F";

    afficherGrilleLignes();
    afficherGrillePaiements();
}


/**
 * Crée la grille affichant les articles de la vente sélectionnée.
 */
function afficherGrilleLignes() {
    if (grilleLignes) {
        grilleLignes.destroy();
    }

    grilleLignes = new Tabulator("#detail-lignes", {
        data: venteSelectionnee.lignes || [],
        layout: "fitColumns",
        height: "200px",
        placeholder: "Aucun article",

        columns: [
            {
                title: "Produit",
                field: "produitNom"
            },
            {
                title: "Qté",
                field: "quantite"
            },
            {
                title: "Prix unit.",
                field: "prixUnitaire",
                formatter: function (cell) {
                    return cell.getValue() + " F";
                }
            },
            {
                title: "Sous-total",
                formatter: function (cell) {
                    const ligne = cell.getRow().getData();

                    return (ligne.quantite * ligne.prixUnitaire) + " F";
                }
            }
        ]
    });
}


/**
 * Crée la grille affichant les paiements de la vente sélectionnée.
 */
function afficherGrillePaiements() {
    if (grillePaiements) {
        grillePaiements.destroy();
    }

    grillePaiements = new Tabulator("#detail-paiements", {
        data: venteSelectionnee.paiements || [],
        layout: "fitColumns",
        height: "150px",
        placeholder: "Aucun paiement",

        columns: [
            {
                title: "Type",
                field: "type"
            },
            {
                title: "Moyen",
                field: "moyenPaiement"
            },
            {
                title: "Montant",
                field: "montant",
                formatter: function (cell) {
                    return cell.getValue() + " F";
                }
            }
        ]
    });
}

//**************************************************************************************************************** */
/**
 * Prépare et imprime l'historique des ventes actuellement affichées.
 * Chaque vente contient ses articles et ses paiements.
 */
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

    let contenu = `
        <!DOCTYPE html>
        <html lang="fr">
        <head>
            <meta charset="UTF-8">
            <title>Historique des ventes</title>

            <style>
                body {
                    font-family: Arial, sans-serif;
                    color: #222;
                    margin: 30px;
                }

                h1 {
                    margin-bottom: 25px;
                    font-size: 24px;
                }

                .vente {
                    margin-bottom: 30px;
                    page-break-inside: avoid;
                }

                .vente-entete {
                    display: flex;
                    justify-content: space-between;
                    border-bottom: 2px solid #333;
                    padding-bottom: 8px;
                    margin-bottom: 10px;
                    font-weight: bold;
                }

                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 12px;
                }

                th,
                td {
                    border: 1px solid #ccc;
                    padding: 7px;
                    text-align: left;
                }

                th {
                    background: #f2f2f2;
                }

                .montant {
                    text-align: right;
                }

                .section {
                    margin-top: 12px;
                    margin-bottom: 5px;
                    font-weight: bold;
                }

                .total-general {
                    border-top: 2px solid #333;
                    margin-top: 25px;
                    padding-top: 10px;
                    font-size: 18px;
                    font-weight: bold;
                    text-align: right;
                }

                @media print {
                    body {
                        margin: 15mm;
                    }
                }
            </style>
        </head>

        <body>

            <h1>Historique des ventes</h1>
    `;

    let totalGeneral = 0;

    ventesAImprimer.forEach(function (vente) {
        totalGeneral += Number(vente.total) || 0;

        contenu += `
            <div class="vente">

                <div class="vente-entete">
                    <span>
                        ${new Date(vente.date).toLocaleString("fr-FR")}
                    </span>
                    <span>
                        ${vente.total} F
                    </span>
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
        `;

        (vente.lignes || []).forEach(function (ligne) {
            const sousTotal =
                Number(ligne.quantite) * Number(ligne.prixUnitaire);

            contenu += `
                        <tr>
                            <td>${ligne.produitNom}</td>
                            <td>${ligne.quantite}</td>
                            <td class="montant">${ligne.prixUnitaire} F</td>
                            <td class="montant">${sousTotal} F</td>
                        </tr>
            `;
        });

        contenu += `
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
        `;

        (vente.paiements || []).forEach(function (paiement) {
            contenu += `
                        <tr>
                            <td>${paiement.type}</td>
                            <td>${paiement.moyenPaiement}</td>
                            <td class="montant">${paiement.montant} F</td>
                        </tr>
            `;
        });

        contenu += `
                    </tbody>
                </table>

            </div>
        `;
    });

    contenu += `
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

chargerVentes();
