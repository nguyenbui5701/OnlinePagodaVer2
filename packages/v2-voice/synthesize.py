"""Bounded Vietnamese speech for local synthetic DEMO only."""
import importlib.metadata
import io
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys

VOICE_VERSION = "2.5.4"
NAMES = {"an": "An", "binh": "Bình", "chi": "Chi", "duyen": "Duyên"}
GIFTS = {"rose": "hoa hồng", "lantern": "đèn lồng"}


def enabled():
    return os.environ.get("V2_GTTS_DEMO_ENABLED") == "1"


def phrase(data):
    if (not isinstance(data, dict) or set(data) != {"nameId", "gift", "count"}
            or type(data["count"]) is not int or not 1 <= data["count"] <= 8):
        raise ValueError("template")
    count = f"{data['count']} " if data["count"] > 1 else ""
    return f"Cảm ơn {NAMES[data['nameId']]} đã gửi {count}{GIFTS[data['gift']]}."


def dependencies():
    # Match V1's operator override and PATH discovery.
    explicit = os.environ.get("FFMPEG_PATH")
    ffmpeg = explicit or shutil.which("ffmpeg")
    if not ffmpeg or not Path(ffmpeg).is_file():
        raise FileNotFoundError("TTS_FFMPEG_NOT_FOUND")
    if importlib.metadata.version("gTTS") != VOICE_VERSION:
        raise ImportError("TTS_GTTS_VERSION")
    return ffmpeg


class ServiceError(Exception):
    def __init__(self, status):
        self.status = status
        super().__init__(f"GTTS_SERVICE_HTTP_{status}" if status else "GTTS_SERVICE_UNREACHABLE")


def speak(message, ffmpeg, max_bytes):
    from gtts import gTTS, gTTSError

    mp3 = io.BytesIO()
    try:
        gTTS(text=message, lang="vi", slow=False, timeout=6).write_to_fp(mp3)
    except gTTSError as error:
        raise ServiceError(getattr(error.rsp, "status_code", None)) from None
    result = subprocess.run(
        [ffmpeg, "-nostdin", "-v", "error", "-i", "pipe:0", "-af", "atempo=1.5,volume=0.8",
         "-ac", "1", "-ar", "24000", "-f", "s16le", "pipe:1"],
        input=mp3.getvalue(), capture_output=True, timeout=3, check=True
    )
    pcm = result.stdout
    if not 4800 <= len(pcm) <= max_bytes or len(pcm) % 2:
        raise ValueError("TTS_PCM_LENGTH")
    return pcm


def main():
    if not enabled():
        return 77
    raw = sys.stdin.buffer.read(257)
    if len(raw) > 256:
        return 65
    message = phrase(json.loads(raw.decode("utf-8")))
    pcm = speak(message, dependencies(), 192000)
    sys.stdout.buffer.write(pcm)
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except (ImportError, FileNotFoundError) as error:
        print("TTS_FFMPEG_NOT_FOUND" if str(error) == "TTS_FFMPEG_NOT_FOUND" else "TTS_GTTS_2_5_4_REQUIRED",
              file=sys.stderr)
        sys.exit(78)
    except ServiceError as error:
        print(error, file=sys.stderr)
        sys.exit(75 if error.status else 69)
    except (ValueError, KeyError, TypeError, subprocess.SubprocessError, OSError):
        print("TTS_GENERATION_FAILED", file=sys.stderr)
        sys.exit(65)