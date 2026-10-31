// --- Module d'impression de ticket de caisse unifié ---

function imprimerTicketCaisse(venteData) {
    if (!venteData) {
        alert("Aucune donnée de vente à imprimer.");
        return;
    }

    const fenetre = window.open("", "_blank", "width=400,height=600");
    if (!fenetre) {
        alert("La fenêtre d'impression a été bloquée par le navigateur.");
        return;
    }

    const dateFormaggee = new Date(venteData.date || Date.now()).toLocaleString("fr-FR");
    const totalVente = Number(venteData.total) || 0;
    const renduVente = Number(venteData.rendu) || 0;

    const lignesHtml = (venteData.lignes || []).map(ligne => {
        const qte = Number(ligne.quantite) || 0;
        const pu = Number(ligne.prixUnitaire || ligne.prix) || 0;
        const sousTotal = qte * pu;
        const nomProduit = ligne.produitNom || ligne.nom || "Article";
        return `
            <tr>
                <td>${nomProduit}</td>
                <td class="center">${qte}</td>
                <td class="right">${pu} F</td>
                <td class="right">${sousTotal} F</td>
            </tr>
        `;
    }).join("");

    const paiementsHtml = (venteData.paiements || []).map(p => {
        const mode = (p.moyenPaiement || p.mode || "").toUpperCase();
        const montant = Number(p.montant) || 0;
        return `<div class="ligne-paiement"><span>• ${mode}</span><span>${montant} F</span></div>`;
    }).join("");

    const contenuHtml = `
        <!DOCTYPE html>
        <html lang="fr">
        <head>
            <meta charset="UTF-8">
            <title>Ticket de Caisse</title>
            <style>
                body {
                    font-family: 'Courier New', Courier, monospace;
                    font-size: 12px;
                    color: #000;
                    width: 80mm;
                    margin: 0 auto;
                    padding: 10px;
                    background: #fff;
                }
                .ticket-header, .ticket-footer {
                    text-align: center;
                }
                .ticket-header h2 {
                    margin: 0 0 5px 0;
                    font-size: 16px;
                }
                hr {
                    border: none;
                    border-top: 1px dashed #000;
                    margin: 8px 0;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                }
                th, td {
                    padding: 3px 2px;
                    font-size: 11px;
                    text-align: left;
                }
                th {
                    border-bottom: 1px solid #000;
                }
                .right { text-align: right; }
                .center { text-align: center; }
                .ticket-totaux {
                    font-size: 14px;
                    margin-top: 8px;
                }
                .ligne-paiement {
                    display: flex;
                    justify-content: space-between;
                }
                @media print {
                    body { width: 100%; margin: 0; padding: 0; }
                }
            </style>
        </head>
        <body>
            <div class="ticket-header">
                <h2>MAGASIN</h2>
                <p>Date : ${dateFormaggee}</p>
                ${venteData.id ? `<p>Ticket #${venteData.id}</p>` : ''}
            </div>
            <hr>
            <table>
                <thead>
                    <tr>
                        <th>Désignation</th>
                        <th class="center">Qté</th>
                        <th class="right">P.U</th>
                        <th class="right">Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${lignesHtml}
                </tbody>
            </table>
            <hr>
            <div class="ticket-totaux right">
                <p><strong>TOTAL : ${totalVente} F</strong></p>
            </div>
            <hr>
            <div class="section-paiements">
                <strong>Paiements :</strong>
                ${paiementsHtml}
                ${renduVente > 0 ? `<div class="ligne-paiement"><span>• RENDU</span><span>${renduVente} F</span></div>` : ''}
            </div>
            <hr>
            <div class="ticket-footer">
                <p>Merci pour votre achat !<br>À bientôt dans notre magasin.</p>
            </div>
        </body>
        </html>
    `;

    fenetre.document.write(contenuHtml);
    fenetre.document.close();
    fenetre.focus();
    setTimeout(() => {
        fenetre.print();
        fenetre.close();
    }, 250);
}