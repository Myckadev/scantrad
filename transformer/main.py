from PIL import Image
from herlpers.extract_and_translate import extract_and_translate
from herlpers.draw import draw_translations
from tqdm import tqdm
import os

# =========================================== PATHS
image_dir = "scantrad/data/train/images"
label_dir = "scantrad/data/train/labels"
output_dir = "scantrad/data/train/translated_images"
os.makedirs(output_dir, exist_ok=True)

image_files = [f for f in os.listdir(image_dir) if f.endswith(".jpg")]

# =========================================== TRANSLATING IMAGES
for image_file in tqdm(image_files, desc="Translating images"):
    image_path = os.path.join(image_dir, image_file)
    label_file = os.path.splitext(image_file)[0] + ".txt"
    label_path = os.path.join(label_dir, label_file)

    if not os.path.exists(image_path) or not os.path.exists(label_path):
        continue

    image = Image.open(image_path).convert("RGB")

    yolo_boxes = []
    with open(label_path, 'r') as f:
        for line in f:
            parts = line.strip().split()
            if len(parts) == 5:
                _, x, y, w, h = map(float, parts)
                yolo_boxes.append((x, y, w, h))

    translations = extract_and_translate(image, yolo_boxes)
    translated_img = draw_translations(image, translations)
    
    # =========================================== SAVING IMAGES
    output_path = os.path.join(output_dir, image_file)
    translated_img.save(output_path)