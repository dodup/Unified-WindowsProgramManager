@echo off
setlocal enabledelayedexpansion

:: Set task name
set "TASKNAME=UnifiedWinProgManager"

:: Get full path of this .bat file's directory
set "scriptDir=%~dp0"
set "scriptDir=%scriptDir:~0,-1%"

:: Set paths
set "NODE_PATH=C:\Program Files\Siemens\Automation\WinCCUnified\WebRH\bin\node.exe"
set "JS_PATH=%scriptDir%\WinProgManager.js"
set "VBS_PATH=%scriptDir%\launch-wrapper.vbs"
set "PS1_PATH=%scriptDir%\launch-silent.ps1"

:: Create the .vbs file that launches the PowerShell script silently
(
    echo Set objShell = CreateObject^( "WScript.Shell" ^)
    echo objShell.Run "powershell.exe -ExecutionPolicy Bypass -File ""%PS1_PATH%""", 0, False
) > "%VBS_PATH%"

if exist "%VBS_PATH%" (
    echo VBS file created at: %VBS_PATH%
) else (
    echo Failed to create VBS file.
    pause
    exit /b 1
)

:: Create the .ps1 file with dynamic paths
echo # Path to your script > "%PS1_PATH%"
echo $scriptPath = "%JS_PATH%" >> "%PS1_PATH%"
echo. >> "%PS1_PATH%"
echo # Kill only the node.exe processes running that exact script >> "%PS1_PATH%"
echo Get-CimInstance Win32_Process -Filter "Name = 'node.exe'" ^| >> "%PS1_PATH%"
echo     Where-Object { $_.CommandLine -like "*`"$scriptPath`"*" } ^| >> "%PS1_PATH%"
echo     ForEach-Object { Stop-Process -Id $_.ProcessId -Force } >> "%PS1_PATH%"
echo. >> "%PS1_PATH%"
echo # Launch new instance (run hidden) >> "%PS1_PATH%"
echo Start-Process -FilePath "%NODE_PATH%" -ArgumentList "`"$scriptPath`"" -WindowStyle Hidden >> "%PS1_PATH%"

if exist "%PS1_PATH%" (
    echo PS1 file created at: %PS1_PATH%
) else (
    echo Failed to create PS1 file.
    pause
    exit /b 1
)

:: Create Scheduled Task
schtasks /Create /TN "%TASKNAME%" /TR "\"wscript.exe\" \"%VBS_PATH%\"" /SC MINUTE /MO 1 /F

:: Run the task immediately
schtasks /Run /TN "%TASKNAME%"

echo Task %TASKNAME% created and launched successfully.
pause
