export const authKeys = {
  all: ['auth'] as const,
  memberships: (userId: string) =>
    [...authKeys.all, 'usuarios-empresas', userId] as const,
}
