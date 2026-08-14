from pathlib import Path
path = Path("backend/src/api/fastapi_app.py")
content = path.read_text(encoding="utf-8")
start = content.find('<script type="text/babel">')
if start != -1:
    print(content[start:start+4000])
    print(content[start+4000:start+8000])
else:
    print("Not found")
