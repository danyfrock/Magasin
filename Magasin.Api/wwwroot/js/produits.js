// --- État global du module ---
let produitTable = null;
let imageSelectionnee = null;

document.addEventListener("DOMContentLoaded", () => {
    initialiserGrille();
    initialiserFormulaire();
    chargerProduits();
});

// --- Grille (Tabulator) ---
function initialiserGrille() {
    produitTable = new Tabulator("#produit-table", {
        layout: "fitColumns",
        pagination: true,
        paginationSize: 15,
        paginationSizeSelector: [10, 15, 25, 50],
        placeholder: "Aucun produit",
        columns: [
            {
                title: "Image",
                field: "image",
                formatter: (cell) => {
                    const img = cell.getValue();
                    if (!img?.imageResponse) return "";
                    return `<img src="/${img.imageResponse.imagePath}" class="produit-image" alt="Produit">`;
                },
                hozAlign: "center",
                headerSort: false
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
                title: "Nom",
                field: "nom",
                headerFilter: "input",
                sorter: "string"
            },
            {
                title: "Prix",
                field: "prix",
                headerFilter: "input",
                sorter: "number",
                hozAlign: "right"
            },
            {
                title: "Description",
                field: "description",
                headerFilter: "input",
                sorter: "string"
            },
            {
                title: "Actions",
                width: 220,
                formatter: () => `
                    <button class="action-btn btn-modifier">Modifier</button>
                    <button class="action-btn btn-supprimer">Supprimer</button>
                `,
                hozAlign: "center",
                headerSort: false,
                cellClick: (event, cell) => {
                    const produit = cell.getRow().getData();
                    const bouton = event.target;

                    if (bouton.classList.contains("btn-modifier")) {
                        chargerProduitDansFormulaire(produit);
                    }
                    if (bouton.classList.contains("btn-supprimer")) {
                        supprimerProduit(produit.id);
                    }
                }
            }
        ]
    });

    document.getElementById("btn-imprimer").addEventListener("click", () => window.print());
}

// --- Formulaire & Modale ---
function initialiserFormulaire() {
    const formulaire = document.getElementById("produit-form");
    const boutonAnnuler = document.getElementById("btn-annuler");
    const boutonAjouterImage = document.getElementById("btn-ajouter-image");
    const champImage = document.getElementById("image");

    formulaire.addEventListener("submit", enregistrerProduit);
    boutonAnnuler.addEventListener("click", nettoyerFormulaire);
    boutonAjouterImage.addEventListener("click", () => champImage.click());
    champImage.addEventListener("change", afficherNouvelleImage);

    // Gestion de la modale d'images
    const boutonChoisirImage = document.getElementById("btn-choisir-image");
    const modalImages = document.getElementById("modal-images");
    const boutonFermerModal = document.getElementById("btn-fermer-modal");

    boutonChoisirImage.addEventListener("click", async () => {
        await chargerImages(modalImages);
    });

    boutonFermerModal.addEventListener("click", () => {
        modalImages.classList.remove("visible");
    });
}

// --- Chargement des données ---
async function chargerImages(modalImages) {
    try {
        const images = await apiCall("/api/image");
        const liste = document.getElementById("liste-images");

        // Optimisation : génération du HTML en une seule fois
        liste.innerHTML = images.map(image => {
            const nomFichier = image.imagePath.split("\\").pop();
            return `
                <div class="image-selection" data-image-id="${image.id}">
                    <img src="/Images/${nomFichier}" alt="Image">
                </div>
            `;
        }).join('');

        // Attachement des écouteurs sur les éléments générés
        document.querySelectorAll(".image-selection").forEach(element => {
            element.addEventListener("click", () => {
                const imageId = Number(element.dataset.imageId);
                imageSelectionnee = images.find(img => img.id === imageId);

                afficherImageExistante({ imageResponse: imageSelectionnee, imageData: null });
                modalImages.classList.remove("visible");
            });
        });

        modalImages.classList.add("visible");
    } catch (error) {
        afficherErreur("Impossible de charger les images.");
    }
}

async function chargerProduits() {
    try {
        const produits = await apiCall("/api/produits");
        produitTable.setData(produits);
    } catch (error) {
        afficherErreur("Impossible de contacter le serveur.");
    }
}

// --- Gestion des images du formulaire ---
function chargerProduitDansFormulaire(produit) {
    imageSelectionnee = null;
    document.getElementById("produit-id").value = produit.id;
    document.getElementById("code-barre").value = produit.codeBarre;
    document.getElementById("nom").value = produit.nom;
    document.getElementById("prix").value = produit.prix;
    document.getElementById("description").value = produit.description || "";

    afficherImageExistante(produit.image);
    masquerSucces();
}

