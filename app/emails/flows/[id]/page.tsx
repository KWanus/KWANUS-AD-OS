import FlowPageClient from "./FlowPageClient";

export default async function FlowPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <FlowPageClient flowId={id} />;
}
