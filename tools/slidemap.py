import sys,re,glob,os
d=sys.argv[1]
def key(f): return int(re.search(r'(\d+)\.xml$',f).group(1))
for f in sorted(glob.glob(d+'/ppt/slides/slide*.xml'),key=key):
    n=key(f); x=open(f,encoding='utf8').read()
    t=' '.join(re.findall(r'<a:t>([^<]*)</a:t>',x))[:160]
    r=f.replace('slides/','slides/_rels/')+'.rels'
    imgs=re.findall(r'Target="\.\./media/([^"]+)"',open(r).read()) if os.path.exists(r) else []
    print(f's{n}: {imgs} | {t}')
