import subprocess
import os
import tempfile
import sys
import shutil

edge_path = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
base_dir = r"K:\code\SIGNAL STACK\submission\screenshots"
os.makedirs(base_dir, exist_ok=True)

screens = [
    ("01_dashboard_overview.png", "http://localhost:3000/"),
    ("02_company_intelligence.png", "http://localhost:3000/intelligence/company"),
    ("03_ai_interview.png", "http://localhost:3000/interview"),
    ("04_signal_stack.png", "http://localhost:3000/sources/stack"),
    ("05_intelligence_feed.png", "http://localhost:3000/signals"),
    ("06_competitors.png", "http://localhost:3000/competitors"),
    ("07_monday_brief.png", "http://localhost:3000/briefs"),
    ("08_internal_documents.png", "http://localhost:3000/documents"),
    ("09_source_manager.png", "http://localhost:3000/sources"),
    ("10_automation_settings.png", "http://localhost:3000/automation"),
    ("11_api_docs_swagger.png", "http://localhost:8000/docs")
]

for filename, url in screens:
    out_path = os.path.join(base_dir, filename)
    td = tempfile.mkdtemp()
    cmd = [
        edge_path,
        "--headless=new",
        "--disable-gpu",
        f"--user-data-dir={td}",
        f"--screenshot={out_path}",
        "--window-size=1440,900",
        url
    ]
    try:
        subprocess.run(cmd, timeout=8, capture_output=True)
        size = os.path.getsize(out_path) if os.path.exists(out_path) else 0
        print(f"Captured {filename}: {size} bytes", flush=True)
    except Exception as e:
        print(f"Error on {filename}: {e}", flush=True)
    finally:
        shutil.rmtree(td, ignore_errors=True)

print("ALL SCREENSHOTS CAPTURED", flush=True)
