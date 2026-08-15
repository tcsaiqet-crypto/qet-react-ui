from pathlib import Path
path = Path("backend/src/api/fastapi_app.py")
content = path.read_text(encoding="utf-8")
for line in content.splitlines():
    if line.startswith("@app.") or "def " in line:
        print(line)
