"""Gateway-private one-phrase process using the pinned V1 voice recipe."""
import json
import os
import re
import subprocess
import sys
from synthesize import dependencies, speak, ServiceError

TEMPLATES = (
    "Cảm ơn {name} đã gửi quà.",
    "Xin cảm ơn {name} nhé.",
    "Cảm ơn {name}. Chúc bạn bình an.",
    "Chúc {name} một ngày an lành.",
    "Cảm ơn món quà của {name}.",
    "Gửi lời cảm ơn đến {name}.",
    "Cảm ơn {name}, chúc bạn an vui.",
    "{name} ơi, cảm ơn bạn nhé.",
    "Xin cảm ơn tấm lòng của {name}.",
    "Cảm ơn {name} đã gửi {count} món quà.",
)


def main():
    if os.environ.get("V2_LIVE_GTTS_ENABLED") != "1":
        return 77
    ffmpeg = dependencies()
    from gtts import gTTS  # Warm the pinned module before reading the Gateway job.
    raw = sys.stdin.buffer.read(257)
    if not raw:
        return 0
    if len(raw) > 256:
        return 65
    job = json.loads(raw.decode("utf-8"))
    if set(job) != {"alias", "template", "count"}:
        return 65
    alias, template, count = job["alias"], job["template"], job["count"]
    if (not isinstance(alias, str) or not 2 <= len(alias) <= 24
            or not re.fullmatch(r"[^\W\d_]+(?:[ '-][^\W\d_]+){0,3}", alias)
            or type(template) is not int or not 0 <= template < len(TEMPLATES)
            or type(count) is not int or not 1 <= count <= 9999
            or (template == 9 and not 2 <= count <= 8)):
        return 65
    sys.stdout.buffer.write(speak(TEMPLATES[template].format(name=alias, count=count), ffmpeg, 192000))
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except (ImportError, FileNotFoundError):
        sys.exit(78)
    except ServiceError as error:
        if error.status and 100 <= error.status <= 599:
            # The Node process forwards only known exit categories, never the phrase.
            sys.exit({403: 80, 429: 79}.get(error.status, 75))
        sys.exit(69)
    except (ValueError, KeyError, TypeError, subprocess.SubprocessError, OSError):
        sys.exit(65)
