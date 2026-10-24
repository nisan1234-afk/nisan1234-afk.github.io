import json, math, pickle
from shapely.geometry import shape, box
from shapely.ops import unary_union
def proj_factory(lon0,lat0,lon1,lat1,W):
    c=math.cos(math.radians((lat0+lat1)/2))
    k=W/((lon1-lon0)*c)
    H=(lat1-lat0)*k
    return (lambda lon,lat:((lon-lon0)*c*k,(lat1-lat)*k)),H
def path_of(geom,P,tol=0.0):
    if tol: geom=geom.simplify(tol)
    parts=[]
    def ring(coords):
        pts=[P(x,y) for x,y in coords]
        return 'M'+' L'.join(f'{x:.1f},{y:.1f}' for x,y in pts)+' Z'
    def line(coords):
        pts=[P(x,y) for x,y in coords]
        return 'M'+' L'.join(f'{x:.1f},{y:.1f}' for x,y in pts)
    gs=getattr(geom,'geoms',[geom])
    for g in gs:
        if g.geom_type=='Polygon':
            parts.append(ring(g.exterior.coords))
            for r in g.interiors: parts.append(ring(r.coords))
        elif g.geom_type=='LineString': parts.append(line(g.coords))
        elif g.geom_type in('MultiPolygon','MultiLineString','GeometryCollection'):
            parts.append(path_of(g,P))
    return ' '.join(parts)
land=json.load(open('ne_10m_land.geojson'))['features']
lakes=json.load(open('ne_10m_lakes.geojson'))['features']
rivers=json.load(open('ne_10m_rivers_lake_centerlines.geojson'))['features']
def clip(feats,B,names=None):
    out=[]
    for f in feats:
        nm=f['properties'].get('name')
        if names and nm not in names: continue
        s=shape(f['geometry'])
        if s.intersects(B): out.append(s.intersection(B))
    return unary_union(out) if out else None
res={}
# main map
lon0,lat0,lon1,lat1=34.40,31.15,35.47,32.12
B=box(lon0,lat0,lon1,lat1)
P,H=proj_factory(lon0,lat0,lon1,lat1,600)
res['W']=600;res['H']=round(H,1)
res['land']=path_of(clip(land,B),P,0.002)
res['dead']=path_of(clip(lakes,B,['Dead Sea']),P,0.001)
res['jordan']=path_of(clip(rivers,B,['Jordan']),P,0.001)
places={
 'jerusalem':(35.2345,31.7767),'bethlehem':(35.2024,31.7054),'hebron':(35.0998,31.5326),
 'maale':(35.2980,31.7770),'mevaseret':(35.1500,31.8023),'beitshemesh':(34.9881,31.7470),
 'latrun':(34.9783,31.8385),'abugosh':(35.1094,31.8058),'baalhatzor':(35.3311,31.9796),
 'beersheva':(34.7913,31.2518),'jaffa':(34.7522,32.0504),'jericho':(35.4500,31.8667)}
res['pts']={k:[round(v,1) for v in P(*c)] for k,c in places.items()}
# 10 km scale
kmdeg=10/111.32
x0,y0=P(lon0+0.05,lat0+0.05); x1,_=P(lon0+0.05+kmdeg/math.cos(math.radians(31.6)),lat0+0.05)
res['scale10']=round(x1-x0,1)
# inset
ilon0,ilat0,ilon1,ilat1=34.0,29.4,36.2,33.4
IB=box(ilon0,ilat0,ilon1,ilat1)
IP,IH=proj_factory(ilon0,ilat0,ilon1,ilat1,150)
res['iW']=150;res['iH']=round(IH,1)
res['iland']=path_of(clip(land,IB),IP,0.01)
res['ilakes']=path_of(clip(lakes,IB,['Dead Sea','Sea of Galilee','Lake Tiberias','Kinneret']),IP,0.005)
bx0,by0=IP(lon0,lat1); bx1,by1=IP(lon1,lat0)
res['ibox']=[round(bx0,1),round(by0,1),round(bx1-bx0,1),round(by1-by0,1)]
json.dump(res,open('map.json','w'))
print(res['W'],res['H'],res['pts'],res['scale10'],res['iW'],res['iH'],len(res['land']),len(res['iland']))
print([f['properties'].get('name') for f in lakes if shape(f['geometry']).intersects(IB)])
