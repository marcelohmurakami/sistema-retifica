import Swal from "sweetalert2";

export async function handleDelete(
  id: number | undefined,
  mutate: (id: number) => void | undefined,
  text: string
) {
  const result = await Swal.fire({
    title: "Excluir " + text + "?",
    text: "Essa ação não poderá ser desfeita.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Sim, excluir",
    cancelButtonText: "Cancelar",
    confirmButtonColor: "#dc2626",
    cancelButtonColor: "#6b7280",
    reverseButtons: true,
    customClass: {
        popup: "rounded-xl",
        confirmButton: "bg-red-600 px-4 py-2 rounded-lg text-white",
        cancelButton: "bg-gray-200 px-4 py-2 rounded-lg text-gray-800",
    },
  });

  if (!result.isConfirmed || id === undefined) return;

  mutate(id);
}