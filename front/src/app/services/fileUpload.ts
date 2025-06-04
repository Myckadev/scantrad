import {baseApi} from "../baseApi.ts";


const fileUploadService = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    uploadFile: builder.mutation<any, any>({
      query: (formData) => ({
        url: '/upload',
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: ['PROGRESS'],
    }),
  }),
})

export const {
  useUploadFileMutation,
} = fileUploadService;