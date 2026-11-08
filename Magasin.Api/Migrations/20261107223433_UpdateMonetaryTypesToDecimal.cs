using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Magasin.Api.Migrations
{
    /// <inheritdoc />
    public partial class UpdateMonetaryTypesToDecimal : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<decimal>(
                name: "Total",
                table: "Ventes",
                type: "numeric(18,2)",
                precision: 18,
                scale: 2,
                nullable: false,
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.AddColumn<int>(
                name: "TauxChangeId",
                table: "Ventes",
                type: "integer",
                nullable: true);

            migrationBuilder.AlterColumn<decimal>(
                name: "Rate",
                table: "TauxChanges",
                type: "numeric(18,6)",
                precision: 18,
                scale: 6,
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric");

            migrationBuilder.AlterColumn<decimal>(
                name: "Prix",
                table: "Produits",
                type: "numeric",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.AlterColumn<decimal>(
                name: "PrixUnitaire",
                table: "LignesVente",
                type: "numeric(18,2)",
                precision: 18,
                scale: 2,
                nullable: false,
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.AlterColumn<decimal>(
                name: "Montant",
                table: "LignesPaiement",
                type: "numeric(18,2)",
                precision: 18,
                scale: 2,
                nullable: false,
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.AddColumn<string>(
                name: "Devise",
                table: "LignesPaiement",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "MontantOriginal",
                table: "LignesPaiement",
                type: "numeric",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Ventes_TauxChangeId",
                table: "Ventes",
                column: "TauxChangeId");

            migrationBuilder.AddForeignKey(
                name: "FK_Ventes_TauxChanges_TauxChangeId",
                table: "Ventes",
                column: "TauxChangeId",
                principalTable: "TauxChanges",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Ventes_TauxChanges_TauxChangeId",
                table: "Ventes");

            migrationBuilder.DropIndex(
                name: "IX_Ventes_TauxChangeId",
                table: "Ventes");

            migrationBuilder.DropColumn(
                name: "TauxChangeId",
                table: "Ventes");

            migrationBuilder.DropColumn(
                name: "Devise",
                table: "LignesPaiement");

            migrationBuilder.DropColumn(
                name: "MontantOriginal",
                table: "LignesPaiement");

            migrationBuilder.AlterColumn<int>(
                name: "Total",
                table: "Ventes",
                type: "integer",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric(18,2)",
                oldPrecision: 18,
                oldScale: 2);

            migrationBuilder.AlterColumn<decimal>(
                name: "Rate",
                table: "TauxChanges",
                type: "numeric",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric(18,6)",
                oldPrecision: 18,
                oldScale: 6);

            migrationBuilder.AlterColumn<int>(
                name: "Prix",
                table: "Produits",
                type: "integer",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric");

            migrationBuilder.AlterColumn<int>(
                name: "PrixUnitaire",
                table: "LignesVente",
                type: "integer",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric(18,2)",
                oldPrecision: 18,
                oldScale: 2);

            migrationBuilder.AlterColumn<int>(
                name: "Montant",
                table: "LignesPaiement",
                type: "integer",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric(18,2)",
                oldPrecision: 18,
                oldScale: 2);
        }
    }
}
