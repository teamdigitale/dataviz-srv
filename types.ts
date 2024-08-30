import * as z from "zod";

export const paramsWithIdSchema = z.object({
  id: z.string().min(1, "Invalid id"),
});

export type ParamsWithId = z.infer<typeof paramsWithIdSchema>;

export interface MessageResponse {
  message: string;
}

export interface ErrorResponse extends MessageResponse {
  stack?: string;
}

export interface RequestValidators {
  params?: z.AnyZodObject;
  body?: z.AnyZodObject;
  query?: z.AnyZodObject;
}

export interface TokensResponseInterface {
  access_token: string;
  refresh_token?: string;
}
