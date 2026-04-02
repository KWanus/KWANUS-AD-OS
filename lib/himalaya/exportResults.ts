import type { HimalayaResultsViewModel, AssetGroup } from "./types";

function assetGroupToText(group: AssetGroup): string {
  const lines: string[] = [`## ${group.title}`];

  if (group.type === "text") {
    lines.push(group.content as string);
  } else if (group.type === "list") {
    for (const item of group.content as string[]) {
      lines.push(`- ${item}`);
    }
  } else if (group.type === "kv") {
    for (const { label, value } of group.content as { label: string; value: string }[]) {
      lines.push(`**${label}:** ${value}`);
    }
  } else if (group.type === "scripts") {
    for (const script of group.content as { title: string; duration: string; sections: { timestamp: string; direction: string; copy: string }[] }[]) {
      lines.push(`### ${script.title} (${script.duration})`);
      for (const s of script.sections) {
        lines.push(`[${s.timestamp}] ${s.direction}`);
        lines.push(`  "${s.copy}"`);
      }
    }
  }

  return lines.join("\n");
}

export function exportSummary(vm: HimalayaResultsViewModel): string {
  const parts: string[] = [
    `# ${vm.title}`,
    `Mode: ${vm.modeLabel} | Score: ${vm.score}/100 | Status: ${vm.statusLabel}`,
    "",
    vm.summary,
    "",
  ];

  if (vm.priorities.length > 0) {
    parts.push("## Top Priorities");
    for (const p of vm.priorities) {
      parts.push(`${p.label}`);
      parts.push(`  Why: ${p.reason}`);
      parts.push(`  Next: ${p.nextStep}`);
    }
    parts.push("");
  }

  if (vm.notes.length > 0) {
    parts.push("## Notes");
    for (const n of vm.notes) {
      parts.push(`- ${n}`);
    }
    parts.push("");
  }

  return parts.join("\n");
}

export function exportAllResults(vm: HimalayaResultsViewModel): string {
  const parts: string[] = [
    exportSummary(vm),
    "",
  ];

  if (vm.assetGroups.length > 0) {
    parts.push("---");
    parts.push("");
    for (const group of vm.assetGroups) {
      parts.push(assetGroupToText(group));
      parts.push("");
    }
  }

  return parts.join("\n");
}

export function exportJSON(vm: HimalayaResultsViewModel): string {
  return JSON.stringify(
    {
      title: vm.title,
      mode: vm.mode,
      modeLabel: vm.modeLabel,
      score: vm.score,
      verdict: vm.verdict,
      status: vm.statusLabel,
      summary: vm.summary,
      inputUrl: vm.inputUrl,
      createdAt: vm.createdAt,
      priorities: vm.priorities,
      assetGroups: vm.assetGroups.map((g) => ({
        title: g.title,
        type: g.type,
        content: g.content,
      })),
      notes: vm.notes,
      dimensions: vm.dimensions,
    },
    null,
    2
  );
}
