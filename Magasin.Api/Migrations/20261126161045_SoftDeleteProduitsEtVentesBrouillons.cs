using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Magasin.Api.Migrations
{
    /// <inheritdoc />
    public partial class SoftDeleteProduitsEtVentesBrouillons : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "EstFinalisee",
                table: "Ventes",
                type: "boolean",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<bool>(
                name: "EstSupprime",
                table: "Produits",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "EstFinalisee",
                table: "Ventes");

            migrationBuilder.DropColumn(
                name: "EstSupprime",
                table: "Produits");
        }
    }
}
