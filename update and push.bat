@echo off
cd C:\Users\VISION\Desktop\950-star.github.io
node update-index.js
git add .
set /p commitMessage=Enter commit message: 
git commit -m "%commitMessage%"
git push origin main
echo Changes have been pushed to GitHub!
pause