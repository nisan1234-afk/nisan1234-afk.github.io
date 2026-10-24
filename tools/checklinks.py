import re,glob,os,sys
S='/home/claude/nisan1234-afk.github.io/tayarut'
bad=0
for f in sorted(glob.glob(S+'/marketing/*/index.html')):
    h=open(f).read(); d=os.path.dirname(f)
    for href in re.findall(r'href="(\.\./[^"]+)"',h):
        path,_,frag=href.partition('#')
        tgt=os.path.normpath(os.path.join(d,path))
        tgt=tgt if tgt.endswith('.html') else os.path.join(tgt,'index.html')
        if not os.path.exists(tgt): print('NOFILE',f[len(S):],href); bad+=1; continue
        if frag and f'id="{frag}"' not in open(tgt).read(): print('NOANCHOR',f[len(S):],href); bad+=1
print('bad',bad)
