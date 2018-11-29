!include "MUI2.nsh"
!define PRODUCT_NAME "VMS Server"
!define PRODUCT_VERSION "2.0.0"
!define MONGO "mongodb-win32-x86_64-enterprise-windows-64-3.6.3-signed.msi"
!define NODE "node-v8.11.3-x64.msi"
!define VCREDIST "vc_redist.x64.exe"
!define OUTPUT_NAME "vms-server-setup"  
# define installation directory
InstallDir "$TEMP\VMS\Temp"
OutFile "${OUTPUT_NAME}-v${PRODUCT_VERSION}-FULL.exe"
Name "${PRODUCT_NAME} ${PRODUCT_VERSION}"

; request admin level
RequestExecutionLevel admin

AutoCloseWindow true
;ShowInstDetails show
;--------------------------------
;Interface Settings

  !define MUI_ABORTWARNING

;--------------------------------
;Pages

  ;!insertmacro MUI_PAGE_LICENSE "License.txt"
  !insertmacro MUI_PAGE_COMPONENTS
 
Section "NodeJs v8.11.3-x64" SEC01

SectionEnd 
  
Section "MongoDb v3.6.3" SEC02
  
SectionEnd 

Section "MS Visual C++ Redist 2015 x64" SEC03
  
SectionEnd 

  
;Section "Install Mongo Db Service" SEC03

;SectionEnd 
  
  ;!insertmacro MUI_PAGE_DIRECTORY
  !insertmacro MUI_PAGE_INSTFILES
  
  !insertmacro MUI_UNPAGE_CONFIRM
  !insertmacro MUI_UNPAGE_INSTFILES
  


;--------------------------------
;Languages
 
  !insertmacro MUI_LANGUAGE "English"



;--------------------------------
;Installer Sections
Section
	;delete previous temp folder
	RMDir /r $INSTDIR
	
	SetOutPath $INSTDIR
	File "${OUTPUT_NAME}-v${PRODUCT_VERSION}.exe"

	SetOutPath $INSTDIR\Prerequisites
	${If} ${SectionIsSelected} ${SEC01}		
		File "Prerequisites\${NODE}"
		ExecWait 'msiexec /i "${NODE}"'
	${EndIf}
	
	${If} ${SectionIsSelected} ${SEC02}	
		File "Prerequisites\${MONGO}"
		ExecWait 'msiexec /i "${MONGO}"'
	${EndIf}
	
	${If} ${SectionIsSelected} ${SEC03}	
		File "Prerequisites\${VCREDIST}"
		ExecWait "${VCREDIST}"
	${EndIf}
	
	;delete Prerequisites
	RMDir /r $INSTDIR\Prerequisites
	
	;refresh path to enable npm
	Call RefreshProcessEnvironmentPath
	
	;run installer
    Exec "$INSTDIR\${OUTPUT_NAME}-v${PRODUCT_VERSION}.exe"	
SectionEnd


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
/*!ifndef KEY_READ
    !define KEY_READ 0x20019
!endif*/

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

