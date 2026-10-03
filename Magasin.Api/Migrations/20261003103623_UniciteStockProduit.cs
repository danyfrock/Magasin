using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Magasin.Api.Migrations
{
    /// <inheritdoc />
    public partial class UniciteStockProduit : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Stocks_IdProduit",
                table: "Stocks");

            migrationBuilder.CreateIndex(
                name: "IX_Stocks_IdProduit",
                table: "Stocks",
                column: "IdProduit",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Stocks_IdProduit",
                table: "Stocks");

            migrationBuilder.CreateIndex(
                name: "IX_Stocks_IdProduit",
                table: "Stocks",
                column: "IdProduit");
        }
    }
}
