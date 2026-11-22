"""Dictionary-encode repeated provenance prose without altering geometry.

The source notes are stored once per file, referenced by the same field's code.
This lowers client parse/memory cost and keeps individual static assets compact.
Run after acquisition/enrichment/heights; safe to repeat.
"""
import json,collections
from pathlib import Path
OUT=Path(__file__).resolve().parents[1]/'dist/assets/data'
for name in ['cartography','port-cartography','coast-cartography','marjal-cartography','almarda-cartography','palancia-cartography']:
 p=OUT/(name+'.json');before=p.stat().st_size;d=json.loads(p.read_text());codes=d.get('provenanceTextCodes',{})
 for field in ['source','roofColorSource','surfaceHeightSource']:
  values=collections.Counter(b.get(field) for b in d['buildings'] if isinstance(b.get(field),str) and len(b.get(field))>45)
  mapping=codes.setdefault(field,{})
  for value,count in values.items():
   if count<20:continue
   key=next((k for k,v in mapping.items() if v==value),None) or 'note'+str(len(mapping)+1);mapping[key]=value
   for b in d['buildings']:
    if b.get(field)==value:b[field]=key
 d['provenanceTextCodes']=codes
 p.write_text(json.dumps(d,ensure_ascii=False,separators=(',',':')))
 print(name,before,'->',p.stat().st_size)
