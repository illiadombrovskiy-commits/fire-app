"""Run the local app in a clean headless Chrome profile."""
import functools
from html.parser import HTMLParser
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import os
from pathlib import Path
import shutil
import subprocess
import tempfile
import threading


ROOT = Path(__file__).resolve().parents[1]


class AppHandler(SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path != "/":
            return super().do_GET()

        html = (ROOT / "index.html").read_text(encoding="utf-8")
        html = html.replace("</head>", '<script src="/tests/setup.js"></script></head>', 1)
        html = html.replace("</body>", '<script src="/tests/browser.js"></script></body>', 1)
        body = html.encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        # Permit local app assets only. Firebase and other external services stay offline.
        self.send_header(
            "Content-Security-Policy",
            "default-src 'self'; script-src 'self' 'unsafe-inline'; "
            "style-src 'self' 'unsafe-inline'; img-src 'self' data:; media-src 'self' blob:",
        )
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, *_args):
        pass


class TestReport(HTMLParser):
    def __init__(self):
        super().__init__()
        self.result = None
        self.lines = []
        self.in_report = False

    def handle_starttag(self, tag, attrs):
        if tag == "pre" and dict(attrs).get("id") == "browser-test-report":
            self.result = dict(attrs)["data-result"]
            self.in_report = True

    def handle_endtag(self, tag):
        if tag == "pre":
            self.in_report = False

    def handle_data(self, data):
        if self.in_report:
            self.lines.append(data)


def chrome_path():
    if os.environ.get("CHROME_BIN"):
        return os.environ["CHROME_BIN"]
    for name in ("google-chrome", "chromium", "chromium-browser"):
        executable = shutil.which(name)
        if executable:
            return executable
    mac_chrome = Path("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome")
    if mac_chrome.is_file():
        return str(mac_chrome)
    raise SystemExit("Chrome/Chromium не найден. Укажите путь в CHROME_BIN.")


def main():
    chrome = chrome_path()
    handler = functools.partial(AppHandler, directory=str(ROOT))
    with ThreadingHTTPServer(("127.0.0.1", 0), handler) as server:
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        try:
            with tempfile.TemporaryDirectory(prefix="ogonek-browser-") as profile:
                run = subprocess.run(
                    [
                        chrome, "--headless", "--disable-background-networking",
                        "--force-prefers-reduced-motion", "--no-first-run",
                        "--virtual-time-budget=5000",
                        f"--user-data-dir={profile}", "--dump-dom",
                        f"http://127.0.0.1:{server.server_port}/",
                    ],
                    capture_output=True, encoding="utf-8", timeout=45,
                )
        finally:
            server.shutdown()
            thread.join()

    report = TestReport()
    report.feed(run.stdout)
    if run.returncode or report.result is None:
        raise SystemExit(f"Браузер не вернул результаты ({run.returncode}).\n{run.stderr}")
    print("".join(report.lines).strip())
    return 0 if report.result == "pass" else 1


if __name__ == "__main__":
    raise SystemExit(main())
