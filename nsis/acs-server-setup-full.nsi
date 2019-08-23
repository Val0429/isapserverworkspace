!include "MUI2.nsh"
!define PRODUCT_NAME "ACS Server"
!define PRODUCT_VERSION "1.0.0"
!define MONGO "mongodb-win32-x86_64-enterprise-windows-64-3.6.3.exe"
!define NODE "node-v8.12.0-x64.msi"
!define VCREDIST "vc_redist.x64.exe"
!define VCREDIST2010 "vcredist_x64.exe"
!define NETFRAMEWORK "NDP452-KB2901907-x86-x64-AllOS-ENU.exe"
!define MSACCESS_DB_ENGINE "AccessDatabaseEngine.exe";
!define OUTPUT_NAME "acs-server-setup"  
# define installation directory
InstallDir "$TEMP\ACS\Temp"
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

Section ".NET Framework 4.5.2" SEC00
  
SectionEnd 
  
Section "NodeJs v8.12.0-x64" SEC01

SectionEnd 
  
Section "MongoDb v3.6.3" SEC02
  
SectionEnd 

Section "Access Database Engine (x86)" SEC05
  
SectionEnd 

;Section "MS Visual C++ Redist 2015 x64" SEC03
  
;SectionEnd 

Section "MS Visual C++ Redist 2010 x64" SEC04
  
SectionEnd 
  
  
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
	
	${If} ${SectionIsSelected} ${SEC00}	
		File "Prerequisites\${NETFRAMEWORK}"
		ExecWait "${NETFRAMEWORK}"
	${EndIf}
	
	${If} ${SectionIsSelected} ${SEC01}		
		File "Prerequisites\${NODE}"
		ExecWait 'msiexec /i "${NODE}"'
	${EndIf}
	
	${If} ${SectionIsSelected} ${SEC02}	
		File "Prerequisites\${MONGO}"
		ExecWait "${MONGO}"
	${EndIf}
	
	;${If} ${SectionIsSelected} ${SEC03}	
	;	File "Prerequisites\${VCREDIST}"
	;	ExecWait "${VCREDIST}"
	;${EndIf}
	${If} ${SectionIsSelected} ${SEC04}	
		File "Prerequisites\${VCREDIST2010}"
		ExecWait "${VCREDIST2010}"
	${EndIf}

	${If} ${SectionIsSelected} ${SEC05}	
		File "Prerequisites\${MSACCESS_DB_ENGINE}"
		ExecWait "${MSACCESS_DB_ENGINE}"
	${EndIf}
	;delete Prerequisites
	;RMDir /r $INSTDIR\Prerequisites
	
	# check if previously installed
	ReadRegStr $R1 HKLM "Software\${PRODUCT_NAME}" ""
	DetailPrint $R1	
	StrCmp $R1 "" 0 runit
	
	;refresh path to enable npm and mongodb
	WriteRegStr "HKLM" "SOFTWARE\Microsoft\Windows\CurrentVersion\RunOnce" "${PRODUCT_NAME}" "$INSTDIR\${OUTPUT_NAME}-v${PRODUCT_VERSION}.exe"
	
	MessageBox MB_YESNO|MB_ICONQUESTION "Installation will continue after reboot, do you wish to reboot the system now?" IDNO bye
	Reboot
	
	runit:
		Exec "$INSTDIR\${OUTPUT_NAME}-v${PRODUCT_VERSION}.exe"		
	bye:

SectionEnd

