@echo off
:: Set task name
set "TASKNAME=UnifiedWinProgManager"

:: Delete the scheduled task without confirmation prompt
schtasks /Delete /TN "%TASKNAME%" /F