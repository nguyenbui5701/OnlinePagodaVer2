"""P07B NEW-ONLY Cycles evidence archive, true ZIP CRC and SHA after owner-run Blender."""
from pathlib import Path
import sys,zipfile,hashlib
path=Path(sys.argv[-1]).resolve()
if not path.is_file():raise FileNotFoundError(path)
with zipfile.ZipFile(path,'r') as z:
 bad=z.testzip()
 if bad:raise RuntimeError('ZIP CRC FAIL '+bad)
 names=z.namelist()
 cases={x.split('/')[0] for x in names if x.endswith('case_report.json')}
 required={'p07b_cross_actor','p07b_cross_pair','p07b_kneel_actor','p07b_kneel_pair'}
 if cases!=required:raise RuntimeError('Expected exactly FOUR NEW P07b cases, got '+repr(cases))
 if len(names)<20:raise RuntimeError('Suspiciously incomplete archive')
print('[P07B_ZIP_CRC_PASS] sha256='+hashlib.sha256(path.read_bytes()).hexdigest()+' files='+str(len(names)))
