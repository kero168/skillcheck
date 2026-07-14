---
name: pdf-extractor
description: Extracts text, tables, and form fields from PDF files. Use when the user asks to read, fill, or analyze a PDF document.
license: MIT
---

# PDF Extractor

Extract content from PDF files without sending them to any external service.

## Quick start

1. Read [the form-filling guide](references/forms.md) before editing AcroForm fields.
2. Run `scripts/extract.py` with the input path to dump the text layer.
3. Summarize the extracted content for the user.

## Notes

- Process large PDFs page by page to keep context small.
- For scanned PDFs, tell the user that OCR is out of scope for this skill.
