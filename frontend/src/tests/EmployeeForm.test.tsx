import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { EmployeeForm } from "../components/EmployeeForm";

describe("EmployeeForm", () => {
  it("renders all required fields", () => {
    render(<EmployeeForm onSubmit={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByPlaceholderText("Jane Smith")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Software Engineer")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("85000")).toBeInTheDocument();
  });

  it("calls onCancel when Cancel is clicked", () => {
    const onCancel = vi.fn();
    render(<EmployeeForm onSubmit={vi.fn()} onCancel={onCancel} />);
    fireEvent.click(screen.getByText("Cancel"));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it("populates fields from initial prop", () => {
    render(
      <EmployeeForm
        initial={{ full_name: "Bob Jones", job_title: "Designer", salary: 75000 }}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
      />
    );
    expect((screen.getByPlaceholderText("Jane Smith") as HTMLInputElement).value).toBe("Bob Jones");
    expect((screen.getByPlaceholderText("Software Engineer") as HTMLInputElement).value).toBe("Designer");
  });

  it("shows 'Saving…' when loading", () => {
    render(<EmployeeForm onSubmit={vi.fn()} onCancel={vi.fn()} loading />);
    expect(screen.getByText("Saving…")).toBeInTheDocument();
  });
});
