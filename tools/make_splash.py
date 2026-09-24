from PIL import Image, ImageDraw
size = 2732
img = Image.new("RGBA",(size,size),(0,0,0,0))
d = ImageDraw.Draw(img)
cx=cy=size/2
for i in range(size,0,-3):
    t=i/size
    col=(int(18+30*(1-t)), int(45+55*(1-t)), int(95+50*(1-t)),255)
    d.ellipse([cx-i/2,cy-i/2,cx+i/2,cy+i/2], fill=col)
d.rectangle([0,0,size,size], fill=None)
# نملأ الزوايا بنفس أغمق لون التدرج (خلفية مربعة كاملة تحت الدائرة)
bg = Image.new("RGBA",(size,size),(15,10,7,255))
bg.alpha_composite(img)
icon = Image.open("/home/claude/alloush/www/icons/icon-512.png").convert("RGBA")
scale = int(size*0.42)
icon = icon.resize((scale,scale))
bg.alpha_composite(icon, (int(cx-scale/2), int(cy-scale/2)))
bg.convert("RGB").save("/home/claude/alloush/resources/splash.png")
bg.convert("RGB").save("/home/claude/alloush/resources/splash-dark.png")
print("splash ok")
