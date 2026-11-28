import { spawnSync } from 'node:child_process';

const enabled = process.env.V2_LIVE_GTTS_ENABLED === '1';
const python = process.env.TTS_PYTHON || 'python';
const probe = String.raw`
import importlib.metadata
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys

result = {"python": sys.executable, "pythonVersion": sys.version.split()[0]}
try:
    result["gtts"] = importlib.metadata.version("gTTS")
    from gtts import gTTS
    result["gttsReady"] = result["gtts"] == "2.5.4"
except ImportError:
    result["gttsReady"] = False
ffmpeg = os.environ.get("FFMPEG_PATH") or shutil.which("ffmpeg")
result["ffmpeg"] = ffmpeg
result["ffmpegReady"] = False
if ffmpeg and Path(ffmpeg).is_file():
    try:
        sample = subprocess.run([ffmpeg, "-nostdin", "-v", "error", "-f", "lavfi",
            "-i", "sine=frequency=440:duration=0.3", "-af", "atempo=1.5,volume=0.8",
            "-ac", "1", "-ar", "24000", "-f", "s16le", "pipe:1"],
            capture_output=True, timeout=5, check=True).stdout
        result["ffmpegReady"] = len(sample) >= 4800 and len(sample) % 2 == 0
    except (OSError, subprocess.SubprocessError):
        pass
print(json.dumps(result))
`;
const child = spawnSync(python, ['-c', probe], { encoding:'utf8', timeout:10000, windowsHide:true });
let dependencies;
try { if (child.status === 0) dependencies = JSON.parse(child.stdout); } catch {}
const reasons = [];
if (!enabled) reasons.push('GATEWAY_LIVE_OPT_IN_DISABLED');
if (!dependencies) reasons.push('GTTS_PYTHON_UNAVAILABLE');
else {
  if (!dependencies.gttsReady) reasons.push('GTTS_2_5_4_MISSING_OR_IMPORT_FAILED');
  if (!dependencies.ffmpegReady) reasons.push('FFMPEG_MISSING_OR_FILTER_FAILED');
}
console.log(JSON.stringify({ enabled, interpreterSelection: process.env.TTS_PYTHON ? 'TTS_PYTHON' : 'PATH',
  ffmpegSelection: process.env.FFMPEG_PATH ? 'FFMPEG_PATH' : 'PATH',
  dependencies, reasons, provider: 'NOT_PROBED', serverProcess: 'NOT_INSPECTED' }, null, 2));
process.exitCode = reasons.length ? 1 : 0;
