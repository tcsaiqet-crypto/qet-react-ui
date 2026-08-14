import pytest
from pathlib import Path

react_dir = Path(r"c:\Users\AkshatSinha\Documents\avd\qet-react-ui")

def test_react_app_structure():
    assert (react_dir / "package.json").exists()
    assert (react_dir / "tsconfig.json").exists()
    assert (react_dir / "vite.config.ts").exists()
    assert (react_dir / "index.html").exists()
    assert (react_dir / "src" / "App.tsx").exists()
    assert (react_dir / "src" / "types.ts").exists()
    assert (react_dir / "src" / "services" / "apiClient.ts").exists()
    assert (react_dir / "src" / "components" / "NavigationHeader.tsx").exists()
    assert (react_dir / "src" / "components" / "HomeUploadPage.tsx").exists()
    assert (react_dir / "src" / "components" / "UnderstandingPage.tsx").exists()

def test_tab_gating_definitions():
    header_code = (react_dir / "src" / "components" / "NavigationHeader.tsx").read_text(encoding="utf-8")
    assert "Home" in header_code
    assert "Understanding" in header_code
    assert "Test Cases" in header_code
    assert "Synthetic Data" in header_code
    assert "Playwright Scripts" in header_code
    assert "Execution" in header_code
    assert "Quality Report" in header_code
    assert "isIntakeReady" in header_code
