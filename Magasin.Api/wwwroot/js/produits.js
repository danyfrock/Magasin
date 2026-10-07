let produitTable = null;
let imageSelectionnee = null;

document.addEventListener("DOMContentLoaded", function () {
    initialiserGrille();
    initialiserFormulaire();
    chargerProduits();
});

// Initialise la grille des produits.
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
                formatter: function (cell) {
                    const image = cell.getValue();

                    if (!image || !image.imageResponse) {
                        return "";
                    }

                    return `<img src="/${image.imageResponse.imagePath}" class="produit-image" alt="Produit">`;
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
                formatter: function () {
                    return `
                        <button class="action-btn btn-modifier">Modifier</button>
                        <button class="action-btn btn-supprimer">Supprimer</button>
                    `;
                },
                hozAlign: "center",
                headerSort: false,
                cellClick: function (event, cell) {
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

    document
        .getElementById("btn-imprimer")
        .addEventListener("click", imprimerProduits);
}

// Initialise les événements du formulaire.
function initialiserFormulaire() {
    const formulaire = document.getElementById("produit-form");
    const boutonAnnuler = document.getElementById("btn-annuler");
    const boutonAjouterImage = document.getElementById("btn-ajouter-image");
    const image = document.getElementById("image");

    formulaire.addEventListener("submit", enregistrerProduit);
    boutonAnnuler.addEventListener("click", nettoyerFormulaire);
    boutonAjouterImage.addEventListener("click", function () {
        image.click();
    });

    image.addEventListener("change", afficherNouvelleImage);

    // MODALE
    // OUVRIR
    const boutonChoisirImage = document.getElementById("btn-choisir-image");
    const modalImages = document.getElementById("modal-images");
    boutonChoisirImage.addEventListener("click", function () {
        chargerImages();
        modalImages.classList.add("visible");
    });
    // FERMER
    const boutonFermerModal = document.getElementById("btn-fermer-modal");
    boutonFermerModal.addEventListener("click", function () {
        modalImages.classList.remove("visible");
    });
}

// Charge les images existantes depuis l'API.
async function chargerImages() {
    const response = await fetch("/api/image");

    if (!response.ok) {
        afficherErreur("Impossible de charger les images.");
        return;
    }

    const images = await response.json();

    const liste = document.getElementById("liste-images");

    // Vide la liste avant de la remplir.
    liste.innerHTML = "";

    // Ajoute chaque image dans la modale.
    images.forEach(function (image) {
        const nomFichier = image.imagePath.split("\\").pop();

        liste.innerHTML += `
            <div class="image-selection" data-image-id="${image.id}">
                <img src="/Images/${nomFichier}" alt="Image">
            </div>
        `;
    });

    // Récupère toutes les images affichées.
    const imagesSelection = document.querySelectorAll(".image-selection");

    // Permet de sélectionner une image au clic.
    imagesSelection.forEach(function (element) {
        element.addEventListener("click", function () {
            const imageId = Number(element.dataset.imageId);

            // Retrouve l'image sélectionnée dans la liste.
            imageSelectionnee = images.find(function (image) {
                return image.id === imageId;
            });

            console.log("Image sélectionnée :", imageSelectionnee);

            // Affiche l'image sélectionnée dans le formulaire.
            afficherImageExistante({
                imageResponse: imageSelectionnee,
                imageData: null
            });

            // Ferme la modale.
            modalImages.classList.remove("visible");
        });
    });
}

// Charge tous les produits depuis l'API.
async function chargerProduits() {
    try {
        const response = await fetch("/api/produits");

        if (!response.ok) {
            afficherErreur("Impossible de charger les produits.");
            return;
        }

        const produits = await response.json();

        produitTable.setData(produits);
    }
    catch (error) {
        afficherErreur("Impossible de contacter le serveur.");
    }
}

// Charge un produit dans le formulaire.
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

// Affiche l'image existante du produit.
function afficherImageExistante(imageSwitch) {
    const container = document.getElementById("image-preview-container");
    const image = document.getElementById("image-preview");
    const texte = document.getElementById("image-preview-empty");

    if (!imageSwitch || !imageSwitch.imageResponse) {
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

// Affiche l'image nouvellement sélectionnée.
function afficherNouvelleImage() {
    // Une nouvelle image remplace une éventuelle sélection existante.
    imageSelectionnee = null;

    const fichier = document.getElementById("image").files[0];

    if (!fichier) {
        return;
    }

    const url = URL.createObjectURL(fichier);

    const container = document.getElementById("image-preview-container");
    const image = document.getElementById("image-preview");
    const texte = document.getElementById("image-preview-empty");

    image.src = url;
    image.style.display = "block";
    texte.style.display = "none";
    container.classList.add("visible");
}

// Convertit un fichier en Base64.
function fichierVersBase64(fichier) {
    return new Promise(function (resolve, reject) {
        const lecteur = new FileReader();

        lecteur.onload = function () {
            const resultat = lecteur.result;
            const base64 = resultat.split(",")[1];

            resolve(base64);
        };

        lecteur.onerror = reject;

        lecteur.readAsDataURL(fichier);
    });
}

// Construit les données de l'image à envoyer à l'API.
async function construireImage(produitExistant) {
    const fichier = document.getElementById("image").files[0];

    // Une nouvelle image a été sélectionnée.
    if (fichier) {
        return {
            imageResponse: null,
            imageData: {
                data: await fichierVersBase64(fichier),
                contentType: fichier.type
            }
        };
    }

    // Une image existante a été sélectionnée.
    if (imageSelectionnee) {
        return {
            imageResponse: imageSelectionnee,
            imageData: null
        };
    }

    // Aucune nouvelle image n'a été sélectionnée.
    if (produitExistant && produitExistant.image && produitExistant.image.imageResponse) {
        return {
            imageResponse: produitExistant.image.imageResponse,
            imageData: null
        };
    }

    return {
        imageResponse: null,
        imageData: null
    };
}

// Enregistre ou modifie un produit.
async function enregistrerProduit(event) {
    event.preventDefault();

    const id = document.getElementById("produit-id").value;
    const codeBarre = document.getElementById("code-barre").value.trim();
    const nom = document.getElementById("nom").value.trim();
    const prix = Number(document.getElementById("prix").value);
    const description = document.getElementById("description").value.trim();

    let produitExistant = null;

    if (id !== "") {
        const produit = produitTable
            .getRows()
            .map(function (row) {
                return row.getData();
            })
            .find(function (produit) {
                return produit.id === Number(id);
            });

        produitExistant = produit || null;
    }

    try {
        const image = await construireImage(produitExistant);

        let response;

        if (id === "") {
            response = await fetch("/api/produits", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    nom: nom,
                    prix: prix,
                    description: description || null,
                    image: image
                })
            });
        }
        else {
            response = await fetch("/api/produits", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    id: Number(id),
                    codeBarre: codeBarre,
                    nom: nom,
                    prix: prix,
                    description: description || null,
                    image: image
                })
            });
        }

        if (!response.ok) {
            afficherErreur("Une erreur est survenue.");
            return;
        }

        const produit = await response.json();

        chargerProduitDansFormulaire(produit);
        await chargerProduits();

        afficherSucces();
    }
    catch (error) {
        afficherErreur("Impossible de contacter le serveur.");
    }
}

// Supprime un produit.
async function supprimerProduit(id) {
    if (!confirm("Voulez-vous vraiment supprimer ce produit ?")) {
        return;
    }

    try {
        const response = await fetch("/api/produits/" + id, {
            method: "DELETE"
        });

        if (!response.ok) {
            afficherErreur("Impossible de supprimer le produit.");
            return;
        }

        nettoyerFormulaire();
        await chargerProduits();
    }
    catch (error) {
        afficherErreur("Impossible de contacter le serveur.");
    }
}

// Réinitialise le formulaire.
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

// Affiche le message de succès.
function afficherSucces() {
    const message = document.getElementById("message-succes");

    message.textContent = "✓ Produit enregistré";
    message.classList.add("visible");

    setTimeout(function () {
        message.classList.remove("visible");
    }, 2500);
}

// Masque le message de succès.
function masquerSucces() {
    document
        .getElementById("message-succes")
        .classList.remove("visible");
}

// Affiche une erreur.
function afficherErreur(messageTexte) {
    alert(messageTexte);
}

// Imprime les produits.
function imprimerProduits() {
    window.print();
}