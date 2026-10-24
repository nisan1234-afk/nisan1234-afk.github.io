import sys,glob
from PIL import Image
d,tag,ids=sys.argv[1],sys.argv[2],sys.argv[3].split(',')
ims=[Image.open(f'{d}/shot_{tag}_{i}.png') for i in ids]; W=640; H=1100
ths=[im.resize((W,int(im.height*W/im.width))) for im in ims]
cols=2; rows=(len(ths)+1)//2
sh=Image.new('RGB',(cols*W,rows*H),'white')
for k,t in enumerate(ths): sh.paste(t.crop((0,0,W,min(H,t.height))),((k%cols)*W,(k//cols)*H))
sh.save(f'{d}/sheet_{tag}.jpg',quality=70)
