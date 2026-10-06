using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Magasin.Api.Migrations
{
    /// <inheritdoc />
    public partial class AjoutImageProduit : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Description",
                table: "Produits");

            migrationBuilder.DropColumn(
                name: "ImagePath",
                table: "Produits");

            migrationBuilder.AddColumn<int>(
                name: "ImageId",
                table: "Produits",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Images",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Path = table.Column<string>(type: "text", nullable: false),
                    ContentType = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Images", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Produits_ImageId",
                table: "Produits",
                column: "ImageId");

            migrationBuilder.AddForeignKey(
                name: "FK_Produits_Images_ImageId",
                table: "Produits",
                column: "ImageId",
                principalTable: "Images",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Produits_Images_ImageId",
                table: "Produits");

            migrationBuilder.DropTable(
                name: "Images");

            migrationBuilder.DropIndex(
                name: "IX_Produits_ImageId",
                table: "Produits");

            migrationBuilder.DropColumn(
                name: "ImageId",
                table: "Produits");

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
    }
}
