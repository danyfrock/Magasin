document.addEventListener("DOMContentLoaded", () => {

    const modalDetails = document.getElementById("modal-details");
    const modalDetailsTitle = document.getElementById("modal-details-title");
    const modalDetailsBody = document.getElementById("modal-details-body");
    const btnFermerModalDetails = document.getElementById("btn-fermer-modal-details");

    function ouvrirModalDetails(titre, contenu) {
        modalDetailsTitle.textContent = titre;
        modalDetailsBody.textContent = contenu || "Aucune valeur";
        modalDetails.classList.add("visible");
    }

    btnFermerModalDetails.addEventListener("click", () => {
        modalDetails.classList.remove("visible");
    });

    new Tabulator("#journal-table", {
        ajaxURL: "/api/journals",
        layout: "fitColumns",
        pagination: "local",
        paginationSize: 20,
        placeholder: "Aucune donnée dans le journal",
        initialSort: [
            { column: "dateUtc", dir: "desc" }
        ],
        columns: [
            { 
                title: "Date", 
                field: "dateUtc", 
                headerFilter: "input",
                formatter: function(cell) {
                    const val = cell.getValue();
                    if (!val) return "";
                    return new Date(val).toLocaleString("fr-FR");
                }
            },
            { title: "Utilisateur", field: "nomUtilisateur", headerFilter: "input" },
            { title: "Action", field: "action", headerFilter: "input" },
            { title: "Type", field: "typeEntite", headerFilter: "input" },
            { title: "ID", field: "entiteId", width: 80, headerFilter: "input" },
            { 
                title: "Anciennes valeurs", 
                field: "anciennesValeurs", 
                headerFilter: "input",
                cellClick: function(e, cell) {
                    ouvrirModalDetails("Anciennes valeurs", cell.getValue());
                }
            },
            { 
                title: "Nouvelles valeurs", 
                field: "nouvellesValeurs", 
                headerFilter: "input",
                cellClick: function(e, cell) {
                    ouvrirModalDetails("Nouvelles valeurs", cell.getValue());
                }
            },
            { title: "Poste", field: "nomPoste", headerFilter: "input" }
        ]
    });

});