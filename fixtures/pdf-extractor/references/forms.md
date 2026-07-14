# Filling AcroForm fields

Guidance for the form-filling half of the pdf-extractor skill.

1. Enumerate the field names first; never guess them.
2. Match each field to the user's data and confirm ambiguous mappings.
3. Preserve field types: checkboxes take on/off export values, not free text.
4. After filling, flatten only if the user explicitly asks for it.

If a PDF has no AcroForm dictionary, report that the form is not fillable
instead of drawing text on top of the page.
