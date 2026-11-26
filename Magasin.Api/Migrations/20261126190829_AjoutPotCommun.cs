using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Magasin.Api.Migrations
{
    /// <inheritdoc />
    public partial class AjoutPotCommun : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "PotsCommuns",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UtilisateurId = table.Column<int>(type: "integer", nullable: false),
                    Message = table.Column<string>(type: "text", nullable: false),
                    DateCreation = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ProduitId = table.Column<int>(type: "integer", nullable: true),
                    VenteId = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PotsCommuns", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PotsCommuns_Produits_ProduitId",
                        column: x => x.ProduitId,
                        principalTable: "Produits",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_PotsCommuns_Utilisateurs_UtilisateurId",
                        column: x => x.UtilisateurId,
                        principalTable: "Utilisateurs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_PotsCommuns_Ventes_VenteId",
                        column: x => x.VenteId,
                        principalTable: "Ventes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_PotsCommuns_DateCreation",
                table: "PotsCommuns",
                column: "DateCreation");

            migrationBuilder.CreateIndex(
                name: "IX_PotsCommuns_ProduitId",
                table: "PotsCommuns",
                column: "ProduitId");

            migrationBuilder.CreateIndex(
                name: "IX_PotsCommuns_UtilisateurId",
                table: "PotsCommuns",
                column: "UtilisateurId");

            migrationBuilder.CreateIndex(
                name: "IX_PotsCommuns_VenteId",
                table: "PotsCommuns",
                column: "VenteId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PotsCommuns");
        }
    }
}
