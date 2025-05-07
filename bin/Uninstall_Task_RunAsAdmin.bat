@echo off
:: Set task name and process name
set "TASKNAME=UnifiedWinProgManager"
set "PROCNAME=Unified-WinProgManager.exe"

:: Get the directory of the current script
set "SCRIPT_DIR=%~dp0"

:: Kill the process if it's running
taskkill /IM "%PROCNAME%" /F >nul 2>&1

:: Delete the scheduled task
schtasks /Delete /TN "%TASKNAME%" /F >nul 2>&1

:: Delete specific files in the same folder
del "%SCRIPT_DIR%launch-silent.ps1" >nul 2>&1
del "%SCRIPT_DIR%launch-wrapper.vbs" >nul 2>&1

echo Task, process, and files cleaned up.
