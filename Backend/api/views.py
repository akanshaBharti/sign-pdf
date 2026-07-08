import json
from io import BytesIO

from django.http import FileResponse, JsonResponse
from django.views.decorators.csrf import csrf_exempt
from PIL import Image
from pypdf import PdfReader, PdfWriter
from reportlab.lib.utils import ImageReader
from reportlab.pdfgen import canvas


def health(request):
    return JsonResponse(
        {
            "message": "Sign PDF backend is running.",
            "frontend": "http://localhost:5173/",
            "sign_endpoint": "/api/sign-pdf/",
        }
    )


@csrf_exempt
def sign_pdf(request):
    if request.method != "POST":
        return JsonResponse({"error": "Only POST is allowed."}, status=405)

    pdf_file = request.FILES.get("pdf")
    signature_file = request.FILES.get("signature")
    placements_json = request.POST.get("placements")

    if not pdf_file or not signature_file or not placements_json:
        return JsonResponse({"error": "PDF, signature, and placements are required."}, status=400)

    try:
        placements = json.loads(placements_json)
        if not isinstance(placements, list) or not placements:
            raise ValueError("Placements must be a non-empty list.")
    except (TypeError, ValueError, json.JSONDecodeError):
        return JsonResponse({"error": "Invalid placements data."}, status=400)

    try:
        output = apply_signatures(pdf_file, signature_file, placements)
    except Exception as exc:
        return JsonResponse({"error": f"Unable to sign PDF: {exc}"}, status=400)

    filename = f"signed-{pdf_file.name}"
    return FileResponse(output, as_attachment=True, filename=filename, content_type="application/pdf")


def apply_signatures(pdf_file, signature_file, placements):
    reader = PdfReader(pdf_file)
    writer = PdfWriter()
    signature_image = normalize_signature(signature_file)

    overlays_by_page = {}
    for placement in placements:
        page_index = int(placement["page"]) - 1
        if page_index < 0 or page_index >= len(reader.pages):
            raise ValueError("Signature page is out of range.")
        overlays_by_page.setdefault(page_index, []).append(placement)

    for page_index, page in enumerate(reader.pages):
        if page_index in overlays_by_page:
            page_width = float(page.mediabox.width)
            page_height = float(page.mediabox.height)
            overlay = build_overlay(page_width, page_height, signature_image, overlays_by_page[page_index])
            page.merge_page(overlay)
        writer.add_page(page)

    output = BytesIO()
    writer.write(output)
    output.seek(0)
    return output


def normalize_signature(signature_file):
    image = Image.open(signature_file)
    if image.mode not in ("RGBA", "LA"):
        image = image.convert("RGBA")

    buffer = BytesIO()
    image.save(buffer, format="PNG")
    buffer.seek(0)
    return buffer


def build_overlay(page_width, page_height, signature_image, placements):
    packet = BytesIO()
    pdf_canvas = canvas.Canvas(packet, pagesize=(page_width, page_height))
    image_reader = ImageReader(signature_image)
    image_width, image_height = image_reader.getSize()
    image_aspect_ratio = image_width / image_height

    for placement in placements:
        canvas_width = float(placement["canvasWidth"])
        canvas_height = float(placement["canvasHeight"])
        frontend_x = float(placement["x"])
        frontend_y = float(placement["y"])
        frontend_width = float(placement["width"])
        frontend_height = float(placement["height"])

        x = frontend_x / canvas_width * page_width
        width = frontend_width / canvas_width * page_width
        height = frontend_height / canvas_height * page_height
        y_from_top = frontend_y / canvas_height * page_height
        y = page_height - y_from_top - height
        draw_width, draw_height = contain_size(width, height, image_aspect_ratio)
        draw_x = x + (width - draw_width) / 2
        draw_y = y + (height - draw_height) / 2

        signature_image.seek(0)
        pdf_canvas.drawImage(
            image_reader,
            draw_x,
            draw_y,
            width=draw_width,
            height=draw_height,
            mask="auto",
        )

    pdf_canvas.save()
    packet.seek(0)
    return PdfReader(packet).pages[0]


def contain_size(box_width, box_height, aspect_ratio):
    box_aspect_ratio = box_width / box_height
    if box_aspect_ratio > aspect_ratio:
        height = box_height
        width = height * aspect_ratio
    else:
        width = box_width
        height = width / aspect_ratio

    return width, height
