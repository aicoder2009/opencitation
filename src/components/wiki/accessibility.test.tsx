// @vitest-environment jsdom
import "@testing-library/jest-dom";
import { render } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import { expect, describe, it } from "vitest";
import { WikiButton } from "./wiki-button";
import { WikiNotice } from "./wiki-notice";
import { WikiCollapsible } from "./wiki-collapsible";
import { WikiTabs } from "./wiki-tabs";
import { WikiSpinner } from "./wiki-spinner";
import { WikiBreadcrumbs } from "./wiki-breadcrumbs";

expect.extend(toHaveNoViolations);

describe("WCAG 2.1 AA — Wiki components", () => {
  it("WikiButton has no axe violations", async () => {
    const { container } = render(<WikiButton>Click me</WikiButton>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("WikiButton disabled state has no axe violations", async () => {
    const { container } = render(<WikiButton disabled>Disabled</WikiButton>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("WikiNotice info has no axe violations", async () => {
    const { container } = render(<WikiNotice variant="info">Info message</WikiNotice>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("WikiNotice warn (role=alert) has no axe violations", async () => {
    const { container } = render(<WikiNotice variant="warn">Warning message</WikiNotice>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("WikiNotice with dismiss button has no axe violations", async () => {
    const { container } = render(
      <WikiNotice variant="warn" onDismiss={() => {}}>Dismissible warning</WikiNotice>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("WikiCollapsible expanded has no axe violations", async () => {
    const { container } = render(
      <WikiCollapsible title="Section">Content here</WikiCollapsible>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("WikiCollapsible collapsed has no axe violations", async () => {
    const { container } = render(
      <WikiCollapsible title="Section" defaultOpen={false}>Content here</WikiCollapsible>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("WikiTabs with panels has no axe violations", async () => {
    const { container } = render(
      <div>
        <WikiTabs
          tabs={[
            { id: "tab-a", label: "Tab A", active: true },
            { id: "tab-b", label: "Tab B", active: false },
            { id: "tab-c", label: "Tab C", active: false },
          ]}
          onTabChange={() => {}}
        />
        {/* Panels referenced by aria-controls must exist in DOM */}
        <div role="tabpanel" id="tabpanel-tab-a" aria-label="Tab A">Panel A</div>
        <div role="tabpanel" id="tabpanel-tab-b" aria-label="Tab B" hidden>Panel B</div>
        <div role="tabpanel" id="tabpanel-tab-c" aria-label="Tab C" hidden>Panel C</div>
      </div>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("WikiSpinner has no axe violations", async () => {
    const { container } = render(<WikiSpinner />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("WikiBreadcrumbs has no axe violations", async () => {
    const { container } = render(
      <WikiBreadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Lists", href: "/lists" },
          { label: "My List" },
        ]}
      />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

describe("WCAG 2.1 AA — Form validation patterns", () => {
  it("input with aria-invalid and role=alert error has no axe violations", async () => {
    const { container } = render(
      <div>
        <label htmlFor="test-input">Name</label>
        <input
          id="test-input"
          type="text"
          aria-invalid={true}
          aria-describedby="test-input-error"
        />
        <p id="test-input-error" role="alert">Name is required</p>
      </div>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("modal dialog structure has no axe violations", async () => {
    const { container } = render(
      <div>
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-heading"
        >
          <h2 id="modal-heading">Dialog Title</h2>
          <p>Dialog content</p>
          <button type="button">Close</button>
        </div>
      </div>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("tab pattern with panels has no axe violations", async () => {
    const { container } = render(
      <div>
        <div role="tablist" aria-label="Tabs">
          <button role="tab" id="tab-1" aria-selected={true} aria-controls="panel-1" tabIndex={0}>Tab 1</button>
          <button role="tab" id="tab-2" aria-selected={false} aria-controls="panel-2" tabIndex={-1}>Tab 2</button>
        </div>
        <div role="tabpanel" id="panel-1" aria-labelledby="tab-1">Panel 1 content</div>
        <div role="tabpanel" id="panel-2" aria-labelledby="tab-2" hidden>Panel 2 content</div>
      </div>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("table with scope=col has no axe violations", async () => {
    const { container } = render(
      <table>
        <thead>
          <tr>
            <th scope="col">Name</th>
            <th scope="col">Created</th>
            <th scope="col">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>My List</td>
            <td>Jan 1, 2025</td>
            <td><button type="button">Delete</button></td>
          </tr>
        </tbody>
      </table>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
