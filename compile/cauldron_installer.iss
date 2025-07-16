; cauldron_installer.iss
[Setup]
AppName=Cauldron CLI
AppVersion=0.0.2
DefaultDirName={pf}\Cauldron
DefaultGroupName=Cauldron
OutputBaseFilename=cauldron-installer
Compression=lzma
SolidCompression=yes
WizardStyle=modern
LicenseFile=../LICENSE

[Files]
Source: "cauldroncli.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "cauldronws.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "nssm.exe"; DestDir: "{app}"; Flags: ignoreversion


[Icons]
Name: "{group}\Cauldron CLI"; Filename: "{app}\cauldroncli.exe"
Name: "{group}\Uninstall Cauldron CLI"; Filename: "{uninstallexe}"

[Registry]
Root: HKCU; Subkey: "Environment"; ValueType: expandsz; ValueName: "Path"; ValueData: "{olddata};{app}"; Flags: preservestringtype

[Run]
Filename: "cmd.exe"; Parameters: "/C echo You may need to restart your computer or log out and back in to use 'cauldroncli' from the command line."; Flags: runhidden

; --- ADDITIONS FOR WEBSOCKET SERVER SERVICE ---
; 1. Install the service using nssm
Filename: "{app}\nssm.exe"; Parameters: "install CauldronWebSocketServer ""{app}\cauldronws.exe"""; WorkingDir: "{app}"; StatusMsg: "Installing Cauldron WebSocket Service..."; Flags: runhidden shellexec waituntilterminated

; 2. Configure NSSM to log stdout and stderr to files
;    Create a logs subdirectory
Filename: "cmd.exe"; Parameters: "/C mkdir ""{app}\logs"""; WorkingDir: "{app}"; Flags: runhidden waituntilterminated

;    Set stdout log file
Filename: "{app}\nssm.exe"; Parameters: "set CauldronWebSocketServer AppStdout ""{app}\logs\cauldronws_stdout.log"""; WorkingDir: "{app}"; Flags: runhidden shellexec waituntilterminated

;    Set stderr log file
Filename: "{app}\nssm.exe"; Parameters: "set CauldronWebSocketServer AppStderr ""{app}\logs\cauldronws_stderr.log"""; WorkingDir: "{app}"; Flags: runhidden shellexec waituntilterminated

;    Set stdout/stderr to append mode and rotate files (important!)
Filename: "{app}\nssm.exe"; Parameters: "set CauldronWebSocketServer AppRotateFiles 1"; WorkingDir: "{app}"; Flags: runhidden shellexec waituntilterminated
Filename: "{app}\nssm.exe"; Parameters: "set CauldronWebSocketServer AppRotateOnline 1"; WorkingDir: "{app}"; Flags: runhidden shellexec waituntilterminated
Filename: "{app}\nssm.exe"; Parameters: "set CauldronWebSocketServer AppRotateBytes 10485760"; WorkingDir: "{app}"; Flags: runhidden shellexec waituntilterminated
; Max 10MB per log file before rotation - This comment is now on its own line, or could be removed if you prefer.

; 3. Start the service
Filename: "{app}\nssm.exe"; Parameters: "start CauldronWebSocketServer"; WorkingDir: "{app}"; StatusMsg: "Starting Cauldron WebSocket Service..."; Flags: runhidden shellexec waituntilterminated

[UninstallRun]
; Remove the service when uninstalling
Filename: "{app}\nssm.exe"; Parameters: "remove CauldronWebSocketServer confirm"; WorkingDir: "{app}"; Flags: runhidden shellexec waituntilterminated