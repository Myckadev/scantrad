from PIL import Image
import pytesseract
from transformers import MarianTokenizer, MarianMTModel
import string

# Pour Linux/Mac, Tesseract doit être dans le PATH, donc cette ligne peut être commentée ou adaptée :
# pytesseract.pytesseract.tesseract_cmd = r'/usr/bin/tesseract'  # Exemple pour Linux
# Si tesseract est dans le PATH, ne rien mettre :
# pytesseract.pytesseract.tesseract_cmd = r'C:/Program Files/Tesseract-OCR/tesseract.exe'

model_name = 'Helsinki-NLP/opus-mt-en-fr'
tokenizer = MarianTokenizer.from_pretrained(model_name)
model = MarianMTModel.from_pretrained(model_name)

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
            output = model.generate(**inputs)
            french = tokenizer.decode(output[0], skip_special_tokens=True)
            results.append((pixel_box, french))
        else:
            results.append((pixel_box, ""))

    return results
