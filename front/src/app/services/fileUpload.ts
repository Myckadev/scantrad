import { baseApi } from '../baseApi';

export interface ProcessedPage {
  id: string;
  status: 'pending' | 'uploading' | 'processing' | 'done' | 'error';
  imageUrl: string;
  previewUrl?: string;
  progress?: number;
}

export interface Batch {
  id: string;
  createdAt: string; // ISO string
  status: 'pending' | 'processing' | 'done' | 'error';
  pages: ProcessedPage[];
}

export const batchApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getBatches: builder.query<Batch[], void>({
      query: () => '/batches',
      providesTags: ['BATCH'],
    }),
    getBatch: builder.query<Batch, string>({
      query: (id) => `/batches/${id}`,
      providesTags: (result, error, id) => [{ type: 'BATCH', id }],
    }),
    createBatch: builder.mutation<Batch, FormData>({
      query: (formData) => ({
        url: '/batches',
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: ['BATCH'],
    }),
    processBatch: builder.mutation<Batch, { batchId: string }>({
      query: ({ batchId }) => ({
        url: `/batches/${batchId}/process`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, { batchId }) => [{ type: 'BATCH', id: batchId }],
    }),
    updatePage: builder.mutation<ProcessedPage, { batchId: string, pageId: string, data: Partial<ProcessedPage> }>({
      query: ({ batchId, pageId, data }) => ({
        url: `/batches/${batchId}/pages/${pageId}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (result, error, { batchId }) => [{ type: 'BATCH', id: batchId }]
    }),
  }),
});

export const {
  useGetBatchesQuery,
  useGetBatchQuery,
  useCreateBatchMutation,
  useProcessBatchMutation,
  useUpdatePageMutation,
} = batchApi;