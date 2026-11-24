"""Generate the fixed, local-only DEMO blessing corpus in one sequential pass."""
import hashlib
import json
import os
from pathlib import Path
import struct
import subprocess
import sys
import tempfile
import time

from synthesize import dependencies, enabled, ServiceError, speak, VOICE_VERSION

HERE = Path(__file__).resolve().parent
DEST = HERE.parents[1] / "apps/v2-viewer/public/audio/vi-gtts-demo-v1"


def main():
    if not enabled():
        raise ValueError("Set V2_GTTS_DEMO_ENABLED=1 for this local synthetic DEMO.")
    if DEST.exists():
        raise ValueError("Corpus already staged. Move the existing directory aside to regenerate.")
    ffmpeg = dependencies()
    ffmpeg_version = subprocess.check_output([ffmpeg, "-version"], timeout=3).decode().splitlines()[0]
    phrases = json.loads((HERE / "idle-phrases.json").read_text(encoding="utf-8"))
    clips = []
    with tempfile.TemporaryDirectory(prefix=".vi-gtts-demo-", dir=DEST.parent) as tmp:
        staging = Path(tmp) / DEST.name
        staging.mkdir()
        for clip_id, phrase in phrases.items():
            started = time.monotonic()
            pcm = speak(phrase, ffmpeg, 288000)
            latency = round((time.monotonic() - started) * 1000)
            peak = max(abs(sample) for sample, in struct.iter_unpack("<h", pcm))
            if not 328 <= peak < 32767:
                raise ValueError("TTS_PCM_LEVEL")
            (staging / f"{clip_id}.pcm").write_bytes(pcm)
            clips.append({
                "id": clip_id, "text": phrase, "bytes": len(pcm), "sha256": hashlib.sha256(pcm).hexdigest(),
                "durationSec": len(pcm) / 48000, "peakPcm16": peak, "latencyMs": latency
            })
            print(f"{clip_id}: {latency} ms", flush=True)
            time.sleep(1)
        manifest = {
            "version": 1, "source": "gTTS 2.5.4 / vi", "format": "pcm_s16le", "sampleRate": 24000, "channels": 1,
            "python": sys.version.split()[0], "ffmpeg": ffmpeg_version, "clips": clips
        }
        (staging / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        os.rename(staging, DEST)
    print(f"Staged {len(clips)} clips in {DEST}")


if __name__ == "__main__":
    try:
        main()
    except (ImportError, ValueError, OSError, ServiceError, subprocess.SubprocessError) as error:
        sys.exit(f"Idle generation stopped: {error}")