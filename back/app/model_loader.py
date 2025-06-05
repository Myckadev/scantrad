import sys
import os
from pathlib import Path
from ultralytics import YOLO
from transformers import MarianTokenizer, MarianMTModel

# Trouver dynamiquement le répertoire racine du projet "scantrad"
def find_project_root():
    """Trouve le répertoire racine du projet de manière dynamique"""
    current_file = Path(__file__).resolve()
    
    # Remonter dans l'arborescence jusqu'à trouver le dossier "scantrad"
    for parent in current_file.parents:
        if parent.name == "scantrad":
            return parent
    
    # Fallback: essayer de trouver via le nom du dossier
    current_dir = Path.cwd()
    for parent in [current_dir] + list(current_dir.parents):
        if parent.name == "scantrad" or (parent / "transformer").exists():
            return parent
    
    return None

def find_yolo_model_path():
    """Trouve le chemin du modèle YOLO de manière dynamique"""
    project_root = find_project_root()
    
    if not project_root:
        print("Impossible de détecter le répertoire racine du projet")
        return None
    
    # Chemins possibles relatifs au projet
    possible_paths = [
        project_root / "transformer" / "yolo_scan_model.pt",
        project_root / "yolo_scan_model.pt",
        project_root / "models" / "yolo_scan_model.pt"
    ]
    
    # Tester chaque chemin
    for path in possible_paths:
        if path.exists():
            print(f"Modèle YOLO trouvé: {path}")
            return str(path)
    
    print(f"Modèle YOLO non trouvé dans: {[str(p) for p in possible_paths]}")
    return None

# Ajouter le chemin du projet au sys.path de manière dynamique
project_root = find_project_root()
if project_root:
    transformer_path = str(project_root)
    if transformer_path not in sys.path:
        sys.path.insert(0, transformer_path)
    print(f"Chemin du projet ajouté: {project_root}")

class ModelLoader:
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(ModelLoader, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance
    
    def __init__(self):
        if self._initialized:
            return
        
        print("Loading models...")
        
        # Charger le modèle YOLO avec détection dynamique
        model_path = find_yolo_model_path()
        if model_path:
            self.yolo_model = YOLO(model_path)
            print("Modèle YOLO chargé avec succès")
        else:
            print("Modèle YOLO non trouvé")
            self.yolo_model = None
        
        # Charger le modèle de traduction
        try:
            model_name = 'Helsinki-NLP/opus-mt-en-fr'
            self.tokenizer = MarianTokenizer.from_pretrained(model_name)
            self.translation_model = MarianMTModel.from_pretrained(model_name)
            print("Modèle de traduction chargé avec succès")
        except Exception as e:
            print(f"Erreur lors du chargement du modèle de traduction: {e}")
            self.tokenizer = None
            self.translation_model = None
        
        self._initialized = True
        print("Models loading completed!")

# Instance globale
model_loader = ModelLoader()
