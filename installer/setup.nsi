!define APP_NAME "CauldronCLI"
!define APP_EXE "cauldroncli.exe"
!define आउट "CauldronCLI-Setup.exe"

Outfile "CauldronCLI-Setup.exe"
InstallDir "$PROGRAMFILES\CauldronCLI"
RequestExecutionLevel admin

Section "Install"

  SetOutPath $INSTDIR
  File "..\dist\${APP_EXE}"

  ; Add to PATH (system-wide)
  EnVar::AddValue "PATH" "$INSTDIR"

  WriteUninstaller "$INSTDIR\uninstall.exe"

SectionEnd

Section "Uninstall"

  Delete "$INSTDIR\${APP_EXE}"
  Delete "$INSTDIR\uninstall.exe"
  RMDir "$INSTDIR"

SectionEnd