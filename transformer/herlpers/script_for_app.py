from ultralytics import YOLO
from PIL import Image
from io import BytesIO
import os
from pathlib import Path
import torch
import ultralytics.nn.tasks
from ultralytics.nn.tasks import DetectionModel
from herlpers.extract_and_translate import extract_and_translate
from herlpers.draw import draw_translations

# Charger le modèle de manière dynamique
def find_model_path():
    """Trouve le chemin du modèle YOLO de manière dynamique"""
    current_file = Path(__file__).resolve()

    # Chemins possibles relatifs au projet
    possible_paths = [
        current_file.parent.parent / "yolo_scan_model.pt",
        current_file.parent.parent.parent / "yolo_scan_model.pt",
        current_file.parent.parent / "transformer" / "yolo_scan_model.pt"
    ]

    # Chercher dans les dossiers parents pour "scantrad"
    for parent in current_file.parents:
        if parent.name == "scantrad":
            possible_paths.extend([
                parent / "transformer" / "yolo_scan_model.pt",
                parent / "yolo_scan_model.pt"
            ])
            break

    for path in possible_paths:
        if path.exists():
            print(f"Modèle YOLO trouvé: {path}")
            return str(path)

    print("Modèle YOLO non trouvé dans les emplacements standards")
    return None

# Autoriser les objets nécessaires à la désérialisation dans PyTorch >= 2.6
torch.serialization.add_safe_globals([
    torch.nn.modules.container.Sequential,
    DetectionModel
])

model_path = find_model_path()

if model_path:
    try:
        # Forcer le chargement complet (pas seulement des poids)
        ckpt = torch.load(model_path, map_location='cpu', weights_only=False)
        model = YOLO(model=ckpt)
        print("Modèle YOLO chargé avec succès.")
    except Exception as e:
        print(f"Erreur lors du chargement du modèle YOLO : {e}")
        model = None
else:
    print("Aucun chemin de modèle trouvé.")
    model = None

def yolo_prediction_to_yolo_format(results, image_size):
    width, height = image_size
    yolo_boxes = []

    for box in results.boxes:
        x1, y1, x2, y2 = box.xyxy[0]
        x_center = ((x1 + x2) / 2) / width
        y_center = ((y1 + y2) / 2) / height
        box_width = (x2 - x1) / width
        box_height = (y2 - y1) / height
        yolo_boxes.append((x_center.item(), y_center.item(), box_width.item(), box_height.item()))

    return yolo_boxes

def process_image(input_image: Image.Image) -> Image.Image:
    if model is None:
        print("Model not available, returning original image")
        return input_image

    try:
        results = model(input_image)[0]
        yolo_boxes = yolo_prediction_to_yolo_format(results, input_image.size)
        translations = extract_and_translate(input_image, yolo_boxes)
        final_image = draw_translations(input_image, translations)
        return final_image
    except Exception as e:
        print(f"Error processing image: {e}")
        return input_image
