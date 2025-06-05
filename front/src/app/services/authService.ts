import {baseApi} from "../baseApi.ts";


export const authService  =  baseApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<{ token: string }, { username: string, password: string }>({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
      invalidatesTags: ['STATUS'],
    }),
    logout: builder.mutation<void, void>({
      query: () => ({
        url: '/auth/logout',
        method: 'POST',
      }),
      invalidatesTags: ['STATUS'],
    }),
  }),
})

export const {
  useLoginMutation,
  useLogoutMutation,
} = authService;