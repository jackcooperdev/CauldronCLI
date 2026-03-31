; installer.nsi
; Replace YOUR_APP_NAME with your package.json name

!define APP_NAME "YOUR_APP_NAME"
!define APP_VERSION "1.0.0"
!define SERVICE_NAME "${APP_NAME}-ws"
!define INSTALL_DIR "$PROGRAMFILES64\${APP_NAME}"
!define NODE_BINARY "node.exe"

Name "${APP_NAME} ${APP_VERSION}"
OutFile "dist\${APP_NAME}-setup.exe"
InstallDir "${INSTALL_DIR}"
RequestExecutionLevel admin
Unicode True

; Modern UI
!include "MUI2.nsh"
!include "LogicLib.nsh"

!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES

!insertmacro MUI_LANGUAGE "English"

; ─── Install ──────────────────────────────────────────────────────────────────
Section "MainSection" SEC01

    SetOutPath "${INSTALL_DIR}"

    ; Core files
    File "dist\cli.cjs"
    File "dist\ws.cjs"

    ; Bundled Node.js
    File "tools\node.exe"

    ; NSSM
    File "tools\nssm.exe"

    ; Write a .cmd shim so the CLI is callable by name from PATH
    FileOpen $0 "$INSTDIR\${APP_NAME}.cmd" w
    FileWrite $0 '@echo off$\r$\n'
    FileWrite $0 '"$INSTDIR\${NODE_BINARY}" "$INSTDIR\cli.cjs" %*$\r$\n'
    FileClose $0

    ; Add install dir to system PATH
    EnVar::AddValue "PATH" "$INSTDIR"

    ; Stop service if already running (upgrade scenario)
    ExecWait '"$INSTDIR\nssm.exe" stop "${SERVICE_NAME}"' $0

    ; Install / re-install the WebSocket service via NSSM
    ExecWait '"$INSTDIR\nssm.exe" install "${SERVICE_NAME}" "$INSTDIR\${NODE_BINARY}" "$INSTDIR\ws.cjs"' $0
    ExecWait '"$INSTDIR\nssm.exe" set "${SERVICE_NAME}" DisplayName "${APP_NAME} WebSocket Server"' $0
    ExecWait '"$INSTDIR\nssm.exe" set "${SERVICE_NAME}" Description "WebSocket server for ${APP_NAME}"' $0
    ExecWait '"$INSTDIR\nssm.exe" set "${SERVICE_NAME}" Start SERVICE_AUTO_START' $0
    ExecWait '"$INSTDIR\nssm.exe" set "${SERVICE_NAME}" AppStdout "$INSTDIR\ws.log"' $0
    ExecWait '"$INSTDIR\nssm.exe" set "${SERVICE_NAME}" AppStderr "$INSTDIR\ws-error.log"' $0
    ExecWait '"$INSTDIR\nssm.exe" start "${SERVICE_NAME}"' $0

    ; Write uninstaller
    WriteUninstaller "$INSTDIR\Uninstall.exe"

    ; Add to Add/Remove Programs
    WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}" \
        "DisplayName" "${APP_NAME}"
    WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}" \
        "UninstallString" "$INSTDIR\Uninstall.exe"
    WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}" \
        "DisplayVersion" "${APP_VERSION}"

SectionEnd

; ─── Uninstall ────────────────────────────────────────────────────────────────
Section "Uninstall"

    ; Stop and remove the service
    ExecWait '"$INSTDIR\nssm.exe" stop "${SERVICE_NAME}"' $0
    ExecWait '"$INSTDIR\nssm.exe" remove "${SERVICE_NAME}" confirm' $0

    ; Remove from PATH
    EnVar::DeleteValue "PATH" "$INSTDIR"

    ; Delete files
    Delete "$INSTDIR\cli.cjs"
    Delete "$INSTDIR\ws.cjs"
    Delete "$INSTDIR\${NODE_BINARY}"
    Delete "$INSTDIR\nssm.exe"
    Delete "$INSTDIR\${APP_NAME}.cmd"
    Delete "$INSTDIR\ws.log"
    Delete "$INSTDIR\ws-error.log"
    Delete "$INSTDIR\Uninstall.exe"
    RMDir "$INSTDIR"

    ; Remove from Add/Remove Programs
    DeleteRegKey HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}"

SectionEnd
