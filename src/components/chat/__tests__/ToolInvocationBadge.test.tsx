import { test, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import {
  ToolInvocationBadge,
  getToolLabel,
} from "../ToolInvocationBadge";

afterEach(() => {
  cleanup();
});

// --- getToolLabel unit tests ---

test("getToolLabel: str_replace_editor create with path", () => {
  expect(
    getToolLabel("str_replace_editor", { command: "create", path: "/App.jsx" })
  ).toBe("Creating /App.jsx");
});

test("getToolLabel: str_replace_editor str_replace with path", () => {
  expect(
    getToolLabel("str_replace_editor", {
      command: "str_replace",
      path: "/components/Button.jsx",
    })
  ).toBe("Editing /components/Button.jsx");
});

test("getToolLabel: str_replace_editor insert with path", () => {
  expect(
    getToolLabel("str_replace_editor", { command: "insert", path: "/config.js" })
  ).toBe("Editing /config.js");
});

test("getToolLabel: str_replace_editor view with path", () => {
  expect(
    getToolLabel("str_replace_editor", { command: "view", path: "/App.jsx" })
  ).toBe("Viewing /App.jsx");
});

test("getToolLabel: str_replace_editor undo_edit with path", () => {
  expect(
    getToolLabel("str_replace_editor", {
      command: "undo_edit",
      path: "/App.jsx",
    })
  ).toBe("Undoing edit to /App.jsx");
});

test("getToolLabel: str_replace_editor unknown command falls back to 'Editing file'", () => {
  expect(getToolLabel("str_replace_editor", {})).toBe("Editing file");
});

test("getToolLabel: file_manager delete with path", () => {
  expect(
    getToolLabel("file_manager", { command: "delete", path: "/old.jsx" })
  ).toBe("Deleting /old.jsx");
});

test("getToolLabel: file_manager rename with path", () => {
  expect(
    getToolLabel("file_manager", { command: "rename", path: "/old.jsx" })
  ).toBe("Renaming /old.jsx");
});

test("getToolLabel: unknown tool returns raw tool name", () => {
  expect(getToolLabel("some_other_tool", {})).toBe("some_other_tool");
});

// --- Component rendering tests ---

test("ToolInvocationBadge shows spinner when state is 'call'", () => {
  const { container } = render(
    <ToolInvocationBadge
      toolInvocation={{
        toolCallId: "call-1",
        toolName: "str_replace_editor",
        args: { command: "create", path: "/App.jsx" },
        state: "call",
      }}
    />
  );
  expect(container.querySelector(".animate-spin")).toBeDefined();
  expect(container.querySelector(".bg-emerald-500")).toBeNull();
});

test("ToolInvocationBadge shows green dot when state is 'result'", () => {
  const { container } = render(
    <ToolInvocationBadge
      toolInvocation={{
        toolCallId: "call-1",
        toolName: "str_replace_editor",
        args: { command: "create", path: "/App.jsx" },
        state: "result",
        result: "Created /App.jsx successfully",
      }}
    />
  );
  expect(container.querySelector(".bg-emerald-500")).toBeDefined();
  expect(container.querySelector(".animate-spin")).toBeNull();
});

test("ToolInvocationBadge renders label for create command", () => {
  render(
    <ToolInvocationBadge
      toolInvocation={{
        toolCallId: "call-1",
        toolName: "str_replace_editor",
        args: { command: "create", path: "/App.jsx" },
        state: "call",
      }}
    />
  );
  expect(screen.getByText("Creating /App.jsx")).toBeDefined();
});

test("ToolInvocationBadge renders label for completed str_replace", () => {
  render(
    <ToolInvocationBadge
      toolInvocation={{
        toolCallId: "call-2",
        toolName: "str_replace_editor",
        args: { command: "str_replace", path: "/components/Button.jsx" },
        state: "result",
        result: "Replaced successfully",
      }}
    />
  );
  expect(screen.getByText("Editing /components/Button.jsx")).toBeDefined();
});
