@echo off
cd /d "d:\TcsQET\qet-react-ui"
git add -A
git commit -m "feat: complete Spec 025 and Spec 026 implementation, design decisions, and agent subagents"
git push origin 1708:main --force
git push origin 1708 --force
echo DONE
pause
