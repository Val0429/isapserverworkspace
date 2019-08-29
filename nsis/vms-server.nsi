!include "MUI2.nsh"
!include "FileFunc.nsh"

!define PRODUCT_NAME "VMS Server"
!define PRODUCT_VERSION "3.01.10"
!define PRODUCT_PUBLISHER "iSap Solution" 
!define PRODUCT_URL "http://www.isapsolution.com"
!define PATH_OUT "Release"
!define ARP "Software\Microsoft\Windows\CurrentVersion\Uninstall\${PRODUCT_NAME}"
!define OUTPUT_NAME "vms-server"

!system 'md "${PATH_OUT}"'	
OutFile "${PATH_OUT}\${OUTPUT_NAME}-v${PRODUCT_VERSION}.exe"
Name "${PRODUCT_NAME} ${PRODUCT_VERSION}"

InstallDir "$PROGRAMFILES64\VMS"

RequestExecutionLevel admin

AutoCloseWindow false
ShowInstDetails show


; --------------------------------
; 
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
    Delete "$INSTDIR\uninstall.exe"

	SetOutPath $INSTDIR

	ExecWait '"uninstall.bat" /s'

	Push "$INSTDIR"
	Push "assets" 		;dir to exclude
	Call ${UN}DeleteFoldersWithExclusion

	DeleteRegKey HKLM "Software\${PRODUCT_NAME}"
	DeleteRegKey HKLM "${ARP}"
FunctionEnd
!macroend
!insertmacro DoUninstall "" 

	
; --------------------------------
; 
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


; --------------------------------
; Interface Settings
!define MUI_ABORTWARNING


; --------------------------------
; Pages
!insertmacro MUI_PAGE_LICENSE "License.txt"
!insertmacro MUI_PAGE_COMPONENTS 

!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES

!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
  

; --------------------------------
; Languages
!insertmacro MUI_LANGUAGE "English"


; --------------------------------
; Installer Sections
Section
    SetOutPath $INSTDIR

    WriteUninstaller "$INSTDIR\uninstall.exe"

	SetOutPath $INSTDIR
	File /r *.bat
	File /r /x license.xml /x .git /x logs /x .gitignore /x assets /x nsis ..\..\*.* 

    CreateDirectory $INSTDIR\logs
	
	ExecWait '"install_mongo.bat" /s'
	
	ExecWait '"install.bat" /s'
	
	WriteRegStr HKLM "Software\${PRODUCT_NAME}" "" $INSTDIR
	WriteRegStr HKLM "${ARP}" "DisplayName" "${PRODUCT_NAME} (remove only)"
	WriteRegStr HKLM "${ARP}" "UninstallString" '"$INSTDIR\uninstall.exe"'
	WriteRegStr HKLM "${ARP}" "Publisher" "${PRODUCT_PUBLISHER}"
	WriteRegStr HKLM "${ARP}" "URLInfoAbout" "${PRODUCT_URL}"
	WriteRegStr HKLM "${ARP}" "DisplayVersion" "${PRODUCT_VERSION}"
		
    ${GetSize} "$INSTDIR" "/S=0K" $0 $1 $2
    IntFmt $0 "0x%08X" $0
    WriteRegDWORD HKLM "${ARP}" "EstimatedSize" "$0"
SectionEnd


; --------------------------------
; 
UninstallText "This will uninstall ${PRODUCT_NAME}. Press uninstall to continue."
!insertmacro DoUninstall "un."


; --------------------------------
; 
Section "uninstall"
    Call un.DoUninstall  
SectionEnd
