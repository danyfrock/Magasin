import { createProductPicker } from "./product-picker.js";

// --- État de la caisse ---
let panier = [];
let paiements = [];
let deviseCaisse = "XOF";

// --- Éléments DOM ---
const montantPayeInput = document.getElementById("montantPaye");
const montantRenduInput = document.getElementById("montantRendu");
const listePaiements = document.getElementById("paiements-effectues");
const tbodyPanier = document.getElementById("panier");
const totalElement = document.getElementById("total");
const dejaPayeElement = document.getElementById("dejaPaye");
const resteAPayerElement = document.getElementById("resteAPayer");
const ligneARendreElement = document.getElementById("ligneARendre");
const aRendreElement = document.getElementById("aRendre");
const btnValider = document.getElementById("validerVente");
const inputScan = document.getElementById("scan");
const btnRechercherProduit = document.getElementById("btnRechercherProduit");
const modalAutreDevise = document.getElementById("modalAutreDevise");
const converterModal = document.getElementById("converterModal");

const productPicker = createProductPicker({
  mode: "modal",
  htmlUrl: "../components/product-picker.html"
});

// --- Calculs et formatage ---
function formatMontant(montant) {
  return `${montant} ${deviseCaisse}`;
}

function calculerTotalNumerique() {
  return panier.reduce((total, produit) => total + produit.prix * produit.quantite, 0);
}

function totalPaye() {
  return paiements.reduce((total, paiement) => total + paiement.montant, 0);
}

function formaterLibellePaiement(paiement) {
  const libelle = `${paiement.mode.toUpperCase()} : ${formatMontant(paiement.montant)}`;

  return paiement.devise && paiement.devise !== deviseCaisse
    ? `${libelle} (${paiement.montantOriginal} ${paiement.devise})`
    : libelle;
}

function construireVenteDto(estFinalisee) {
  return {
    lignes: panier.map(produit => ({
      produitId: produit.id,
      quantite: produit.quantite
    })),
    paiements: paiements.map(paiement => ({
      moyenPaiement: paiement.mode,
      montant: paiement.montant,
      devise: paiement.devise || deviseCaisse,
      montantOriginal: paiement.montantOriginal ?? paiement.montant
    })),
    rendu: Number(montantRenduInput?.value) || 0,
    deviseCaisse,
    estFinalisee
  };
}

// --- Synchronisation avec le Pot commun ---
function synchroniserVentePotCommun() {
  if (!window.potCommun) return;

  if (panier.length === 0) {
    window.potCommun.chargerVente(null);
    return;
  }

  const total = calculerTotalNumerique();

  window.potCommun.chargerVente(construireVenteDto(false), {
    openDrawer: false,
    label: `Joint au message : Vente en cours (${formatMontant(total)})`
  });
}

// --- Gestion du panier ---
function ajouterProduitAuPanier(produit) {
  const existant = panier.find(element => element.id === produit.id);

  if (existant) {
    existant.quantite++;
  } else {
    panier.push({ ...produit, quantite: 1 });
  }

  afficherPanier();
}

function modifierQuantiteProduit(id, action) {
  const produit = panier.find(element => element.id === id);
  if (!produit) return;

  if (action === "plus") {
    produit.quantite++;
  } else if (action === "moins") {
    produit.quantite--;
  } else if (action === "supprimer") {
    panier = panier.filter(element => element.id !== id);
  } else {
    return;
  }

  afficherPanier();
}

async function ajouterParCodeBarre(code) {
  try {
    const produit = await apiCall(`/api/produits/${encodeURIComponent(code)}`);

    if (!produit) {
      alert("Produit inconnu");
      return;
    }

    ajouterProduitAuPanier(produit);
  } catch {
    alert("Produit inconnu ou erreur serveur");
  }
}

async function traiterCodeScan(code) {
  const codeNormalise = String(code ?? "").trim();
  if (!codeNormalise) return;

  inputScan.value = "";
  await ajouterParCodeBarre(codeNormalise);
}

function selectionnerCodeBarreDansScan(codeBarre) {
  if (!codeBarre || !inputScan) return;

  inputScan.value = codeBarre;
  inputScan.focus();
  void traiterCodeScan(codeBarre);
}

