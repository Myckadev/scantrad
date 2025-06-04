from PIL import ImageDraw, ImageFont
import textwrap

def draw_wrapped_text(draw, box, text, font):
    left, top, right, bottom = box
    box_width = right - left
    box_height = bottom - top
    lines = textwrap.wrap(text, width=25)

    bbox = font.getbbox("A")
    line_height = bbox[3] - bbox[1] + 2
    total_height = line_height * len(lines)
    y_text = top + (box_height - total_height) // 2

    for line in lines:
        bbox_line = font.getbbox(line)
        line_width = bbox_line[2] - bbox_line[0]
        x_text = left + (box_width - line_width) // 2
        draw.text((x_text, y_text), line, font=font, fill="black")
        y_text += line_height

def draw_translations(image, translations, font_path=None):
    draw = ImageDraw.Draw(image)
    try:
        font = ImageFont.truetype(font_path or "arial.ttf", size=16)
    except:
        font = ImageFont.load_default()
    
    for box, text in translations:
        draw.rectangle(box, fill="white")
        if text:
            draw_wrapped_text(draw, box, text, font)

    return image
