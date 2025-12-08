#!/usr/bin/env python3
import zlib
import urllib.request
import sys
from pathlib import Path

MAPPING = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_"


def encode_plantuml(data: bytes) -> str:
    res = []
    i = 0
    while i < len(data):
        b1 = data[i]
        b2 = data[i+1] if i+1 < len(data) else 0
        b3 = data[i+2] if i+2 < len(data) else 0
        c1 = (b1 >> 2) & 0x3F
        c2 = ((b1 & 0x3) << 4 | (b2 >> 4)) & 0x3F
        c3 = ((b2 & 0xF) << 2 | (b3 >> 6)) & 0x3F
        c4 = b3 & 0x3F
        res.append(MAPPING[c1])
        res.append(MAPPING[c2])
        res.append(MAPPING[c3])
        res.append(MAPPING[c4])
        i += 3
    return ''.join(res)


def deflate_and_encode(text: str) -> str:
    # raw deflate (no zlib headers)
    compressor = zlib.compressobj(level=9, wbits=-15)
    compressed = compressor.compress(text.encode('utf-8')) + compressor.flush()
    return encode_plantuml(compressed)


def main():
    repo_root = Path(__file__).resolve().parents[1]
    puml_path = repo_root / 'diagrams' / 'architecture.puml'
    out_path = repo_root / 'diagrams' / 'architecture.png'

    if not puml_path.exists():
        print(f"ERROR: {puml_path} not found")
        sys.exit(1)

    text = puml_path.read_text(encoding='utf-8')
    # Ensure content contains @startuml/@enduml
    if '@startuml' not in text:
        text = '@startuml\n' + text + '\n@enduml\n'

    encoded = deflate_and_encode(text)
    url = f'https://www.plantuml.com/plantuml/png/{encoded}'
    print('Requesting:', url)

    try:
        with urllib.request.urlopen(url) as resp:
            data = resp.read()
            out_path.parent.mkdir(parents=True, exist_ok=True)
            out_path.write_bytes(data)
            print(f'Wrote {out_path} ({len(data)} bytes)')
    except Exception as e:
        print('Failed to fetch PNG from PlantUML server:', e)
        sys.exit(2)


if __name__ == '__main__':
    main()
