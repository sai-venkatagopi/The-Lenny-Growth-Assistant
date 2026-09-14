import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import App from "../App";

vi.mock("../services/api", () => ({
  api: {
    listSessions: vi.fn().mockResolvedValue([]),
    createSession: vi.fn().mockResolvedValue({
      id: "test-id",
      title: "New",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      messages: [],
    }),
    listModels: vi.fn().mockResolvedValue({
      models: [{ id: "demo/x", provider: "demo", model: "x", label: "Demo", is_default: true }],
      active: { provider: "demo", ollama_available: false },
    }),
    getSession: vi.fn().mockResolvedValue({
      id: "test-id",
      title: "New",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      messages: [],
    }),
  },
}));

describe("App", () => {
  it("renders Growth Studio header", async () => {
    render(<App />);
    expect(await screen.findByRole("heading", { level: 1 })).toBeInTheDocument();
  });
});
