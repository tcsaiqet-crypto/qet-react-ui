from pathlib import Path
path = Path("backend/src/api/fastapi_app.py")
content = path.read_text(encoding="utf-8")
start = content.find('<script type="text/babel">')
if start != -1:
    end = content.find('</script>', start)
    Path("jsx_block.txt").write_text(content[start:end+9], encoding="utf-8")
    print("Successfully wrote jsx_block.txt")
else:
    print("Not found")
