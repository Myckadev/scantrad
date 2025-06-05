from ultralytics import YOLO
from PIL import Image
from io import BytesIO

from herlpers.extract_and_translate import extract_and_translate
from herlpers.draw import draw_translations

model = YOLO("scantrad/transformer/yolo_scan_model.pt")

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
    results = model(input_image)[0]

    yolo_boxes = yolo_prediction_to_yolo_format(results, input_image.size)

    translations = extract_and_translate(input_image, yolo_boxes)

    final_image = draw_translations(input_image, translations)

    return final_image
