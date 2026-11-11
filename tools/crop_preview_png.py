#!/usr/bin/env python3
"""Crop the empty band under a dark UI screenshot. Usage: crop_preview_png.py FILE"""
import sys
from PIL import Image

def crop_empty_bottom(path, min_bright=70, pad=28):
    im = Image.open(path).convert('RGB')
    w, h = im.size
    pix = im.load()
    last = 0
    for y in range(h - 1, -1, -1):
        mx = 0
        for x in range(0, w, 4):
            r, g, b = pix[x, y]
            mx = max(mx, r, g, b)
            if mx > min_bright:
                last = y
                break
        if last:
            break
    new_h = min(h, last + pad) if last else h
    if new_h < h:
        im.crop((0, 0, w, new_h)).save(path)

if __name__ == '__main__':
    crop_empty_bottom(sys.argv[1])
