import {createApi, fetchBaseQuery} from '@reduxjs/toolkit/query/react'
import {BASE_API_URL} from "./env";

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({ baseUrl: `${BASE_API_URL}`}),
  tagTypes: ['PROGRESS', 'USER'],
  endpoints: () => ({})
})