// --- Reprise depuis le Pot commun ---
async function reprendreDepuisPotCommun(detail = {}) {
  const { produitId, venteId } = detail;

  if (produitId) {
    try {
      const produit = await apiCall(`/api/produits/${produitId}`);

      if (!produit) {
        alert("Produit introuvable");
        return;
      }

      if (produit.codeBarre) {
        selectionnerCodeBarreDansScan(produit.codeBarre);
      } else {
        ajouterProduitAuPanier(produit);
      }
    } catch {
      alert("Impossible de reprendre le produit.");
    }

    return;
  }

  if (!venteId) return;

  try {
    const vente = await apiCall(`/api/ventes/${venteId}`);

    if (!vente) {
      alert("Vente introuvable");
      return;
    }

    panier = (vente.lignes ?? []).map(ligne => ({
      id: ligne.produitId,
      nom: ligne.produitNom ?? `Produit #${ligne.produitId}`,
      prix: Number(ligne.prixUnitaire ?? ligne.prix ?? 0),
      quantite: Number(ligne.quantite ?? 1),
      codeBarre: ligne.codeBarre
    }));

    paiements = (vente.paiements ?? []).map(paiement => ({
      mode: paiement.moyenPaiement ?? paiement.mode ?? "especes",
      montant: Number(paiement.montant ?? 0),
      devise: paiement.devise || deviseCaisse,
      montantOriginal: Number(paiement.montantOriginal ?? paiement.montant ?? 0)
    }));

    if (montantRenduInput) {
      montantRenduInput.value = vente.rendu ? String(vente.rendu) : "";
    }

    afficherPanier();
  } catch {
    alert("Impossible de reprendre la vente.");
  }
}

// --- Affichage ---
function afficherListePaiements() {
  listePaiements.replaceChildren();

  if (paiements.length === 0) {
    const message = document.createElement("em");
    message.textContent = "Aucun paiement";
    listePaiements.append(message);
    return;
  }

  const fragment = document.createDocumentFragment();

  paiements.forEach((paiement, index) => {
    const ligne = document.createElement("div");
    const libelle = document.createElement("span");
    const bouton = document.createElement("button");

    libelle.textContent = formaterLibellePaiement(paiement);
    bouton.type = "button";
    bouton.className = "btn-supprimer-paiement";
    bouton.dataset.index = String(index);
    bouton.textContent = "✕";

    ligne.append(libelle, bouton);
    fragment.append(ligne);
  });

  listePaiements.append(fragment);
}

function mettreAJourAffichagePaiement() {
  const total = calculerTotalNumerique();
  const paye = totalPaye();
  const reste = Math.max(0, total - paye);
  const aRendre = Math.max(0, paye - total);

  totalElement.textContent = formatMontant(total);
  dejaPayeElement.textContent = formatMontant(paye);
  resteAPayerElement.textContent = formatMontant(reste);
  resteAPayerElement.style.color = reste === 0 ? "green" : "orange";

  if (aRendre > 0) {
    aRendreElement.textContent = formatMontant(aRendre);
    ligneARendreElement.style.display = "block";
  } else {
    ligneARendreElement.style.display = "none";
  }

  afficherListePaiements();
  btnValider.disabled = !(panier.length > 0 && reste === 0);
  synchroniserVentePotCommun();
}

function creerBoutonPanier(id, action, libelle) {
  const bouton = document.createElement("button");

  bouton.type = "button";
  bouton.className = action === "supprimer" ? "btn-supprimer" : "btn-qty";
  bouton.dataset.id = String(id);
  bouton.dataset.action = action;
  bouton.textContent = libelle;

  return bouton;
}

function afficherPanier() {
  tbodyPanier.replaceChildren();
  const fragment = document.createDocumentFragment();

  panier.forEach(produit => {
    const ligne = document.createElement("tr");
    const nom = document.createElement("td");
    const prix = document.createElement("td");
    const actions = document.createElement("td");
    const quantite = document.createElement("span");

    nom.textContent = produit.nom;
    prix.textContent = formatMontant(produit.prix);
    quantite.textContent = String(produit.quantite);

    actions.append(
      quantite,
      creerBoutonPanier(produit.id, "plus", "+"),
      creerBoutonPanier(produit.id, "moins", "-"),
      creerBoutonPanier(produit.id, "supprimer", "Supprimer")
    );

    ligne.append(nom, prix, actions);
    fragment.append(ligne);
  });

  tbodyPanier.append(fragment);
  mettreAJourAffichagePaiement();
}

// --- Gestion des paiements ---
function ajouterPaiement(mode) {
  let montant = Number(montantPayeInput.value);

  if (!montant || montant <= 0) {
    montant = Math.max(0, calculerTotalNumerique() - totalPaye());
  }

  if (montant <= 0) return;

  paiements.push({
    mode,
    montant,
    devise: deviseCaisse,
    montantOriginal: montant
  });

  montantPayeInput.value = "";
  mettreAJourAffichagePaiement();
  montantPayeInput.focus();
}

function ajouterPaiementAutreDevise() {
  const conversion = converterModal?.getLastConversion();

  if (!conversion || !conversion.montant || conversion.montant <= 0) {
    alert("Conversion non disponible ou montant invalide");
    return;
  }

  paiements.push({
    mode: "especes",
    montant: conversion.montant,
    devise: conversion.devise,
    montantOriginal: conversion.montantOriginal
  });

  mettreAJourAffichagePaiement();
  modalAutreDevise.close();
  converterModal?.reset();
}

