// Store simple pour gérer les batches
// Utilise localStorage pour persister les données

export interface ProcessedPage {
  id: string;
  filename: string;
  originalUrl: string;
  translatedUrl: string;
  status: 'pending' | 'processing' | 'done' | 'error';
  detectedBubbles: number;
  translatedTexts: string[];
  processingTime: number;
  file?: File;
}

export interface Batch {
  id: string;
  status: 'pending' | 'processing' | 'done' | 'error';
  pages: ProcessedPage[];
  createdAt: string;
  completedAt?: string;
}

class BatchStore {
  private batches: Map<string, Batch> = new Map();

  constructor() {
    this.loadFromStorage();
  }

  // Charger depuis localStorage
  private loadFromStorage() {
    try {
      const stored = localStorage.getItem('scantrad_batches');
      if (stored) {
        const data = JSON.parse(stored);
        this.batches = new Map(Object.entries(data));
      }
    } catch (error) {
      console.warn('Erreur lors du chargement des batches:', error);
    }
  }

  // Sauvegarder en localStorage
  private saveToStorage() {
    try {
      const data = Object.fromEntries(this.batches);
      localStorage.setItem('scantrad_batches', JSON.stringify(data));
    } catch (error) {
      console.warn('Erreur lors de la sauvegarde des batches:', error);
    }
  }

  // Créer un nouveau batch
  createBatch(files: File[]): string {
    const batchId = `batch_${Date.now()}`;
    
    const pages: ProcessedPage[] = files.map((file, index) => ({
      id: `page_${index + 1}`,
      filename: file.name,
      originalUrl: URL.createObjectURL(file),
      translatedUrl: '', // Sera généré après traitement
      status: 'pending',
      detectedBubbles: 0,
      translatedTexts: [],
      processingTime: 0,
      file
    }));

    const batch: Batch = {
      id: batchId,
      status: 'pending',
      pages,
      createdAt: new Date().toISOString()
    };

    this.batches.set(batchId, batch);
    this.saveToStorage();
    
    return batchId;
  }

  // Récupérer un batch
  getBatch(batchId: string): Batch | undefined {
    return this.batches.get(batchId);
  }

  // Récupérer tous les batches
  getAllBatches(): Batch[] {
    return Array.from(this.batches.values()).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  // Mettre à jour le statut d'une page
  updatePageStatus(batchId: string, pageId: string, updates: Partial<ProcessedPage>) {
    const batch = this.batches.get(batchId);
    if (!batch) return;

    const pageIndex = batch.pages.findIndex(p => p.id === pageId);
    if (pageIndex === -1) return;

    batch.pages[pageIndex] = { ...batch.pages[pageIndex], ...updates };
    
    // Vérifier si toutes les pages sont terminées
    const allDone = batch.pages.every(p => p.status === 'done');
    if (allDone && batch.status !== 'done') {
      batch.status = 'done';
      batch.completedAt = new Date().toISOString();
    }

    this.batches.set(batchId, batch);
    this.saveToStorage();
  }

  // Mettre à jour le statut du batch
  updateBatchStatus(batchId: string, status: Batch['status']) {
    const batch = this.batches.get(batchId);
    if (!batch) return;

    batch.status = status;
    if (status === 'done') {
      batch.completedAt = new Date().toISOString();
    }

    this.batches.set(batchId, batch);
    this.saveToStorage();
  }

  // Simuler le traitement d'un batch
  async processBatch(batchId: string, onProgress?: (pageId: string, progress: number, status: ProcessedPage['status']) => void) {
    const batch = this.batches.get(batchId);
    if (!batch) return;

    batch.status = 'processing';
    this.saveToStorage();

    for (let i = 0; i < batch.pages.length; i++) {
      const page = batch.pages[i];
      
      // Marquer comme en cours
      this.updatePageStatus(batchId, page.id, { 
        status: 'processing',
        detectedBubbles: Math.floor(Math.random() * 8) + 2
      });
      
      onProgress?.(page.id, 0, 'processing');

      // Simulation de progression
      for (let progress = 0; progress <= 100; progress += 20) {
        await new Promise(resolve => setTimeout(resolve, 300));
        onProgress?.(page.id, progress, 'processing');
      }

      // Générer l'URL traduite (simulation)
      const translatedUrl = this.generateTranslatedImage(page.originalUrl, i + 1);
      const translatedTexts = [
        `Dialogue traduit ${i + 1}A`,
        `Dialogue traduit ${i + 1}B`,
        `Pensée traduite ${i + 1}`,
      ];

      // Marquer comme terminé
      this.updatePageStatus(batchId, page.id, {
        status: 'done',
        translatedUrl,
        translatedTexts,
        processingTime: Math.floor(Math.random() * 30) + 10
      });

      onProgress?.(page.id, 100, 'done');
    }
  }

  // Générer une version "traduite" simulée
  private generateTranslatedImage(originalUrl: string, pageNumber: number): string {
    // Pour la démo, on génère un SVG simulé basé sur l'original
    return `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="400"><rect width="300" height="400" fill="%23f5f5f5"/><rect x="20" y="30" width="260" height="50" fill="%234caf50" stroke="%23388e3c" stroke-width="2"/><text x="150" y="60" text-anchor="middle" font-size="14" fill="%23fff">✨ Traduit ${pageNumber}</text><circle cx="150" cy="200" r="80" fill="%23c8e6c9"/><text x="150" y="205" text-anchor="middle" font-size="12" fill="%232e7d32">Page ${pageNumber}</text><text x="150" y="350" text-anchor="middle" font-size="10" fill="%23666">Basé sur: ${originalUrl.slice(0, 20)}...</text></svg>`;
  }

  // Supprimer un batch
  deleteBatch(batchId: string) {
    const batch = this.batches.get(batchId);
    if (batch) {
      // Nettoyer les URLs d'objets
      batch.pages.forEach(page => {
        if (page.originalUrl.startsWith('blob:')) {
          URL.revokeObjectURL(page.originalUrl);
        }
      });
    }
    
    this.batches.delete(batchId);
    this.saveToStorage();
  }

  // Nettoyer tous les batches
  clearAll() {
    this.batches.forEach(batch => {
      batch.pages.forEach(page => {
        if (page.originalUrl.startsWith('blob:')) {
          URL.revokeObjectURL(page.originalUrl);
        }
      });
    });
    
    this.batches.clear();
    localStorage.removeItem('scantrad_batches');
  }
}

// Instance globale
export const batchStore = new BatchStore();