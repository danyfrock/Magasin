using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Magasin.Api.Database.Entities
{
    public class Utilisateur
    {
        public int Id { get; set; }
        
        public string Username { get; set; } = string.Empty;
        
        public string PasswordHash { get; set; } = string.Empty;
        
        public string Role { get; set; } = "Admin";
        
        public bool DoitChangerMotDePasse { get; set; } = true;
    }
}