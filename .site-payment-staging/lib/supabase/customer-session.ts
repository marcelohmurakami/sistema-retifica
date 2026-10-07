import "server-only";

import { cache } from "react";
import type { CustomerAccount } from "@/lib/customer-account";
import { createServerSupabase } from "@/lib/supabase/server";

export const getAuthenticatedCustomerAccount = cache(
  async (companyId: number): Promise<CustomerAccount | null> => {
    const supabase = await createServerSupabase();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) return null;

    const { data, error } = await supabase.rpc("obter_area_cliente_site", {
      p_id_empresa: companyId,
    });
    if (error || !data) return null;

    const account = data as CustomerAccount;
    return {
      ...account,
      cliente: {
        ...account.cliente,
        email: account.cliente.email ?? user.email ?? null,
      },
    };
  },
);
