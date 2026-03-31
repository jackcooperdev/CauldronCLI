; --------------------------------
; Basic App Info
; --------------------------------
Name "CauldronCLI"
OutFile "dist\cauldroncli-setup.exe"
InstallDir "$PROGRAMFILES\CauldronCLI"
RequestExecutionLevel admin

; --------------------------------
; Pages
; --------------------------------
Page directory
Page instfiles
UninstPage uninstConfirm
UninstPage instfiles

; --------------------------------
; Variables
; --------------------------------
Var StartMenuFolder

; --------------------------------
; Install Section
; --------------------------------
Section "Install"

  SetOutPath "$INSTDIR"

  ; Copy binary
  File "dist\cauldroncli.exe"

  ; -------- Add to PATH (SYSTEM) --------
  ReadRegStr $0 HKLM "SYSTEM\CurrentControlSet\Control\Session Manager\Environment" "Path"
  StrCpy $0 "$0;$INSTDIR"
  WriteRegExpandStr HKLM "SYSTEM\CurrentControlSet\Control\Session Manager\Environment" "Path" "$0"

  ; Notify system
  System::Call 'Kernel32::SetEnvironmentVariable(t, t) i("Path", "$0")'

  ; -------- Start Menu Shortcut --------
  CreateDirectory "$SMPROGRAMS\CauldronCLI"
  CreateShortcut "$SMPROGRAMS\CauldronCLI\CauldronCLI.lnk" "$INSTDIR\cauldroncli.exe"

  ; -------- Uninstaller --------
  WriteUninstaller "$INSTDIR\uninstall.exe"

SectionEnd

; --------------------------------
; Uninstall Section
; --------------------------------
Section "Uninstall"

  ; -------- Remove from PATH --------
  ReadRegStr $0 HKLM "SYSTEM\CurrentControlSet\Control\Session Manager\Environment" "Path"
  Push $0
  Push "$INSTDIR"
  Call un.RemoveFromPath

  Pop $0
  WriteRegExpandStr HKLM "SYSTEM\CurrentControlSet\Control\Session Manager\Environment" "Path" "$0"

  ; Notify system
  System::Call 'Kernel32::SetEnvironmentVariable(t, t) i("Path", "$0")'

  ; -------- Remove files --------
  Delete "$INSTDIR\cauldroncli.exe"
  Delete "$INSTDIR\uninstall.exe"
  RMDir "$INSTDIR"

  ; -------- Remove Start Menu --------
  Delete "$SMPROGRAMS\CauldronCLI\CauldronCLI.lnk"
  RMDir "$SMPROGRAMS\CauldronCLI"

SectionEnd

; --------------------------------
; Helper: Remove from PATH
; --------------------------------
Function un.RemoveFromPath
  Exch $1 ; path to remove
  Exch
  Exch $0 ; original PATH

  Push $2
  Push $3

  StrCpy $2 ""
loop:
  StrCpy $3 $0 1
  StrCmp $3 "" done

  ; split by ;
  StrCpy $3 $0 "" ";"
  StrCmp $3 $1 skip

  StrCmp $2 "" 0 +2
  StrCpy $2 "$3"
  StrCmp $2 "" 0 +2
  StrCpy $2 "$2;$3"

skip:
  StrLen $3 $3
  IntOp $3 $3 + 1
  StrCpy $0 $0 "" $3
  Goto loop

done:
  Pop $3
  Pop $2
  Push $2
FunctionEnd