"""Sosies visuels -> assets/neighbors.json (pièges des QCM). Optionnel.
   pip install numpy pillow ; node scripts/tools/render-flags.js /tmp/flags-png ; python3 scripts/tools/similarity.py /tmp/flags-png

Perceptual flag similarity -> nearest neighbours used as multiple-choice distractors.

Each flag is stretched to a common 48x32 grid and converted to CIELAB. Distance mixes
(a) mean per-pixel colour difference (layout + colour), (b) a coarse 6x4 layout term and
(c) palette difference (same colours, different layout), plus a small aspect-ratio term.
"""
import json, os, sys
import numpy as np
from PIL import Image

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..')
PNG = sys.argv[1] if len(sys.argv) > 1 else sys.exit('Indique le dossier des PNG (render-flags.js).')
meta = json.load(open(os.path.join(ROOT, 'assets', 'flags-meta.json')))
codes = sorted(meta)
W, H = 48, 32

def srgb_to_lab(rgb):
    c = rgb / 255.0
    c = np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)
    M = np.array([[0.4124, 0.3576, 0.1805], [0.2126, 0.7152, 0.0722], [0.0193, 0.1192, 0.9505]])
    xyz = c @ M.T / np.array([0.95047, 1.0, 1.08883])
    f = np.where(xyz > 0.008856, np.cbrt(xyz), 7.787 * xyz + 16 / 116)
    L = 116 * f[..., 1] - 16
    a = 500 * (f[..., 0] - f[..., 1])
    b = 200 * (f[..., 1] - f[..., 2])
    return np.stack([L, a, b], -1)

def load(c):
    im = Image.open(os.path.join(PNG, c + '.png')).convert('RGBA')
    bg = Image.new('RGBA', im.size, (255, 255, 255, 255)); bg.alpha_composite(im)
    rgb = np.asarray(bg.convert('RGB').resize((W, H), Image.LANCZOS), dtype=np.float64)
    return srgb_to_lab(rgb)

labs = np.stack([load(c) for c in codes])            # N,H,W,3
coarse = labs.reshape(len(codes), 4, 8, 6, 8, 3).mean(axis=(2, 4))  # N,4,6,3

# palette: 3-D histogram over coarse Lab bins (weights = area share)
def palette(lab):
    q = np.clip(((lab + np.array([0, 128, 128])) / np.array([100 / 6, 256 / 8, 256 / 8])).astype(int), 0, [5, 7, 7])
    idx = q[..., 0] * 64 + q[..., 1] * 8 + q[..., 2]
    h = np.bincount(idx.ravel(), minlength=6 * 64).astype(float)
    return h / h.sum()
pals = np.stack([palette(l) for l in labs])

N = len(codes)
D = np.zeros((N, N))
for i in range(N):
    pix = np.sqrt(((labs - labs[i]) ** 2).sum(-1)).mean(axis=(1, 2))
    lay = np.sqrt(((coarse - coarse[i]) ** 2).sum(-1)).mean(axis=(1, 2))
    pal = 0.5 * np.abs(pals - pals[i]).sum(-1) * 100   # 0..100
    D[i] = 0.55 * pix + 0.25 * lay + 0.20 * pal
ratios = np.array([meta[c]['ratio'] for c in codes])
D += 6 * np.abs(np.log(ratios[:, None] / ratios[None, :]))
np.fill_diagonal(D, np.inf)

K = 10
nb = {}
for i, c in enumerate(codes):
    order = np.argsort(D[i])[:K]
    nb[c] = [codes[j] for j in order]
json.dump(nb, open(os.path.join(ROOT, 'assets', 'neighbors.json'), 'w'))
print('assets/neighbors.json écrit :', len(nb), 'drapeaux')
