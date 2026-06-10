"use client";

import { Loader2 } from "lucide-react";

interface ToolInvocationBadgeProps {
  toolInvocation: {
    toolCallId: string;
    toolName: string;
    args: Record<string, unknown>;
    state: string;
    result?: unknown;
  };
}

export function getToolLabel(
  toolName: string,
  args: Record<string, unknown>
): string {
  const path = typeof args.path === "string" ? args.path : null;
  const command = typeof args.command === "string" ? args.command : null;

  if (toolName === "str_replace_editor") {
    switch (command) {
      case "create":
        return path ? `Creating ${path}` : "Creating file";
      case "str_replace":
      case "insert":
        return path ? `Editing ${path}` : "Editing file";
      case "view":
        return path ? `Viewing ${path}` : "Viewing file";
      case "undo_edit":
        return path ? `Undoing edit to ${path}` : "Undoing edit";
      default:
        return "Editing file";
    }
  }

  if (toolName === "file_manager") {
    switch (command) {
      case "delete":
        return path ? `Deleting ${path}` : "Deleting file";
      case "rename":
        return path ? `Renaming ${path}` : "Renaming file";
      default:
        return "Managing file";
    }
  }

  return toolName;
}

export function ToolInvocationBadge({
  toolInvocation,
}: ToolInvocationBadgeProps) {
  const { toolName, args, state, result } = toolInvocation;
  const label = getToolLabel(toolName, args);
  const isDone = state === "result" && result !== undefined;

  return (
    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-50 rounded-lg text-xs font-mono border border-neutral-200">
      {isDone ? (
        <div className="w-2 h-2 rounded-full bg-emerald-500" />
      ) : (
        <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
      )}
      <span className="text-neutral-700">{label}</span>
    </div>
  );
}