function afficherImageExistante(imageSwitch) {
    const container = document.getElementById("image-preview-container");
    const image = document.getElementById("image-preview");
    const texte = document.getElementById("image-preview-empty");

    if (!imageSwitch?.imageResponse) {
        container.classList.remove("visible");
        image.removeAttribute("src");
        texte.style.display = "block";
        return;
    }

    image.src = "/" + imageSwitch.imageResponse.imagePath;
    image.style.display = "block";
    texte.style.display = "none";
    container.classList.add("visible");
}

function afficherNouvelleImage() {
    imageSelectionnee = null;
    const fichier = document.getElementById("image").files[0];
    if (!fichier) return;

    const container = document.getElementById("image-preview-container");
    const image = document.getElementById("image-preview");
    const texte = document.getElementById("image-preview-empty");

    image.src = URL.createObjectURL(fichier);
    image.style.display = "block";
    texte.style.display = "none";
    container.classList.add("visible");
}

function fichierVersBase64(fichier) {
    return new Promise((resolve, reject) => {
        const lecteur = new FileReader();
        lecteur.onload = () => resolve(lecteur.result.split(",")[1]);
        lecteur.onerror = reject;
        lecteur.readAsDataURL(fichier);
    });
}

async function construireImage(produitExistant) {
    const fichier = document.getElementById("image").files[0];

    if (fichier) {
        return {
            imageResponse: null,
            imageData: {
                data: await fichierVersBase64(fichier),
                contentType: fichier.type
            }
        };
    }

    if (imageSelectionnee) {
        return { imageResponse: imageSelectionnee, imageData: null };
    }

    if (produitExistant?.image?.imageResponse) {
        return { imageResponse: produitExistant.image.imageResponse, imageData: null };
    }

    return { imageResponse: null, imageData: null };
}

// --- Enregistrement & Suppression ---
async function enregistrerProduit(event) {
    event.preventDefault();

    const boutonSubmit = document.querySelector('#produit-form button[type="submit"]');
    if (boutonSubmit.disabled) return;

    boutonSubmit.disabled = true;
    const texteOriginal = boutonSubmit.textContent;
    boutonSubmit.textContent = "Enregistrement…";

    const id = document.getElementById("produit-id").value;
    const codeBarre = document.getElementById("code-barre").value.trim();
    const nom = document.getElementById("nom").value.trim();
    const prix = Number(document.getElementById("prix").value);
    const description = document.getElementById("description").value.trim();

    let produitExistant = null;
    if (id !== "") {
        const lignes = produitTable.getRows().map(row => row.getData());
        produitExistant = lignes.find(p => p.id === Number(id)) || null;
    }

    try {
        const image = await construireImage(produitExistant);
        const payload = { codeBarre, nom, prix, description: description || null, image };
        
        let produit;
        if (id === "") {
            produit = await apiCall("/api/produits", {
                method: "POST",
                body: JSON.stringify(payload)
            });
        } else {
            payload.id = Number(id);
            produit = await apiCall("/api/produits", {
                method: "PUT",
                body: JSON.stringify(payload)
            });
        }

        chargerProduitDansFormulaire(produit);
        await chargerProduits();
        nettoyerFormulaire();
        afficherSucces();
    } catch (error) {
        afficherErreur("Une erreur est survenue lors de l'enregistrement.");
    } finally {
        boutonSubmit.disabled = false;
        boutonSubmit.textContent = texteOriginal;
    }
}

async function supprimerProduit(id) {
    if (!confirm("Voulez-vous vraiment supprimer ce produit ?")) return;

    try {
        await apiCall(`/api/produits/${id}`, { method: "DELETE" });
        nettoyerFormulaire();
        await chargerProduits();
    } catch (error) {
        afficherErreur("Impossible de supprimer le produit.");
    }
}

// --- Utilitaires visuels ---
function nettoyerFormulaire() {
    imageSelectionnee = null;
    document.getElementById("produit-form").reset();
    document.getElementById("produit-id").value = "";
    document.getElementById("code-barre").value = "";

    const container = document.getElementById("image-preview-container");
    const image = document.getElementById("image-preview");
    const texte = document.getElementById("image-preview-empty");

    container.classList.remove("visible");
    image.removeAttribute("src");
    texte.style.display = "block";

    masquerSucces();
}

function afficherSucces() {
    const message = document.getElementById("message-succes");
    message.textContent = "✓ Produit enregistré";
    message.classList.add("visible");
}

function masquerSucces() {
    document.getElementById("message-succes").classList.remove("visible");
}

function afficherErreur(messageTexte) {
    alert(messageTexte);
}