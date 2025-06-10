; cauldron_installer.iss
[Setup]
AppName=Cauldron CLI
AppVersion=0.0.1
DefaultDirName={pf}\Cauldron
DefaultGroupName=Cauldron
OutputBaseFilename=cauldron-installer
Compression=lzma
SolidCompression=yes
WizardStyle=modern
LicenseFile=../LICENSE

[Files]
Source: "cauldroncli.exe"; DestDir: "{app}"; Flags: ignoreversion


[Icons]
Name: "{group}\Cauldron CLI"; Filename: "{app}\cauldroncli.exe"
Name: "{group}\Uninstall Cauldron CLI"; Filename: "{uninstallexe}"

[Registry]
Root: HKCU; Subkey: "Environment"; ValueType: expandsz; ValueName: "Path"; ValueData: "{olddata};{app}"; Flags: preservestringtype

[Run]
Filename: "cmd.exe"; Parameters: "/C echo You may need to restart your computer or log out and back in to use 'cauldroncli' from the command line."; Flags: runhidden

