import { redirect } from "next/navigation";

export default function LocalizedSimpleCoreApplicationPage({
  params
}: {
  params: { id: string };
}) {
  redirect(`/app/application/${params.id}`);
}
