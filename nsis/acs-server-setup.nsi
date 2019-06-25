;Include Modern UI

!include "MUI2.nsh"
!include "FileFunc.nsh"

!define PRODUCT_NAME "ACS Server"
!define PRODUCT_VERSION "1.0.0"
!define PRODUCT_PUBLISHER "iSAP Solution"
!define PRODUCT_URL "http://www.isapsolution.com"
!define PATH_OUT "Release"
!define ARP "Software\Microsoft\Windows\CurrentVersion\Uninstall\${PRODUCT_NAME}"
!define OUTPUT_NAME "acs-server-setup"

# define name of installer
!system 'md "${PATH_OUT}"'	
OutFile "${PATH_OUT}\${OUTPUT_NAME}-v${PRODUCT_VERSION}.exe"
Name "${PRODUCT_NAME} ${PRODUCT_VERSION}"

# define installation directory
InstallDir "$PROGRAMFILES64\${PRODUCT_NAME}"

!macro DoUninstall UN
Function ${UN}DeleteFoldersWithExclusion
    Exch $R0 ; exclude dir
    Exch
    Exch $R1 ; route dir
    Push $R2
    Push $R3
 
    ClearErrors
    FindFirst $R3 $R2 "$R1\*.*"
 
    Top:
        StrCmp $R2 "." Next
        StrCmp $R2 ".." Next
        StrCmp $R2 $R0 Next
        IfFileExists "$R1\$R2\*.*" Jump DeleteFile
    
    Jump:
        Push '$R1\$R2'
        Push '$R0'
        Call ${UN}DeleteFoldersWithExclusion
    
        Push "$R1\$R2" 
        Call ${UN}isEmptyDir
        Pop $0    
        StrCmp $0 1 RmD Next
    
    RmD:
        RMDir /r $R1\$R2
        Goto Next
    
    DeleteFile:
        Delete '$R1\$R2'
    
    Next:
        ClearErrors
        FindNext $R3 $R2
        IfErrors Exit
        Goto Top
    
    Exit:
        FindClose $R3
    
    Pop $R3
    Pop $R2
    Pop $R1
    Pop $R0
FunctionEnd

Function ${UN}isEmptyDir
    # Stack ->                    # Stack: <directory>
    Exch $0                       # Stack: $0
    Push $1                       # Stack: $1, $0
    FindFirst $0 $1 "$0\*.*"
    strcmp $1 "." 0 _notempty
        FindNext $0 $1
        strcmp $1 ".." 0 _notempty
        ClearErrors
        FindNext $0 $1
        IfErrors 0 _notempty
            FindClose $0
            Pop $1                  # Stack: $0
            StrCpy $0 1
            Exch $0                 # Stack: 1 (true)
            goto _end
        _notempty:
        FindClose $0
        Pop $1                   # Stack: $0
        StrCpy $0 0
        Exch $0                  # Stack: 0 (false)
    _end:
FunctionEnd


Function ${UN}DoUninstall
	#0, get old installation folder
	ReadRegStr $R1 HKLM "Software\${PRODUCT_NAME}" ""
	
	# first, delete the uninstaller
    Delete "$R1\uninstall.exe"
 
    # second, remove the link from the start menu
    # "$SMPROGRAMS\uninstall.lnk"
	# Delete "$SMPROGRAMS\${PRODUCT_NAME}"
	SetOutPath $R1
	# third, remove services	
	ExecWait '"uninstall.bat" /s'
	
	# now delete installed files	
  Push "$R1"
	Push "assets" 		;dir to exclude
	Call ${UN}DeleteFoldersWithExclusion
	
	# remove registry info
	DeleteRegKey HKLM "Software\${PRODUCT_NAME}"
	DeleteRegKey HKLM "${ARP}"
FunctionEnd
!macroend
!insertmacro DoUninstall "" 

	
Function .onInit

  ReadRegStr $R0 HKLM "${ARP}" "UninstallString"
  StrCmp $R0 "" done
 
  MessageBox MB_OKCANCEL|MB_ICONEXCLAMATION \
  "${PRODUCT_NAME} is already installed. $\n$\nClick `OK` to remove the \
  previous version or `Cancel` to cancel this upgrade." \
  IDOK uninst
  Abort
 
