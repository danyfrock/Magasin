document.addEventListener("DOMContentLoaded", () => {

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
            { title: "Anciennes valeurs", field: "anciennesValeurs", headerFilter: "input" },
            { title: "Nouvelles valeurs", field: "nouvellesValeurs", headerFilter: "input" },
            { title: "Poste", field: "nomPoste", headerFilter: "input" }
        ]
    });

});