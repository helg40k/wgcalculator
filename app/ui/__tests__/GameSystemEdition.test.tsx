import React, { ReactNode } from "react";
import { fireEvent, render, screen } from "@testing-library/react";

import { GameSystemContext } from "@/app/lib/contexts/GameSystemContext";
import {
  Edition,
  EntityStatusRegistry,
  GameSystem,
} from "@/app/lib/definitions";

import "@testing-library/jest-dom";

import GameSystemEdition from "../GameSystemEdition";

jest.mock("@ant-design/v5-patch-for-react-19", () => ({}));

const mockModalConfirm = jest.fn();
jest.mock("antd", () => {
  const actual = jest.requireActual("antd");
  return {
    ...actual,
    Modal: {
      ...actual.Modal,
      confirm: (...args: unknown[]) => mockModalConfirm(...args),
    },
  };
});

const createEdition = (id: string, name: string, order: number): Edition => ({
  _createdAt: { nanoseconds: 0, seconds: 0 } as never,
  _createdBy: "test@example.com",
  _id: id,
  _isUpdated: false,
  _updatedAt: { nanoseconds: 0, seconds: 0 } as never,
  _updatedBy: "test@example.com",
  name,
  order,
  status: EntityStatusRegistry.ACTIVE,
});

const mockGameSystem = {
  key: "testgame",
} as GameSystem;

const high = createEdition("ed-high", "Third Edition", 3);
const low = createEdition("ed-low", "First Edition", 1);

const renderEdition = (
  editions: Edition[],
  selectedEdition?: Edition,
  setSelectedEdition = jest.fn(),
) => {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <GameSystemContext.Provider
      value={[
        mockGameSystem,
        selectedEdition,
        {
          canBeMentionedBy: () => [],
          getActiveEditions: () => editions,
          getAllowedToRefer: () => [],
          setSelectedEdition,
        },
      ]}
    >
      {children}
    </GameSystemContext.Provider>
  );

  return {
    setSelectedEdition,
    ...render(<GameSystemEdition />, { wrapper }),
  };
};

describe("GameSystemEdition", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render nothing when there are no active editions", () => {
    const { container } = renderEdition([]);

    expect(container.firstChild).toBeNull();
  });

  it("should render the edition name when there is one active edition", () => {
    renderEdition([createEdition("ed-1", "Second Edition", 2)]);

    expect(screen.getByText("Second Edition")).toBeInTheDocument();
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  });

  it("should render a select of active editions when there are several", () => {
    renderEdition([high, low], high);

    expect(screen.getByRole("combobox")).toBeInTheDocument();
    expect(screen.getByText("Third Edition")).toBeInTheDocument();
  });

  it("should confirm before switching to another edition", () => {
    const { setSelectedEdition } = renderEdition([high, low], high);

    fireEvent.mouseDown(screen.getByRole("combobox"));
    fireEvent.click(screen.getByText("First Edition"));

    expect(mockModalConfirm).toHaveBeenCalled();
    expect(setSelectedEdition).not.toHaveBeenCalled();

    const { content, onOk, title } = mockModalConfirm.mock.calls[0][0] as {
      content: React.ReactElement;
      onOk: () => void;
      title: string;
    };
    expect(title).toBe("Switching to the First Edition");
    const { container } = render(content);
    expect(container.textContent).toContain(
      "All data will update according to the selected edition.",
    );
    expect(container.textContent).toContain("Are you sure?");
    expect(container.querySelector("br")).toBeInTheDocument();
    onOk();

    expect(setSelectedEdition).toHaveBeenCalledWith("ed-low");
  });

  it("should keep the current edition when confirm is cancelled", () => {
    const { setSelectedEdition } = renderEdition([high, low], high);

    fireEvent.mouseDown(screen.getByRole("combobox"));
    fireEvent.click(screen.getByText("First Edition"));

    expect(setSelectedEdition).not.toHaveBeenCalled();
    expect(
      document.querySelector(".ant-select-selection-item"),
    ).toHaveAttribute("title", "Third Edition");
  });

  it("should not confirm when the same edition is selected", () => {
    renderEdition([high, low], high);

    fireEvent.mouseDown(screen.getByRole("combobox"));
    fireEvent.click(screen.getByRole("option", { name: "Third Edition" }));

    expect(mockModalConfirm).not.toHaveBeenCalled();
  });
});
