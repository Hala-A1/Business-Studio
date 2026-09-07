import json
import base64
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

from generate_image import generate_image


class ApiHandler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_POST(self):
        if self.path != "/api/generate":
            self.send_error(404)
            return
        try:
            length = int(self.headers.get("Content-Length", "0"))
            payload = json.loads(self.rfile.read(length))
            prompt = str(payload.get("prompt", "")).strip()
            if not prompt:
                raise ValueError("A prompt is required")
            source_image = base64.b64decode(payload["image"]) if payload.get("image") else None
            quality = str(payload.get("quality", "low"))
            if quality not in {"low", "medium", "high"}:
                raise ValueError("Quality must be low, medium, or high")
            images = generate_image(prompt, str(payload.get("size", "1024 x 1024")), int(payload.get("samples", 1)), quality, source_image)
            self._json(200, {"images": images})
        except (ValueError, KeyError, TypeError, json.JSONDecodeError) as error:
            self._json(400, {"error": str(error)})
        except Exception:
            self._json(502, {"error": "Image generation failed"})

    def _json(self, status, body):
        encoded = json.dumps(body).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(encoded)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(encoded)


if __name__ == "__main__":
    print("API listening on http://127.0.0.1:8000")
    ThreadingHTTPServer(("127.0.0.1", 8000), ApiHandler).serve_forever()
