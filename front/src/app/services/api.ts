// app/services/api.ts - Adapté à l'API de Mikael
import { baseApi } from '../baseApi';

// Types adaptés à l'API backend de Mikael
export interface User {
  id: string;
  pseudo: string;
  created_at: string;
}

export interface PageData {
  page_id: string;
  filename: string;
  status: 'pending' | 'processing' | 'done' | 'error';
  original_image?: string; // base64
  translated_image?: string; // base64
  original_url: string;
  translated_url?: string;
}

export interface Batch {
  _id: string;
  user_id: string;
  pages_ids: string[];
  pages: Array<{status: string}>;
  created_at: string;
  status: 'pending' | 'processing' | 'done' | 'error';
}

export interface TranslatedPage {
  _id: string;
  page_id: string;
  user_id: string;
  batch_id: string;
  filename: string;
  original_image: string;
  translated_image: string;
  original_url: string;
  translated_url: string;
  translation_completed_at: string;
  processing_time_seconds: number;
}

export interface BatchStatusResponse {
  pages: PageData[];
}

export interface BatchResultResponse {
  pages: PageData[];
}

export interface UserBatchesResponse {
  batches: Batch[];
}

export interface UserTranslatedPagesResponse {
  translated_pages: TranslatedPage[];
}

export interface BatchTranslatedPagesResponse {
  translated_pages: TranslatedPage[];
}

export interface PageUploadRequest {
  filename: string;
  image_base64: string;
}

export interface UploadBatchRequest {
  pages: PageUploadRequest[];
}

// Helper pour gérer l'auth - pseudo stocké globalement ou via context
let currentUserPseudo = ''; // Vide au départ

export const setCurrentUser = (pseudo: string) => {
  currentUserPseudo = pseudo;
};

export const getCurrentUser = () => currentUserPseudo;

// Services API avec RTK Query adaptés à l'API de Mikael
export const apiService = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Authentification
    login: builder.mutation<{ pseudo: string; message: string }, string>({
      query: (pseudo) => ({
        url: '/auth/login',
        method: 'POST',
        body: { pseudo },
      }),
      onQueryStarted: async (pseudo, { queryFulfilled }) => {
        try {
          await queryFulfilled;
          setCurrentUser(pseudo);
        } catch (error) {
          console.error('Login failed:', error);
        }
      },
    }),

    // Upload d'un batch
    uploadBatch: builder.mutation<{ batchId: string }, UploadBatchRequest>({
      query: (uploadRequest) => ({
        url: '/upload-batch',
        method: 'POST',
        body: uploadRequest,
        headers: {
          'Content-Type': 'application/json',
          'X-User-Pseudo': getCurrentUser(),
        },
      }),
      invalidatesTags: (result, error, arg) => [
        'Batch',
        { type: 'UserBatches', id: getCurrentUser() }
      ],
    }),

    // Récupérer le statut d'un batch (avec polling)
    getBatchStatus: builder.query<BatchStatusResponse, string>({
      query: (batchId) => ({
        url: `/status/${batchId}`,
        headers: {
          'X-User-Pseudo': getCurrentUser(),
        },
      }),
      providesTags: (_, __, batchId) => [
        { type: 'Status', id: batchId }
      ],
    }),

    // Récupérer les résultats d'un batch
    getBatchResult: builder.query<BatchResultResponse, string>({
      query: (batchId) => ({
        url: `/result/${batchId}`,
        headers: {
          'X-User-Pseudo': getCurrentUser(),
        },
      }),
      providesTags: (_, __, batchId) => [
        { type: 'Result', id: batchId },
        { type: 'Batch', id: batchId }
      ],
    }),

    // Récupérer tous les batches d'un utilisateur
    getUserBatches: builder.query<UserBatchesResponse, string>({
      query: (pseudo) => `/user/${pseudo}/batches`,
      providesTags: (result, error, pseudo) => [
        'Batch',
        { type: 'UserBatches', id: pseudo }
      ],
      transformResponse: (response: UserBatchesResponse) => {
        return response;
      },
    }),

    // Récupérer toutes les pages traduites d'un utilisateur
    getUserTranslatedPages: builder.query<UserTranslatedPagesResponse, void>({
      query: () => {
        const pseudo = getCurrentUser();
        if (!pseudo) {
          throw new Error("Aucun pseudo utilisateur défini pour la récupération des pages traduites.");
        }
        return `/user/${pseudo}/translated-pages`;
      },
      providesTags: ['Result'],
    }),

    // Récupérer les pages traduites d'un batch spécifique
    getBatchTranslatedPages: builder.query<BatchTranslatedPagesResponse, string>({
      query: (batchId) => ({
        url: `/batch/${batchId}/translated-pages`,
        headers: {
          'X-User-Pseudo': getCurrentUser(),
        },
      }),
      providesTags: (_, __, batchId) => [
        { type: 'Result', id: batchId }
      ],
    }),

    // Debug endpoint
    getDebugStatus: builder.query<any, void>({
      query: () => '/debug/db-status',
    }),
  }),
});

export const {
  useLoginMutation,
  useUploadBatchMutation,
  useGetBatchStatusQuery,
  useGetBatchResultQuery,
  useGetUserBatchesQuery,
  useGetUserTranslatedPagesQuery,
  useGetBatchTranslatedPagesQuery,
  useGetDebugStatusQuery,
} = apiService;

// Helper pour transformer les données de l'API vers le format attendu par les composants
export const transformBatchToDisplayFormat = (batch: Batch) => ({
  id: batch._id,
  userId: batch.user_id,
  createdAt: batch.created_at,
  status: batch.status,
  totalPages: batch.pages.length,
  completedPages: batch.pages.filter(p => p.status === 'done').length,
  pages: batch.pages.map(page => ({
    id: page.page_id,
    filename: page.filename,
    status: page.status,
    originalUrl: page.original_url,
    translatedUrl: page.translated_url,
    detectedBubbles: Math.floor(Math.random() * 10) + 1, // Mock jusqu'à ce que l'API le fournisse
    translatedTexts: [], // À remplir quand l'API le fournira
    processingTime: 8, // Mock - 8 secondes comme dans l'API
  }))
});

export const transformTranslatedPageToDisplayFormat = (page: TranslatedPage) => ({
  id: page.page_id,
  batchId: page.batch_id,
  filename: page.filename,
  originalUrl: page.original_url,
  translatedUrl: page.translated_url,
  detectedBubbles: Math.floor(Math.random() * 10) + 1, // Mock
  translatedTexts: [], // À remplir
  processingTime: page.processing_time_seconds,
  status: 'done' as const,
});