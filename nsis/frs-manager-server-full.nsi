!include "MUI2.nsh"

!define PRODUCT_NAME "FRS Manager Server"
!define PRODUCT_VERSION "1.00.03"
!define MONGO "mongodb-win32-x86_64-2008plus-ssl-3.6.7-rc1-signed.msi"
!define NODE "node-v8.12.0-x64.msi"
!define VCREDIST "vc_redist.x64.exe"
!define VCREDIST2010 "vcredist_x64.exe"
; !define NETFRAMEWORK "NDP452-KB2901907-x86-x64-AllOS-ENU.exe"
!define OUTPUT_NAME "frs-manager-server" 

InstallDir "$TEMP\FRS Manager\Temp"
OutFile "Release\${OUTPUT_NAME}-v${PRODUCT_VERSION}-FULL.exe"
Name "${PRODUCT_NAME} ${PRODUCT_VERSION}"

RequestExecutionLevel admin

AutoCloseWindow true
; ShowInstDetails show


; --------------------------------
; Interface Settings
!define MUI_ABORTWARNING


; --------------------------------
; Pages
; !insertmacro MUI_PAGE_LICENSE "License.txt"
!insertmacro MUI_PAGE_COMPONENTS

; Section ".NET Framework 4.5.2" SEC00
  
; SectionEnd 
  
Section "NodeJs v8.12.0-x64" SEC01

SectionEnd 
  
Section "MongoDb v3.6.7" SEC02
  
SectionEnd 

Section "MS Visual C++ Redist 2015 x64" SEC03
  
SectionEnd 

Section "MS Visual C++ Redist 2010 x64" SEC04
  
SectionEnd 

; !insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES

!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES


; --------------------------------
; Languages
!insertmacro MUI_LANGUAGE "English"


; --------------------------------
; Installer Sections
Section
	RMDir /r $INSTDIR\Release
	
	SetOutPath $INSTDIR\Release
	File "Release\${OUTPUT_NAME}-v${PRODUCT_VERSION}.exe"

	SetOutPath $INSTDIR\Release\Prerequisites
	
	; ${If} ${SectionIsSelected} ${SEC00}	
	; 	File "Release\Prerequisites\${NETFRAMEWORK}"
	; 	ExecWait "${NETFRAMEWORK}"
	; ${EndIf}
	
	${If} ${SectionIsSelected} ${SEC01}		
		File "Release\Prerequisites\${NODE}"
		ExecWait 'msiexec /i "${NODE}"'
	${EndIf}
	
	${If} ${SectionIsSelected} ${SEC02}	
		File "Release\Prerequisites\${MONGO}"
		ExecWait 'msiexec /i "${MONGO}"'
	${EndIf}
	
	${If} ${SectionIsSelected} ${SEC03}	
		File "Release\Prerequisites\${VCREDIST}"
		ExecWait "${VCREDIST}"
	${EndIf}

	${If} ${SectionIsSelected} ${SEC04}	
		File "Release\Prerequisites\${VCREDIST2010}"
		ExecWait "${VCREDIST2010}"
	${EndIf}

	RMDir /r $INSTDIR\Release\Prerequisites
	
	Call RefreshProcessEnvironmentPath

    Exec "$INSTDIR\Release\${OUTPUT_NAME}-v${PRODUCT_VERSION}.exe"	
SectionEnd


; --------------------------------
; 
!include LogicLib.nsh
!include WinCore.nsh
!ifndef NSIS_CHAR_SIZE
    !define NSIS_CHAR_SIZE 1
    !define SYSTYP_PTR i
!else
    !define SYSTYP_PTR p
!endif
!ifndef ERROR_MORE_DATA
    !define ERROR_MORE_DATA 234
!endif


; --------------------------------
; 
Function RegReadExpandStringAlloc
    System::Store S
    Pop $R2 ; reg value
    Pop $R3 ; reg path
    Pop $R4 ; reg hkey
    System::Alloc 1 ; mem
    StrCpy $3 0 ; size

    loop:
        System::Call 'SHLWAPI::SHGetValue(${SYSTYP_PTR}R4,tR3,tR2,i0,${SYSTYP_PTR}sr2,*ir3r3)i.r0' ; NOTE: Requires SHLWAPI 4.70 (IE 3.01+ / Win95OSR2+)
        ${If} $0 = 0
            Push $2
            Push $0
        ${Else}
            System::Free $2
            ${If} $0 = ${ERROR_MORE_DATA}
                IntOp $3 $3 + ${NSIS_CHAR_SIZE} ; Make sure there is room for SHGetValue to \0 terminate
                System::Alloc $3
                Goto loop
            ${Else}
                Push $0
            ${EndIf}
        ${EndIf}
    System::Store L
FunctionEnd


; --------------------------------
; 
Function RefreshProcessEnvironmentPath
    System::Store S
    Push ${HKEY_CURRENT_USER}
    Push "Environment"
    Push "Path"
    Call RegReadExpandStringAlloc
    Pop $0

    ${IfThen} $0 <> 0 ${|} System::Call *(i0)${SYSTYP_PTR}.s ${|}
    Pop $1
    Push ${HKEY_LOCAL_MACHINE}
    Push "SYSTEM\CurrentControlSet\Control\Session Manager\Environment"
    Push "Path"
    Call RegReadExpandStringAlloc
    Pop $0

    ${IfThen} $0 <> 0 ${|} System::Call *(i0)${SYSTYP_PTR}.s ${|}
    Pop $2
    System::Call 'KERNEL32::lstrlen(t)(${SYSTYP_PTR}r1)i.R1'
    System::Call 'KERNEL32::lstrlen(t)(${SYSTYP_PTR}r2)i.R2'
    System::Call '*(&t$R2 "",&t$R1 "",i)${SYSTYP_PTR}.r0' ; The i is 4 bytes, enough for a ';' separator and a '\0' terminator (Unicode)
    StrCpy $3 ""

    ${If} $R1 <> 0
    ${AndIf} $R2 <> 0
        StrCpy $3 ";"
    ${EndIf}

    System::Call 'USER32::wsprintf(${SYSTYP_PTR}r0,t"%s%s%s",${SYSTYP_PTR}r2,tr3,${SYSTYP_PTR}r1)?c'
    System::Free $1
    System::Free $2
    System::Call 'KERNEL32::SetEnvironmentVariable(t"PATH",${SYSTYP_PTR}r0)'
    System::Free $0
    System::Store L
FunctionEnd
