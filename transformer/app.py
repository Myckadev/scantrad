from flask import Flask, request, render_template_string
from PIL import Image
from io import BytesIO
import base64

from herlpers.script_for_app import process_image 

app = Flask(__name__)

HTML_TEMPLATE = """
<!doctype html>
<title>Manga Translator</title>
<h1>Upload a manga page</h1>
<form method="post" enctype="multipart/form-data" action="/translate">
  <input type="file" name="image" accept="image/*">
  <input type="submit" value="Translate">
</form>

{% if result_img %}
  <h2>Translated Result:</h2>
  <img src="data:image/png;base64,{{ result_img }}" style="max-width:100%%; height:auto;">
{% endif %}
"""

@app.route("/", methods=["GET"])
def index():
    return render_template_string(HTML_TEMPLATE)

@app.route("/translate", methods=["POST"])
def translate_image():
    if 'image' not in request.files:
        return "No image uploaded", 400

    file = request.files['image']
    if file.filename == '':
        return "Empty file name", 400

    image = Image.open(file.stream).convert("RGB")
    translated_img = process_image(image)

    buf = BytesIO()
    translated_img.save(buf, format='PNG')
    buf.seek(0)
    img_base64 = base64.b64encode(buf.read()).decode('utf-8')

    return render_template_string(HTML_TEMPLATE, result_img=img_base64)

if __name__ == "__main__":
    app.run(debug=True)