using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Magasin.Api.Migrations
{
    /// <inheritdoc />
    public partial class UniqueCodeBarre : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_Produits_CodeBarre",
                table: "Produits",
                column: "CodeBarre",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Produits_CodeBarre",
                table: "Produits");
        }
    }
}
