Outfile "CauldronInstaller.exe"
InstallDir "$PROGRAMFILES\Cauldron"

RequestExecutionLevel admin

Page directory
Page instfiles

Section "Install"

  SetOutPath "$INSTDIR"

  ; Copy files
  File "dist\cauldroncli.exe"
  File "dist\cauldronws.exe"
  File "dist\cauldronws-service.exe"
  File "dist\cauldronws.xml"

  ; Install service
  ExecWait '"$INSTDIR\cauldronws-service.exe" install'
  ExecWait '"$INSTDIR\cauldronws-service.exe" start'

  ; Add CLI to PATH
  ReadRegStr $0 HKLM "SYSTEM\CurrentControlSet\Control\Session Manager\Environment" "Path"
  StrCpy $0 "$0;$INSTDIR"
  WriteRegExpandStr HKLM "SYSTEM\CurrentControlSet\Control\Session Manager\Environment" "Path" $0

SectionEnd