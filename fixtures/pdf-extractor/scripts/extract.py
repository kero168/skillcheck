#!/usr/bin/env python3
"""Minimal PDF text dumper bundled with the pdf-extractor fixture skill.

Extracts text drawn with Tj operators from content streams, inflating
zlib-compressed streams when possible. This is intentionally small: it
demonstrates a bundled script, not a production-grade PDF parser.
"""
import re
import sys
import zlib


def extract_text(data: bytes) -> str:
    chunks = []
    for match in re.finditer(rb"stream\r?\n(.*?)endstream", data, re.S):
        stream = match.group(1)
        try:
            stream = zlib.decompress(stream)
        except zlib.error:
            pass
        for text in re.findall(rb"\((.*?)(?<!\\)\)\s*Tj", stream, re.S):
            chunks.append(text.decode("latin-1", errors="replace"))
    return "\n".join(chunks)


def main() -> int:
    if len(sys.argv) != 2:
        print("usage: extract.py <input.pdf>", file=sys.stderr)
        return 2
    with open(sys.argv[1], "rb") as handle:
        print(extract_text(handle.read()))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
