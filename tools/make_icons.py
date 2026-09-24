from PIL import Image, ImageDraw

def stripe_fill(d, poly, size, col_bg, col_stripe, gap):
    d.polygon(poly, fill=col_bg)
    mask = Image.new("L",(size,size),0)
    ImageDraw.Draw(mask).polygon(poly, fill=255)
    layer = Image.new("RGBA",(size,size),(0,0,0,0))
    dl = ImageDraw.Draw(layer)
    step = gap
    for x in range(-size, size*2, step):
        dl.line([(x,-10),(x-size*0.6,size+10)], fill=col_stripe, width=max(1,int(gap*0.32)))
    base = Image.new("RGBA",(size,size),(0,0,0,0))
    base.paste(layer,(0,0),mask)
    return base

def make_icon(size):
    img = Image.new("RGBA",(size,size),(0,0,0,0))
    d = ImageDraw.Draw(img)
    cx=cy=size/2
    for i in range(size,0,-2):
        t=i/size
        col=(int(24+40*(1-t)), int(60+70*(1-t)), int(120+60*(1-t)),255)
        d.ellipse([cx-i/2,cy-i/2,cx+i/2,cy+i/2], fill=col)
    m = size*0.045
    d.ellipse([m,m,size-m,size-m], outline=(243,185,58,255), width=max(2,int(size*0.035)))

    sr = size*0.36
    d.ellipse([cx-sr,cy-sr*0.85,cx+sr,cy+sr*1.15], fill=(255,214,110,255))

    hr = size*0.165
    head_cy = cy-size*0.04

    # هودي/غطاء الشماغ خلف الرأس (يظهر أعلى وعلى الجانبين فقط)
    hood_top = head_cy - hr*2.05
    hood = [
        (cx-hr*1.5, head_cy+hr*0.3),
        (cx-hr*1.65, head_cy-hr*0.6),
        (cx-hr*0.65, hood_top),
        (cx+hr*0.65, hood_top),
        (cx+hr*1.65, head_cy-hr*0.6),
        (cx+hr*1.5, head_cy+hr*0.3),
    ]
    hood_img = stripe_fill(d, hood, size, (252,250,244,255), (200,16,46,255), max(4,int(size*0.05)))
    img.alpha_composite(hood_img)
    d = ImageDraw.Draw(img)

    # الاكتاف/الجسم يظهر اسفل الهودي كامتداد قماش
    shoulder = [
        (cx-hr*1.7, head_cy+hr*0.15),
        (cx-size*0.30, cy+size*0.30),
        (cx+size*0.30, cy+size*0.30),
        (cx+hr*1.7, head_cy+hr*0.15),
    ]
    shoulder_img = stripe_fill(d, shoulder, size, (252,250,244,255), (200,16,46,255), max(4,int(size*0.05)))
    img.alpha_composite(shoulder_img)
    d = ImageDraw.Draw(img)

    # الوجه (فوق الهودي)
    d.ellipse([cx-hr, head_cy-hr, cx+hr, head_cy+hr], fill=(219,163,105,255))

    # العقال الأسود فوق الجبين
    band_y = head_cy - hr*0.68
    d.ellipse([cx-hr*1.02, band_y-hr*0.20, cx+hr*1.02, band_y+hr*0.20], outline=(20,18,16,255), width=max(2,int(size*0.03)))
    d.ellipse([cx-hr*1.02, band_y-hr*0.06, cx+hr*1.02, band_y+hr*0.32], outline=(20,18,16,255), width=max(2,int(size*0.024)))

    # العينان + الحواجب + الشارب (وجه ودود واثق)
    ey = head_cy + hr*0.12
    er = size*0.017
    for sxn in (-1,1):
        ex = cx+sxn*hr*0.40
        d.ellipse([ex-er,ey-er,ex+er,ey+er], fill=(30,20,15,255))
        d.line([(ex-er*1.8, ey-er*3.2),(ex+er*1.8, ey-er*2.0)] if sxn>0 else [(ex-er*1.8, ey-er*2.0),(ex+er*1.8, ey-er*3.2)],
               fill=(60,35,20,255), width=max(1,int(size*0.012)))
    d.line([(cx-hr*0.5, head_cy+hr*0.62),(cx-hr*0.1, head_cy+hr*0.70),(cx+hr*0.1, head_cy+hr*0.70),(cx+hr*0.5, head_cy+hr*0.62)],
           fill=(60,35,20,255), width=max(2,int(size*0.022)), joint="curve")

    # ياقة حمراء أسفل الرقبة (تلميح للزي الرياضي)
    d.rectangle([cx-hr*0.55, cy+size*0.26, cx+hr*0.55, cy+size*0.30], fill=(200,16,46,255))

    img.save(f"/home/claude/alloush/www/icons/icon-{size}.png")
    return img

for s in [48,72,96,128,144,152,167,180,192,256,384,512,1024]:
    make_icon(s)

def make_maskable(size):
    img = Image.new("RGBA",(size,size),(0,0,0,0))
    d = ImageDraw.Draw(img)
    d.rectangle([0,0,size,size], fill=(13,43,94,255))
    base = make_icon(int(size*0.72))
    img.paste(base, (int(size*0.14), int(size*0.14)), base)
    img.save(f"/home/claude/alloush/www/icons/maskable-{size}.png")

for s in [192,512]:
    make_maskable(s)

print("icons ok")
