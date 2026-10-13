#!/usr/bin/env python3
"""Extract gluten-free POIs from an OpenStreetMap .osm.pbf file.

Usage:
  python import_osm_gluten_free.py italy-latest.osm.pbf --output candidates.jsonl --region Italy
"""
import argparse, json, re, unicodedata
from pathlib import Path
import osmium

FOOD_AMENITIES = {'restaurant','cafe','fast_food','bar','ice_cream','food_court','pub'}
FOOD_SHOPS = {'bakery','supermarket','convenience','deli','confectionery','health_food','greengrocer','pastry'}
TOURISM = {'hotel','guest_house','hostel','apartment','camp_site','alpine_hut'}

def norm(value: str) -> str:
    value = unicodedata.normalize('NFD', value or '')
    value = ''.join(c for c in value if unicodedata.category(c) != 'Mn')
    return re.sub(r'[^a-z0-9]+', ' ', value.lower()).strip()

def slugify(value: str) -> str:
    return norm(value).replace(' ', '-') or 'locale-senza-nome'

def yes(v): return str(v or '').lower() in {'yes','true','1','only'}

def first(tags, *keys):
    for k in keys:
        v = tags.get(k)
        if v: return v
    return ''

def classify(tags):
    amenity, shop, tourism = tags.get('amenity'), tags.get('shop'), tags.get('tourism')
    if shop == 'bakery': return 'Panificio / Pasticceria'
    if shop in FOOD_SHOPS: return 'Negozio Specializzato'
    if amenity == 'restaurant': return 'Ristorante'
    if amenity == 'fast_food': return 'Street Food'
    if amenity == 'cafe': return 'Bar'
    if amenity == 'ice_cream': return 'Gelateria'
    if tourism in TOURISM: return 'Hotel'
    return 'Altro'

class Handler(osmium.SimpleHandler):
    def __init__(self, out, region):
        super().__init__(); self.out=out; self.region=region; self.count=0
    def emit(self, obj, lon, lat):
        t = {k:v for k,v in obj.tags}
        gf = t.get('diet:gluten_free','').lower()
        text = ' '.join([t.get('name',''), t.get('description',''), t.get('note','')]).lower()
        candidate = gf in {'yes','only'} or ('gluten free' in text) or ('senza glutine' in text)
        allowed = t.get('amenity') in FOOD_AMENITIES or t.get('shop') in FOOD_SHOPS or t.get('tourism') in TOURISM
        if not candidate or not allowed or not t.get('name'): return
        street = first(t,'addr:street','contact:street')
        number = first(t,'addr:housenumber','contact:housenumber')
        address = ' '.join(x for x in [street, number] if x).strip()
        external = f"{obj.type_str()}:{obj.id}"
        row = {
          'source_name':'OpenStreetMap','source_external_id':external,
          'source_url':f"https://www.openstreetmap.org/{obj.type_str()}/{obj.id}",
          'name':t['name'],'normalized_name':norm(t['name']),'slug':slugify(t['name']),
          'type':classify(t),'continent':'','country':first(t,'addr:country'),
          'region':first(t,'addr:state','addr:region'),'province':first(t,'addr:province','addr:county'),
          'city':first(t,'addr:city','addr:town','addr:village','addr:municipality'),
          'address':address,'latitude':lat,'longitude':lon,'phone':first(t,'contact:phone','phone'),
          'website':first(t,'contact:website','website'),'email':first(t,'contact:email','email'),
          'opening_hours':t.get('opening_hours',''),'cuisine':t.get('cuisine',''),
          'delivery_available':yes(t.get('delivery')),'takeaway_available':yes(t.get('takeaway')),
          'gf_source':'OpenStreetMap','gf_source_url':f"https://www.openstreetmap.org/{obj.type_str()}/{obj.id}",
          'gf_source_value':gf or 'text-match','gf_category':'Disponibilità Gluten Free' if gf in {'yes','only'} else 'Stato da verificare',
          'raw_tags':t,'source_region':self.region
        }
        self.out.write(json.dumps(row, ensure_ascii=False)+'\n'); self.count += 1
    def node(self,n):
        if n.location.valid(): self.emit(n,n.location.lon,n.location.lat)
    def way(self,w):
        try:
            if w.nodes: self.emit(w,w.nodes[0].location.lon,w.nodes[0].location.lat)
        except Exception: pass

if __name__=='__main__':
    ap=argparse.ArgumentParser(); ap.add_argument('pbf'); ap.add_argument('--output',default='candidates.jsonl'); ap.add_argument('--region',default='')
    args=ap.parse_args()
    with open(args.output,'w',encoding='utf-8') as f:
        h=Handler(f,args.region); h.apply_file(args.pbf, locations=True)
    print(f"Estratti {h.count} candidati in {args.output}")
