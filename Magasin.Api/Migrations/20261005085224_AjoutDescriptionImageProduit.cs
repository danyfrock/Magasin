using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Magasin.Api.Migrations
{
    /// <inheritdoc />
    public partial class AjoutDescriptionImageProduit : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Description",
                table: "Produits",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ImagePath",
                table: "Produits",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Description",
                table: "Produits");

            migrationBuilder.DropColumn(
                name: "ImagePath",
                table: "Produits");
        }
    }
}
