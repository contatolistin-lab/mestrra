import { createFileRoute } from "@tanstack/react-router";
import { Auth } from "@/components/mestrra/auth";
import { routeMeta } from "@/lib/mestrra";
export const Route = createFileRoute("/reset-password")({
  head: () => routeMeta("Recuperar acesso", "Defina uma nova senha para sua conta Mestrra."),
  component: () => <Auth recovery />,
});
