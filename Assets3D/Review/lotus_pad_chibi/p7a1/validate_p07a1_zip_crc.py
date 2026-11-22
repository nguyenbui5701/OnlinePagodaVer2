"""P06b independent evidence archive CRC verifier, executed ONLY after real owner Blender/ZIP."""
from pathlib import Path
import sys,zipfile,hashlib
path=Path(sys.argv[-1]).resolve()
if not path.is_file():raise FileNotFoundError(path)
with zipfile.ZipFile(path,'r') as z:
    failed=z.testzip()
    if failed:raise RuntimeError("ZIP CRC FAIL: "+failed)
    names=z.namelist()
    cases={x.split('/')[0] for x in names if x.endswith('case_report.json')}
    required={'p06c_cross_actor','p06c_cross_pair','p06c_kneel_actor','p06c_kneel_pair',
              'p07a1_cross_actor','p07a1_cross_pair','p07a1_kneel_actor','p07a1_kneel_pair'}
    if not required.issubset(cases):raise RuntimeError("Missing cases "+str(required-cases))
sha=hashlib.sha256(path.read_bytes()).hexdigest()
print("[P07A1_ZIP_CRC_PASS] sha256="+sha+" files="+str(len(names)))
