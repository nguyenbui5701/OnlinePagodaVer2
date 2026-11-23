"""Restore SHA-locked original source deps from text-only zlib-base64 checked into p5c.
Zero network, stdlib. Never modifies frozen p5b folder or its GLBs.
"""
from pathlib import Path
import base64,zlib,hashlib,shutil
ROOT=Path(__file__).resolve().parent
FILES={
 'p04_source_frozen.py':('b3b8b0c5bb1f9730c426f9e4b2ce1485e0f4df9b45adffcb9300ac92348f8ad2',16549),
 'p05_source_frozen.py':('e6f7d06d3a3c78d055c6510d61d009a6bca877f03cd1c1323ee5602dcc633ad9',10597)}
BASEFILES={
 'procedural_female_hands_p05b.py':('6f634fc7db7cb6a0d685abb32af57a47b764f3020002671911a0ad21f01f8bc6',8293),
 'meditator_female_cross_prayer_p05b.glb':('81e8548cf6e46d9f5ff60c7bdf342ac1857015140e7d06d67dbd9284054137fd',424628),
 'meditator_female_kneel_prayer_p05b.glb':('533b84cba69332107ea25c57ed952b76c8276d4971a558496e4caf7aea400e9f',439088)}
def check(path,sha,size):
 b=path.read_bytes()
 assert len(b)==size and hashlib.sha256(b).hexdigest()==sha,(str(path),'SHA_OR_SIZE_MISMATCH')
 return b

def main():
 for name,(expected,size) in FILES.items():
  target=ROOT/name
  if not target.is_file():
   coded=(ROOT/(name+'.zlib.b64')).read_text().strip()
   raw=zlib.decompress(base64.b64decode(coded))
   assert len(raw)==size and hashlib.sha256(raw).hexdigest()==expected
   target.write_bytes(raw)
  check(target,expected,size)
  print('[FROZEN SOURCE EXACT]',name)
 for name,(expected,size) in BASEFILES.items():
  target=ROOT/name
  if not target.is_file():
   previous=ROOT.parent/'p5b'/name
   if not previous.is_file():raise FileNotFoundError(f'Required P0.5b GitHub file absent: {previous}')
   check(previous,expected,size)
   shutil.copyfile(previous,target)
  check(target,expected,size)
  print('[P05B BASELINE EXACT]',name)
 print('RECONSTRUCTION_PASS_NO_PRIOR_REVISIONS_CHANGED')
if __name__=='__main__':main()
