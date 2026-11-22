"""Restore the exact editable P05e procedural source, pinned to its canonical SHA256.

Run from PR checkout: python restore_p05e_source.py [--build]
Plain restored Python is also supplied in the owner SOURCE_REPORTS ZIP.
Requires only Python stdlib to restore; build requires numpy, scipy, trimesh.
"""
from pathlib import Path
import base64, hashlib, zlib, argparse, shutil, subprocess, sys

HERE=Path(__file__).resolve().parent
EXPECTED='18879f2a0bcc4e59d5299d6b196a3ce11c89d15dff3decb618bb35edba9b3ba1'
BASE_SHA='0f169e427cc70bc0b5b744db935c4de4ecac356ef3fc8a1113812a5bf0780e44'
PAYLOAD=HERE/'P05E_CANONICAL_SOURCE.zlib.b64'
TARGET=HERE/'procedural_female_cross_foot_waist_p05e.py'

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--build', action='store_true')
    args=parser.parse_args()
    data=zlib.decompress(base64.b64decode(PAYLOAD.read_text().strip()))
    got=hashlib.sha256(data).hexdigest()
    if got != EXPECTED: raise ValueError(f'Source payload SHA differs: {got}')
    if TARGET.exists() and TARGET.read_bytes()!=data:
        raise ValueError('Found different source file, refusing to overwrite')
    TARGET.write_bytes(data)
    print('SOURCE RESTORED SHA-256',got,'bytes',len(data))
    if args.build:
        old=HERE.parent/'p5d'/'meditator_female_cross_prayer_p05d.glb'
        if not old.exists(): raise FileNotFoundError(f'Exact old P05d GLB missing: {old}')
        old_sha=hashlib.sha256(old.read_bytes()).hexdigest()
        if old_sha!=BASE_SHA: raise ValueError(f'Old GLB SHA mismatch: {old_sha}')
        folder=HERE/'p05d_baseline';folder.mkdir(exist_ok=True)
        target=folder/old.name
        if not target.exists(): shutil.copyfile(old,target)
        if hashlib.sha256(target.read_bytes()).hexdigest()!=BASE_SHA:
            raise ValueError('p05d_baseline is wrong; do not reuse it')
        subprocess.run([sys.executable,str(TARGET)],cwd=HERE,check=True)
        made=HERE/'meditator_female_cross_prayer_p05e.glb'
        print('BUILD SHA-256',hashlib.sha256(made.read_bytes()).hexdigest())
if __name__=='__main__':main()
