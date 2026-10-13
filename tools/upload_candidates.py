#!/usr/bin/env python3
import argparse, json, os
from dotenv import load_dotenv
from supabase import create_client
load_dotenv()

ap=argparse.ArgumentParser(); ap.add_argument('jsonl'); ap.add_argument('--batch-size',type=int,default=200); ap.add_argument('--region',default='')
args=ap.parse_args()
url=os.environ['SUPABASE_URL']; key=os.environ['SUPABASE_SERVICE_ROLE_KEY']
sb=create_client(url,key)
batch=sb.table('place_import_batches').insert({'source_name':'OpenStreetMap','source_region':args.region,'source_file':os.path.basename(args.jsonl)}).execute().data[0]
rows=[]; total=0
with open(args.jsonl,encoding='utf-8') as f:
  for line in f:
    r=json.loads(line); r.pop('source_region',None); r['batch_id']=batch['id']; rows.append(r)
    if len(rows)>=args.batch_size:
      sb.table('place_import_candidates').upsert(rows,on_conflict='source_name,source_external_id').execute(); total+=len(rows); rows=[]
if rows: sb.table('place_import_candidates').upsert(rows,on_conflict='source_name,source_external_id').execute(); total+=len(rows)
sb.table('place_import_batches').update({'status':'ready','total_candidates':total}).eq('id',batch['id']).execute()
print(f"Caricati {total} candidati nel batch {batch['id']}")
