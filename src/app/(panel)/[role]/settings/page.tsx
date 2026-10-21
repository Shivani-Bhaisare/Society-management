import { notFound } from "next/navigation";
import SettingsView from "@/Components/SettingsView";

const VALID_ROLES = ["president", "secretary", "treasurer"];

export default async function Page({ params }: { params: Promise<{ role: string }> }) {
  const { role } = await params;
  if (!VALID_ROLES.includes(role)) notFound();

  return <SettingsView />;
}