function supprimerPaiement(index) {
  if (!Number.isInteger(index) || index < 0 || index >= paiements.length) return;

  paiements.splice(index, 1);
  mettreAJourAffichagePaiement();
}

// --- Validation et annulation ---
async function validerVente() {
  const total = calculerTotalNumerique();
  const paye = totalPaye();
  const rendu = Number(montantRenduInput.value) || 0;

  if (panier.length === 0) {
    alert("Panier vide");
    return;
  }

  if (paye < total) {
    alert(`Il reste ${formatMontant(total - paye)}`);
    return;
  }

  try {
    await apiCall("/api/ventes", {
      method: "POST",
      body: JSON.stringify(construireVenteDto(true))
    });

    if (document.getElementById("imprimerTicketAuto")?.checked) {
      imprimerTicketCaisse({
        date: new Date(),
        lignes: panier.map(produit => ({
          produitNom: produit.nom,
          quantite: produit.quantite,
          prixUnitaire: produit.prix
        })),
        paiements,
        rendu
      });
    }

    let message = `Vente validée\nTotal : ${formatMontant(total)}\n`;
    paiements.forEach(paiement => {
      message += `• ${formaterLibellePaiement(paiement)}\n`;
    });
    if (rendu > 0) message += `À rendre : ${formatMontant(rendu)}`;

    alert(message);
    reinitialiserCaisse();
  } catch {
    alert("Erreur lors de la validation de la vente.");
  }
}

function annulerVente() {
  if (panier.length === 0 && paiements.length === 0) return;
  if (confirm("Annuler la vente ?")) reinitialiserCaisse();
}

function reinitialiserCaisse() {
  panier = [];
  paiements = [];
  montantPayeInput.value = "";
  montantRenduInput.value = "";
  afficherPanier();
  window.potCommun?.clear();
  inputScan.focus();
}

// --- Chargement de la devise de caisse ---
async function chargerDeviseCaisse() {
  try {
    const response = await fetch("/api/caisse/devise");
    if (!response.ok) throw new Error("Impossible de charger la devise de caisse.");

    const data = await response.json();
    deviseCaisse = data.deviseCaisse || data.DeviseCaisse || "XOF";
  } catch {
    deviseCaisse = "XOF";
  }

  if (converterModal) converterModal.defaultCurrency = deviseCaisse;
}

// --- Événements ---
document.getElementById("payerEspeces").addEventListener("click", () => ajouterPaiement("especes"));
document.getElementById("payerCarte").addEventListener("click", () => ajouterPaiement("carte"));
document.getElementById("payerAirtel").addEventListener("click", () => ajouterPaiement("airtel"));
document.getElementById("payerMoov").addEventListener("click", () => ajouterPaiement("moov"));
document.getElementById("validerVente").addEventListener("click", validerVente);
document.getElementById("annulerVente").addEventListener("click", annulerVente);

document.getElementById("payerAutreDevise").addEventListener("click", () => {
  converterModal?.reset();
  modalAutreDevise.showModal();
});

document.getElementById("annulerPaiementDevise").addEventListener("click", () => {
  modalAutreDevise.close();
  converterModal?.reset();
});

document.getElementById("validerPaiementDevise").addEventListener("click", ajouterPaiementAutreDevise);
modalAutreDevise.addEventListener("close", () => converterModal?.reset());

// Un seul écouteur pour les actions du panier, même après son réaffichage.
tbodyPanier.addEventListener("click", event => {
  const bouton = event.target.closest("button[data-action]");
  if (!bouton || !tbodyPanier.contains(bouton)) return;

  modifierQuantiteProduit(Number(bouton.dataset.id), bouton.dataset.action);
});

// Un seul écouteur pour supprimer les paiements.
listePaiements.addEventListener("click", event => {
  const bouton = event.target.closest(".btn-supprimer-paiement");
  if (!bouton || !listePaiements.contains(bouton)) return;

  supprimerPaiement(Number(bouton.dataset.index));
});

inputScan.addEventListener("keydown", event => {
  if (event.key !== "Enter") return;

  event.preventDefault();
  void traiterCodeScan(inputScan.value);
});

montantPayeInput.addEventListener("keydown", event => {
  if (event.key === "Enter") {
    event.preventDefault();
    ajouterPaiement("especes");
  }
});

btnRechercherProduit?.addEventListener("click", () => {
  productPicker.open({
    initialText: inputScan?.value.trim() ?? "",
    onSelect: selectionnerCodeBarreDansScan
  });
});

document.addEventListener("pot-commun:reprendre", event => {
  void reprendreDepuisPotCommun(event.detail);
});

// --- Initialisation ---
async function initialiserCaisse() {
  await chargerDeviseCaisse();
  afficherPanier();
}

void initialiserCaisse();