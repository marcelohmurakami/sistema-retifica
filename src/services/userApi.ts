import { supabase } from "./supabaseApi";

export async function getCurrentUser () {
    const { data, error } = await supabase.auth.getUser();

    if (error) throw new Error(error.message);

    return data.user;
}

export async function updateUserProfile (data: {
    name?: string;
    email?: string;
    avatarUrl?: string;
}) {
    const { data: result, error } = await supabase.auth.updateUser({
        email: data.email,
        data: {
            name: data.name,
            avatar_url: data.avatarUrl,
        }
    })

    if (error) throw new Error(error.message);

    return result.user;
}

export async function updatePassword (newPassword: string) {
    const { data, error } = await supabase.auth.updateUser({
        password: newPassword,
    })
    
    if (error) throw new Error(error.message);

    return data.user;
}

export async function uploadAvatar(file: File) {
    const user = await getCurrentUser();

    if (!user) throw new Error("Usuário não autenticado");

    const fileExt = file.name.split('.').pop();
    const filePath = `${user.id}/avatar.${fileExt}`;

    const { error } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

    if (error) throw new Error(error.message);

    const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

    return data.publicUrl;
}