;Run the uninstaller
uninst:
  ClearErrors
  Call DoUninstall
 
  IfErrors no_remove_uninstaller done
    ;You can either use Delete /REBOOTOK in the uninstaller or add some code
    ;here to remove the uninstaller. Use a registry key to check
    ;whether the user has chosen to uninstall. If you are using an uninstaller
    ;components page, make sure all sections are uninstalled.
  no_remove_uninstaller:
 
done:
 
FunctionEnd




; request admin level
RequestExecutionLevel admin

AutoCloseWindow false
ShowInstDetails show
;--------------------------------
;Interface Settings

  !define MUI_ABORTWARNING

;--------------------------------
;Pages

  !insertmacro MUI_PAGE_LICENSE "License.txt"
  ;!insertmacro MUI_PAGE_COMPONENTS 
  
;Section "Run npm start before installing service" SEC01
	
;SectionEnd

  !insertmacro MUI_PAGE_DIRECTORY
  !insertmacro MUI_PAGE_INSTFILES
  
  !insertmacro MUI_UNPAGE_CONFIRM
  !insertmacro MUI_UNPAGE_INSTFILES
  


;--------------------------------
;Languages
 
  !insertmacro MUI_LANGUAGE "English"

;--------------------------------
;Installer Sections
Section
 
    # set the installation directory as the destination for the following actions
    SetOutPath $INSTDIR
    # create the uninstaller
    WriteUninstaller "$INSTDIR\uninstall.exe"
 
    # create a shortcut named "new shortcut" in the start menu programs directory
    # point the new shortcut at the program uninstaller
    # CreateShortCut "$SMPROGRAMS\uninstall.lnk" "$INSTDIR\uninstall.exe"
	
	# source code
	SetOutPath $INSTDIR
	File /r *.bat
	File /r /x .git /x .gitignore /x nsis ..\..\*.* 
	
	# intall mongo
	ExecWait '"install_mongo.bat" /s'
	
	;${If} ${SectionIsSelected} ${SEC01}		
  #run npm start for 1.5 minute	
  DetailPrint "run npm start for 1.5 minute"
		ExecDos::exec /TIMEOUT=90000 '"start.bat"'
  DetailPrint "finished run npm"	
	;${EndIf}
	
	# install service
	ExecWait '"install.bat" /s'
	
	;Store installation folder
	WriteRegStr HKLM "Software\${PRODUCT_NAME}" "" $INSTDIR
	WriteRegStr HKLM "${ARP}" "DisplayName" "${PRODUCT_NAME} (remove only)"
	WriteRegStr HKLM "${ARP}" "UninstallString" '"$INSTDIR\uninstall.exe"'
	WriteRegStr HKLM "${ARP}" "Publisher" "${PRODUCT_PUBLISHER}"
	WriteRegStr HKLM "${ARP}" "URLInfoAbout" "${PRODUCT_URL}"
	WriteRegStr HKLM "${ARP}" "DisplayVersion" "${PRODUCT_VERSION}"
		
	 ${GetSize} "$INSTDIR" "/S=0K" $0 $1 $2
	 IntFmt $0 "0x%08X" $0
	 WriteRegDWORD HKLM "${ARP}" "EstimatedSize" "$0"
	 
   MessageBox MB_YESNO|MB_ICONQUESTION "Reboot is required to complete installation, do you wish to reboot the system now?" IDNO +2
   Reboot
  
SectionEnd

UninstallText "This will uninstall ${PRODUCT_NAME}. Press uninstall to continue."
!insertmacro DoUninstall "un."

# uninstaller section start
Section "uninstall"
  Call un.DoUninstall  
  
  ExecWait 'net stop "ACS MongoDB"'
  ExecWait 'sc Delete "ACS MongoDB"'
# uninstaller section end
SectionEnd