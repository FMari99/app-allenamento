"""Genera le due icone PNG dell'app senza dipendenze esterne."""
from pathlib import Path
import struct
import zlib
root = Path(__file__).resolve().parents[1] / 'app/public'
background = (23, 62, 53)
foreground = (246, 246, 239)
def pixel(x, y):
    # Marchio geometrico a. dentro l'area sicura delle icone maskable.
    ring = 0.105 ** 2 <= (x - .42) ** 2 + (y - .51) ** 2 <= .205 ** 2
    stem = .565 <= x <= .625 and .31 <= y <= .71
    dot = (x - .75) ** 2 + (y - .675) ** 2 <= .035 ** 2
    return foreground if ring or stem or dot else background
def chunk(name, data):
    return struct.pack('>I', len(data)) + name + data + struct.pack('>I', zlib.crc32(name + data))
for size in (192, 512):
    rows = []
    for y in range(size):
        row = bytearray([0])
        for x in range(size):
            samples = [pixel((x + dx) / size, (y + dy) / size) for dx, dy in ((.25, .25), (.75, .25), (.25, .75), (.75, .75))]
            row.extend(round(sum(color[c] for color in samples) / 4) for c in range(3))
        rows.append(row)
    data = b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('>IIBBBBB', size, size, 8, 2, 0, 0, 0)) + chunk(b'IDAT', zlib.compress(b''.join(rows))) + chunk(b'IEND', b'')
    (root / f'icon-{size}.png').write_bytes(data)
print('Icone 192 e 512 generate.')
