"""Remove phone text from this resume while preserving all other PDF content.

Usage: python _scripts/prepare-public-resume.py INPUT.pdf
The original input stays untouched. Output is the site's canonical resume.
"""
from pathlib import Path
import re
import sys
from pypdf import PdfReader, PdfWriter
from pypdf.generic import TextStringObject, FloatObject, ArrayObject, NameObject

PHONE = re.compile(r"(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}")
source = Path(sys.argv[1]).resolve()
target = Path(__file__).resolve().parent.parent / "abdulkader-alturkmani-resume.pdf"
if source == target:
    raise ValueError("Choose the original input, not the public output.")
writer = PdfWriter()
writer.clone_document_from_reader(PdfReader(source))
removed = 0
for page in writer.pages:
    stream = page.get_contents()
    font = None
    remove_separator = False
    for operands, operator in stream.operations:
        if operator == b"Tf":
            font = page["/Resources"]["/Font"][operands[0]].get_object()
        if operator not in (b"TJ", b"Tj"):
            continue
        array = operands[0] if operator == b"TJ" else ArrayObject([operands[0]])
        joined = "".join(str(value) for value in array if isinstance(value, TextStringObject))
        is_phone = bool(PHONE.fullmatch(joined))
        is_separator = remove_separator and joined in ("j", "|")
        if not (is_phone or is_separator):
            continue
        if operator != b"TJ" or font is None or "/Widths" not in font:
            raise ValueError("Phone encoding changed; review this PDF before preparing a public copy.")
        widths = font["/Widths"]
        first = int(font.get("/FirstChar", 0))
        for i, value in enumerate(array):
            if isinstance(value, TextStringObject):
                # Negative TJ adjustments preserve the removed glyphs' advance.
                advance = sum(float(widths[ord(char) - first]) for char in str(value))
                array[i] = FloatObject(-advance)
        if is_phone:
            removed += 1
            remove_separator = True
        else:
            remove_separator = False
    page.replace_contents(stream)
    if "/Annots" in page:
        page[NameObject("/Annots")] = ArrayObject([
            item for item in page["/Annots"]
            if not str(item.get_object().get("/A", {}).get("/URI", "")).lower().startswith("tel:")
        ])
if removed != 1:
    raise ValueError("Expected one phone-number text run; found %s. Manual PDF review required." % removed)
writer.compress_identical_objects(remove_duplicates=True, remove_unreferenced=True)
writer.write(target)
text = "\n".join(page.extract_text() for page in PdfReader(target).pages)
if PHONE.search(text):
    raise ValueError("Phone number remains in extracted text.")
print("Prepared public resume; removed phone text and retained the original layout.")
