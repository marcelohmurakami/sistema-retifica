import { z } from "zod";

export type ClienteCreateInput = z.infer<typeof clienteSchema>;

export const clienteSchema = z.object({
  cliente: z
    .string()
    .trim()
    .min(3, { error: "O nome do cliente precisa ter pelo menos 3 caracteres." }),

    cpfcnpj: z
    .string()
    .trim(),

  telefone1: z
    .string()
    .trim()
    .min(10, { error: "Telefone inválido." }),

  telefone2: z
  .string()
  .trim()
  .min(10, { error: "Telefone inválido." }),


  endereco: z
    .string()
    .trim()
    .min(5, { error: "Endereço muito curto." }),

    oficina: z
    .string()
    .trim()
    .min(3, { error: "Nome da oficina muito pequeno" }),
});