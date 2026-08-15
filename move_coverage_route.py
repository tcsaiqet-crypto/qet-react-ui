from pathlib import Path

path = Path("backend/src/api/fastapi_app.py")
content = path.read_text(encoding="utf-8")

# Let's remove the coverage route from its current position
coverage_marker = '@app.get("/api/v1/runs/{run_id}/coverage")'
idx = content.find(coverage_marker)

if idx != -1:
    # Find the next route or HTMLResponse definition
    next_idx = content.find('@app.get("/", response_class=HTMLResponse)', idx)
    coverage_code = content[idx:next_idx].strip()
    
    # Remove from content
    content = content.replace(content[idx:next_idx], "")
    
    # Insert it right before "from fastapi.staticfiles import StaticFiles"
    insert_marker = "from fastapi.staticfiles import StaticFiles"
    content = content.replace(insert_marker, coverage_code + "\n\n" + insert_marker)
    
    path.write_text(content, encoding="utf-8")
    print("Successfully moved coverage route definition before StaticFiles mount.")
else:
    print("Coverage route not found to move.")
