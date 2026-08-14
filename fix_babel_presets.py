from pathlib import Path

path = Path("backend/src/api/fastapi_app.py")
content = path.read_text(encoding="utf-8")

# 1. Update Babel script tag to include data-presets="env,react"
content = content.replace('<script type="text/babel">', '<script type="text/babel" data-presets="env,react">')

# 2. Replace object spread { ...prev } with Object.assign
old_spread = "const next = prev ? { ...prev } : {};"
new_spread = "const next = prev ? Object.assign({}, prev) : {};"
content = content.replace(old_spread, new_spread)

# 3. Replace files.forEach with standard loop
old_foreach = """      const uploadDocs = async (files) => {
        const formData = new FormData();
        files.forEach(f => formData.append('files', f));"""

new_foreach = """      const uploadDocs = async (files) => {
        const formData = new FormData();
        for (let i = 0; i < files.length; i++) {
          formData.append('files', files[i]);
        }"""
content = content.replace(old_foreach, new_foreach)

path.write_text(content, encoding="utf-8")
print("Babel presets and spread operators fixed in fastapi_app.py")
