import {baseApi} from "../baseApi.ts";


const fileUploadService = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    uploadBatch: builder.mutation<any, FormData>({
      query: (formData) => ({
        url: '/upload-batch',
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: ['PROGRESS'],
    }),
  }),
})

export const {
  useUploadBatchMutation,
} = fileUploadService;