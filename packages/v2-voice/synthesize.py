"""DEMO-only adapter. The external endpoint stays disabled pending terms verification."""
import importlib.metadata
import io
import json
import subprocess
import sys

SERVICE_PERMISSION_VERIFIED = False
NAMES = {"an": "An", "binh": "B\u00ecnh", "chi": "Chi", "duyen": "Duy\u00ean"}
GIFTS = {"rose": "hoa h\u1ed3ng", "lantern": "\u0111\u00e8n l\u1ed3ng"}

def phrase(data):
    if set(data) != {"nameId", "gift", "count"} or type(data["count"]) is not int or not 1 <= data["count"] <= 8:
        raise ValueError("template")
    count = f"{data['count']} " if data["count"] > 1 else ""
    return f"C\u1ea3m \u01a1n {NAMES[data['nameId']]} \u0111\u00e3 g\u1eedi {count}{GIFTS[data['gift']]}."

def main():
    if not SERVICE_PERMISSION_VERIFIED:
        return 78
    message = phrase(json.loads(sys.stdin.buffer.read(256).decode("utf-8")))
    if importlib.metadata.version("gTTS") != "2.5.4":
        return 78
    from gtts import gTTS
    mp3 = io.BytesIO()
    gTTS(message, lang="vi", timeout=5).write_to_fp(mp3)
    result = subprocess.run(
        ["ffmpeg", "-nostdin", "-v", "error", "-i", "pipe:0", "-af", "atempo=1.5,volume=0.8",
         "-ac", "1", "-ar", "24000", "-f", "s16le", "pipe:1"],
        input=mp3.getvalue(), capture_output=True, timeout=3, check=True
    )
    if not 4800 <= len(result.stdout) <= 192000 or len(result.stdout) % 2:
        return 65
    sys.stdout.buffer.write(result.stdout)
    return 0

if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception:
        sys.exit(65)
