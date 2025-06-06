from ultralytics import YOLO
from PIL import Image,ImageDraw, ImageFont
from io import BytesIO
import os
from pathlib import Path
import torch
import ultralytics.nn.tasks
from ultralytics.nn.tasks import DetectionModel
# Correction : retirer C3k de l'import (il n'existe pas dans ultralytics.nn.modules.block)
from ultralytics.nn.modules.block import C3k2
import pytesseract
from transformers import MarianTokenizer, MarianMTModel
import string
import textwrap

# Charger le modèle de manière dynamique
def find_model_path():
    """Trouve le chemin du modèle YOLO dans le dossier app"""
    current_file = Path(__file__).resolve()
    app_dir = current_file.parent  # dossier 'app'
    model_path = app_dir / "best.pt"
    if model_path.exists():
        print(f"Modèle YOLO trouvé: {model_path}")
        return str(model_path)
    print("Modèle YOLO non trouvé dans le dossier app")
    return None

# Autoriser les objets nécessaires à la désérialisation dans PyTorch >= 2.6
torch.serialization.add_safe_globals([
    torch.nn.modules.container.Sequential,
    DetectionModel,
    # Retirer C3k ici aussi
    C3k2
])

model_path = find_model_path()

if model_path:
    try:
        # Charger directement le modèle YOLO à partir du chemin du fichier .pt
        yolo_model = YOLO(model_path)
        print("Modèle YOLO chargé avec succès.")
    except Exception as e:
        print(f"Erreur lors du chargement du modèle YOLO : {e}")
        yolo_model = None
else:
    print("Aucun chemin de modèle trouvé.")
    yolo_model = None

def yolo_prediction_to_yolo_format(results, image_size):#ce print pour debug
    width, height = image_size
    yolo_boxes = []
    width, height = image_size
    for box in results.boxes:
        x1, y1, x2, y2 = box.xyxy[0]
        x_center = ((x1 + x2) / 2) / width
        y_center = ((y1 + y2) / 2) / height
        box_width = (x2 - x1) / width
        box_height = (y2 - y1) / height
        yolo_boxes.append((x_center.item(), y_center.item(), box_width.item(), box_height.item()))
    return yolo_boxes

model_name = 'Helsinki-NLP/opus-mt-en-fr'
tokenizer = MarianTokenizer.from_pretrained(model_name)
translation_model = MarianMTModel.from_pretrained(model_name)

def yolo_to_pixel(box, img_width, img_height):
    x_center, y_center, w, h = box
    x_center *= img_width
    y_center *= img_height
    w *= img_width
    h *= img_height

    left = max(0, int(x_center - w / 2))
    top = max(0, int(y_center - h / 2))
    right = min(img_width, int(x_center + w / 2))
    bottom = min(img_height, int(y_center + h / 2))

    # Skip invalid or zero-size boxes
    if right <= left or bottom <= top:
        return None

    return (left, top, right, bottom)


def clean_text(region):
    text = pytesseract.image_to_string(region).strip()
    text = text.replace('\n', ' ').replace('\t', ' ').replace('- ', '-')
    punct_to_remove = string.punctuation.replace("'", "")
    translator = str.maketrans('', '', punct_to_remove)
    cleaned_text = text.translate(translator).lower()
    return cleaned_text

def extract_and_translate(image, yolo_boxes):
    width, height = image.size
    results = []

    for box in yolo_boxes:
        pixel_box = yolo_to_pixel(box, width, height)
        if pixel_box is None:
            continue
        
        region = image.crop(pixel_box)
        text = clean_text(region)

        if text:
            inputs = tokenizer(text, return_tensors="pt", truncation=True)
            output = translation_model.generate(**inputs)
            french = tokenizer.decode(output[0], skip_special_tokens=True)
            results.append((pixel_box, french))
        else:
            results.append((pixel_box, ""))

    return results

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



def process_image(input_image: Image.Image) -> Image.Image:
    if yolo_model is None:
        print("Model not available, returning original image")
        return input_image    
    try:
        results_list = yolo_model(input_image)
        results = results_list[0]
        print(f"Nombre de boxes détectées : {len(results.boxes)}")  
        yolo_boxes = yolo_prediction_to_yolo_format(results, input_image.size)
        print(f"Boîtes YOLO converties : {yolo_boxes}")  # Debug print
        translations = extract_and_translate(input_image, yolo_boxes)
        print(f"Traductions extraites : {translations}")  # Debug print
        final_image = draw_translations(input_image, translations)
        print("Image traitée avec succès.")
        return final_image
    except Exception as e:
        print(f"Error processing image: {e}")
        return input_image