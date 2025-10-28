import * as z from "zod";

export const paramsWithIdSchema = z.object({
  id: z.string().min(1, "Invalid id"),
});

export type ParamsWithId = z.infer<typeof paramsWithIdSchema>;

export interface ErrorResponse {
  error: {
    message: string;
    stack?: string;
  };
}

export interface RequestValidators {
  params?: any;
  body?: any;
  query?: any;
}

export interface TokensResponseInterface {
  access_token: string;
  refresh_token?: string;
}

export interface ParsedToken {
  exp: number;
  userId: string;
  name: string;
}
