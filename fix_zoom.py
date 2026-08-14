from pathlib import Path

path = Path("backend/src/api/fastapi_app.py")
content = path.read_text(encoding="utf-8")

# Replace viewport meta tag to explicitly support zoom in and out
old_meta = '<meta name="viewport" content="width=device-width, initial-scale=1.0" />'
new_meta = '<meta name="viewport" content="width=device-width, initial-scale=1.0, minimum-scale=0.5, maximum-scale=5.0, user-scalable=yes" />'

if old_meta in content:
    content = content.replace(old_meta, new_meta)
    print("Viewport tag updated for zoom-in/zoom-out support.")
else:
    # Also check if it's already updated or has different spacing
    print("Meta tag not found, searching with regex or manual replacement")
    content = content.replace('name="viewport" content="width=device-width, initial-scale=1.0"', 'name="viewport" content="width=device-width, initial-scale=1.0, minimum-scale=0.5, maximum-scale=5.0, user-scalable=yes"')

path.write_text(content, encoding="utf-8")
