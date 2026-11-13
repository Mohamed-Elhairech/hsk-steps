@echo off
rem Double-click this file to run the website on your computer (Windows).
rem It serves this folder only, and only to this computer.
title HSK Steps
cd /d "%~dp0"

set PY=
python --version >nul 2>nul && set PY=python
if not defined PY py --version >nul 2>nul && set PY=py
if not defined PY python3 --version >nul 2>nul && set PY=python3

if not defined PY (
  echo.
  echo Python is not installed on this computer.
  echo 1. Download Python from https://www.python.org/downloads/  ^(opening it now^)
  echo 2. Run the installer and TICK "Add python.exe to PATH" on the first screen.
  echo 3. Double-click start-site.bat again.
  start "" https://www.python.org/downloads/
  echo.
  pause
  exit /b 1
)

%PY% tools\serve.py
if errorlevel 1 pause
