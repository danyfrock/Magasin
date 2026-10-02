using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Magasin.Api.Migrations
{
    /// <inheritdoc />
    public partial class CodeBarreSequence : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateSequence(
                name: "CodeBarreSequence",
                startValue: 200000000001L);

            migrationBuilder.AlterColumn<string>(
                name: "CodeBarre",
                table: "Produits",
                type: "text",
                nullable: false,
                defaultValueSql: "nextval('\"CodeBarreSequence\"')::text",
                oldClrType: typeof(string),
                oldType: "text");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropSequence(
                name: "CodeBarreSequence");

            migrationBuilder.AlterColumn<string>(
                name: "CodeBarre",
                table: "Produits",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text",
                oldDefaultValueSql: "nextval('\"CodeBarreSequence\"')::text");
        }
    }
}
