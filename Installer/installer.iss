; ============================================================
;  Magasin - Installateur complet
; ============================================================

#define MyAppName "Magasin"
#define MyAppVersion "1.0"
#define MyAppPublisher "Dany"
#define MyAppExeName "Magasin.Api.exe"

[Setup]
AppId={{A1B2C3D4-E5F6-7890-ABCD-EF1234567890}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
DefaultDirName={autopf}\{#MyAppName}
DefaultGroupName={#MyAppName}
DisableProgramGroupPage=yes
OutputDir=output
OutputBaseFilename=InstallMagasin
Compression=lzma
SolidCompression=yes
WizardStyle=modern
PrivilegesRequired=admin
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible
UninstallDisplayIcon={app}\{#MyAppExeName}

[Languages]
Name: "french"; MessagesFile: "compiler:Languages\French.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked

[Files]
; Application
Source: "resources\MagasinPublish\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

; PostgreSQL - on le met en dontcopy pour l'extraire manuellement au bon moment
Source: "resources\postgresql-18.6-5-windows-x64.exe"; DestDir: "{tmp}"; Flags: deleteafterinstall dontcopy

[Icons]
Name: "{group}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; WorkingDir: "{app}"
Name: "{group}\{cm:UninstallProgram,{#MyAppName}}"; Filename: "{uninstallexe}"
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; WorkingDir: "{app}"; Tasks: desktopicon

[Run]
Filename: "{app}\{#MyAppExeName}"; Description: "Lancer Magasin"; Flags: nowait postinstall skipifsilent

[Code]
var
  GeneratedPassword: String;

function GeneratePassword: String;
var
  Chars: String;
  i, idx: Integer;
begin
  Chars := 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  Result := '';
  for i := 1 to 24 do
  begin
    idx := Random(Length(Chars)) + 1;
    Result := Result + Copy(Chars, idx, 1);
  end;
end;

function WriteSecretFile(const AppDir, Password: String): Boolean;
var
  SecretPath, Content: String;
begin
  SecretPath := AppDir + '\magasin.secret.json';
  Content := '{' + #13#10 +
             '  "ConnectionStrings:Magasin": "Host=localhost;Port=5432;Database=magasin;Username=postgres;Password=' + Password + '"' + #13#10 +
             '}';
  Result := SaveStringToFile(SecretPath, Content, False);
end;

function InstallPostgreSQL(const Password: String): Boolean;
var
  ResultCode: Integer;
  PgInstaller, Params: String;
begin
  // Extraction manuelle du fichier (parce qu'on a mis dontcopy)
  ExtractTemporaryFile('postgresql-18.6-5-windows-x64.exe');

  PgInstaller := ExpandConstant('{tmp}\postgresql-18.6-5-windows-x64.exe');

  if not FileExists(PgInstaller) then
  begin
    Log('ERREUR : fichier PostgreSQL toujours introuvable après ExtractTemporaryFile');
    Result := False;
    Exit;
  end;

  Log('Fichier PostgreSQL extrait : ' + PgInstaller);

  Params := '--mode unattended' +
            ' --unattendedmodeui none' +
            ' --superpassword ' + Password +
            ' --serverport 5432' +
            ' --servicename postgresql-magasin' +
            ' --prefix "C:\Program Files\PostgreSQL\18"' +
            ' --datadir "C:\Program Files\PostgreSQL\18\data"' +
            ' --enable-components server,commandlinetools' +
            ' --disable-components pgAdmin,stackbuilder';

  Log('Paramètres : ' + Params);

  if not Exec(PgInstaller, Params, '', SW_SHOW, ewWaitUntilTerminated, ResultCode) then
  begin
    Log('Exec a échoué (CreateProcess)');
    Result := False;
    Exit;
  end;

  Log('Code de retour PostgreSQL : ' + IntToStr(ResultCode));

  if ResultCode <> 0 then
  begin
    Result := False;
    Exit;
  end;

  Log('Attente démarrage service PostgreSQL (15s)...');
  Sleep(15000);
  Result := True;
end;

function CreateDatabase(const Password: String): Boolean;
var
  ResultCode: Integer;
  Psql, Cmd: String;
begin
  Psql := 'C:\Program Files\PostgreSQL\18\bin\psql.exe';

  if not FileExists(Psql) then
  begin
    Log('psql.exe introuvable après installation');
    Result := False;
    Exit;
  end;

  Cmd := '/c set PGPASSWORD=' + Password + '&& "' + Psql + '" -U postgres -c "CREATE DATABASE magasin;"';
  Exec('cmd.exe', Cmd, '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
  Log('Création base - code : ' + IntToStr(ResultCode));
  Result := True;
end;

function NextButtonClick(CurPageID: Integer): Boolean;
begin
  Result := True;

  if CurPageID = wpReady then
  begin
    GeneratedPassword := GeneratePassword;
    Log('Mot de passe généré : ' + GeneratedPassword);

    if not InstallPostgreSQL(GeneratedPassword) then
    begin
      MsgBox('Échec de l''installation de PostgreSQL.' + #13#10 +
             'Voir le log pour plus de détails.', mbError, MB_OK);
      Result := False;
      Exit;
    end;

    CreateDatabase(GeneratedPassword);
  end;
end;

procedure CurStepChanged(CurStep: TSetupStep);
begin
  if CurStep = ssPostInstall then
  begin
    if WriteSecretFile(ExpandConstant('{app}'), GeneratedPassword) then
      Log('magasin.secret.json écrit avec succès')
    else
      Log('ERREUR écriture secret');
  end;
end;