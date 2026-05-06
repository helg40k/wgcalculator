import React, { createContext, useContext, useEffect, useState } from "react";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { message, Modal, theme } from "antd";
import { Timestamp } from "firebase/firestore";

import { EntityStatusRegistry, Playable } from "@/app/lib/definitions";
import { NEW_ENTITY_TEMP_ID } from "@/app/lib/services/firebase/helpers/getDocumentCreationBase";
import CrudMultiLineView, {
  EntitiesUpdateContext,
} from "@/app/ui/CrudMultiLineView";
import { ToolbarPosition } from "@/app/ui/shared";

import "@testing-library/jest-dom";

jest.mock("@/app/lib/contexts/GameSystemContext", () => ({
  GameSystemContext: createContext([
    undefined,
    { canBeMentionedBy: () => [], getAllowedToRefer: () => [] },
  ]),
}));

jest.mock("@ant-design/v5-patch-for-react-19", () => ({}));

jest.mock("@/app/lib/errorMessage", () => jest.fn());

const mockThemeToken = {
  borderRadiusLG: 8,
  colorBgContainer: "#fff",
  colorBgTextHover: "#f5f5f5",
  colorTextDisabled: "#999",
  colorTextSecondary: "#666",
};

jest.mock("antd", () => ({
  ...jest.requireActual("antd"),
  theme: {
    useToken: jest.fn(() => ({
      token: mockThemeToken,
    })),
  },
}));

const mockUseToken = theme.useToken as jest.MockedFunction<
  typeof theme.useToken
>;

const ts = new Timestamp(1, 0);

const makePlayable = (overrides: Partial<Playable> = {}): Playable => ({
  _createdAt: ts,
  _createdBy: "u1",
  _id: "id-a",
  _isUpdated: false,
  _updatedAt: ts,
  _updatedBy: "u1",
  name: "Alpha",
  status: EntityStatusRegistry.ACTIVE,
  systemId: "sys-1",
  ...overrides,
});

describe("CrudMultiLineView", () => {
  const stubMessageReturn = {
    destroy: jest.fn(),
  } as unknown as ReturnType<typeof message.success>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseToken.mockReturnValue({
      token: mockThemeToken,
    } as any);
    jest.spyOn(message, "success").mockImplementation(() => stubMessageReturn);
    jest.spyOn(message, "error").mockImplementation(() => stubMessageReturn);
    jest.spyOn(message, "info").mockImplementation(() => stubMessageReturn);
    jest.spyOn(Modal, "confirm").mockImplementation((opts: any) => {
      opts?.onOk?.();
      return { destroy: jest.fn() } as any;
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("List", () => {
    const ListView = ({
      entity,
      editMode,
    }: {
      entity: Playable;
      editMode?: boolean;
    }) => (
      <div
        data-edit-mode={editMode ? "1" : "0"}
        data-testid={`list-view-${entity._id}`}
      >
        {entity.name}
      </div>
    );

    it("renders every entity with the view component", () => {
      const entities = [
        makePlayable({ _id: "e1", name: "One" }),
        makePlayable({ _id: "e2", name: "Two", systemId: "s2" }),
      ];
      const setEntities = jest.fn();

      render(
        <CrudMultiLineView.List
          edit={function TestEdit() {
            return <div data-testid="list-edit">edit</div>;
          }}
          entities={entities}
          filterableFields={[]}
          pluralNames="widgets"
          setEntities={setEntities}
          singleName="widget"
          sortableFields={[]}
          view={ListView}
        />,
      );

      expect(screen.getByTestId("list-view-e1")).toHaveTextContent("One");
      expect(screen.getByTestId("list-view-e2")).toHaveTextContent("Two");
      expect(screen.getByText("2 widgets found")).toBeInTheDocument();
    });

    it("filters entities by filterable string fields and updates the count label", async () => {
      const user = userEvent.setup();
      const entities = [
        makePlayable({ _id: "e1", name: "Apple" }),
        makePlayable({ _id: "e2", name: "Banana" }),
      ];
      const setEntities = jest.fn();

      render(
        <CrudMultiLineView.List
          edit={function TestEdit() {
            return <div data-testid="list-edit">edit</div>;
          }}
          entities={entities}
          filterableFields={["name"]}
          pluralNames="widgets"
          setEntities={setEntities}
          singleName="widget"
          sortableFields={[]}
          view={ListView}
        />,
      );

      const filterInput = screen.getByPlaceholderText("Filter widgets...");
      await user.type(filterInput, "ban");

      await waitFor(() => {
        expect(screen.getByText("1 of 2 widgets found")).toBeInTheDocument();
      });
      expect(screen.queryByTestId("list-view-e1")).not.toBeInTheDocument();
      expect(screen.getByTestId("list-view-e2")).toBeInTheDocument();
    });

    it("shows only the bottom toolbar when toolbarPosition is DOWN and the list is short", () => {
      const entities = [makePlayable({ _id: "e1", name: "One" })];
      const setEntities = jest.fn();

      const { container } = render(
        <CrudMultiLineView.List
          edit={function TestEdit() {
            return <div>edit</div>;
          }}
          entities={entities}
          filterableFields={[]}
          pluralNames="items"
          setEntities={setEntities}
          singleName="item"
          singleToolbarUntil={20}
          sortableFields={[]}
          toolbarPosition={ToolbarPosition.DOWN}
          view={ListView}
        />,
      );

      const toolbars = container.querySelectorAll(".mb-3, .mt-3");
      const addButtons = screen.getAllByRole("button", { name: /add new/i });
      expect(addButtons).toHaveLength(1);
      expect(toolbars.length).toBeGreaterThanOrEqual(1);
    });

    it("shows top and bottom toolbars when the list is large enough for dual toolbars", () => {
      const entities = Array.from({ length: 25 }, (_, i) =>
        makePlayable({ _id: `e${i}`, name: `Item ${i}` }),
      );
      const setEntities = jest.fn();

      render(
        <CrudMultiLineView.List
          edit={function E() {
            return <div>e</div>;
          }}
          entities={entities}
          filterableFields={[]}
          pluralNames="items"
          setEntities={setEntities}
          singleName="item"
          singleToolbarUntil={20}
          sortableFields={[]}
          toolbarPosition={ToolbarPosition.UP}
          view={ListView}
        />,
      );

      const addButtons = screen.getAllByRole("button", { name: /add new/i });
      expect(addButtons).toHaveLength(2);
    });

    it("disables Add new when no edit component is provided", () => {
      const entities = [makePlayable({ _id: "e1" })];
      const setEntities = jest.fn();

      render(
        <CrudMultiLineView.List
          entities={entities}
          filterableFields={[]}
          pluralNames="items"
          setEntities={setEntities}
          singleName="item"
          sortableFields={[]}
          view={ListView}
        />,
      );

      const addBtn = screen.getByRole("button", { name: /add new/i });
      expect(addBtn).toBeDisabled();
    });

    it("opens list edit mode after hover and Edit for an existing row", async () => {
      const user = userEvent.setup();
      const entities = [makePlayable({ _id: "e1", name: "Row" })];
      const setEntities = jest.fn();

      function RowEdit() {
        return <div data-testid="list-edit-body">editing</div>;
      }

      render(
        <CrudMultiLineView.List
          edit={RowEdit}
          entities={entities}
          filterableFields={[]}
          onSave={jest.fn().mockResolvedValue(entities[0])}
          pluralNames="items"
          setEntities={setEntities}
          singleName="item"
          sortableFields={[]}
          view={ListView}
        />,
      );

      const rowHost = screen.getByTestId("list-view-e1").closest("div");
      const rowWrap = rowHost!.parentElement;
      expect(rowWrap).toBeTruthy();
      fireEvent.mouseEnter(rowWrap!);

      const firstAction = screen
        .getAllByRole("button")
        .filter((b) => b.querySelector("svg"))[0];
      await user.click(firstAction);

      expect(screen.getByTestId("list-edit-body")).toBeInTheDocument();
      const saveCandidates = screen
        .getAllByRole("button")
        .filter((b) => b.querySelector("svg"));
      expect(saveCandidates[0]).not.toBeDisabled();

      fireEvent.mouseLeave(rowWrap!);
    });

    it("disables save for a newly added row in List (allowSaveNew is false)", async () => {
      const user = userEvent.setup();
      const initial = [makePlayable({ _id: "e1", name: "Row" })];
      const setEntities = jest.fn((update: any) => {
        const next = typeof update === "function" ? update(initial) : update;
        initial.length = 0;
        initial.push(...next);
      });

      function RowEdit({
        entity,
        setValid,
        setIsNew,
      }: {
        entity: Playable;
        setValues: React.Dispatch<React.SetStateAction<Partial<Playable>>>;
        setValid: React.Dispatch<React.SetStateAction<boolean>>;
        setIsNew: React.Dispatch<React.SetStateAction<boolean>>;
      }) {
        useEffect(() => {
          setValid(true);
          setIsNew(entity._id === NEW_ENTITY_TEMP_ID);
        }, [entity._id, setIsNew, setValid]);
        return <div data-testid={`edit-${entity._id}`}>form</div>;
      }

      const { rerender } = render(
        <CrudMultiLineView.List
          edit={RowEdit}
          entities={initial}
          filterableFields={[]}
          onSave={jest.fn().mockResolvedValue(null)}
          pluralNames="items"
          setEntities={setEntities}
          singleName="item"
          sortableFields={[]}
          view={ListView}
        />,
      );

      await user.click(screen.getByRole("button", { name: /add new/i }));
      expect(initial.some((e) => e._id === NEW_ENTITY_TEMP_ID)).toBe(true);

      rerender(
        <CrudMultiLineView.List
          edit={RowEdit}
          entities={[...initial]}
          filterableFields={[]}
          onSave={jest.fn().mockResolvedValue(null)}
          pluralNames="items"
          setEntities={setEntities}
          singleName="item"
          sortableFields={[]}
          view={ListView}
        />,
      );

      const saveCandidates = screen
        .getAllByRole("button")
        .filter((b) => b.querySelector("svg"));
      expect(saveCandidates[0]).toBeDisabled();
    });

    it("adds a temp row and enters edit mode; cancel removes the temp row", async () => {
      const user = userEvent.setup();
      const entities = [makePlayable({ _id: "e1" })];
      const setEntities = jest.fn((update: any) => {
        const next = typeof update === "function" ? update(entities) : update;
        entities.splice(0, entities.length, ...next);
      });

      function RowEdit({
        entity,
        setValid,
        setIsNew,
      }: {
        entity: Playable;
        setValues: React.Dispatch<React.SetStateAction<Partial<Playable>>>;
        setValid: React.Dispatch<React.SetStateAction<boolean>>;
        setIsNew: React.Dispatch<React.SetStateAction<boolean>>;
      }) {
        useEffect(() => {
          setValid(true);
          setIsNew(entity._id === NEW_ENTITY_TEMP_ID);
        }, [entity._id, setIsNew, setValid]);
        return <div data-testid={`edit-${entity._id}`}>form</div>;
      }

      const { rerender } = render(
        <CrudMultiLineView.List
          edit={RowEdit}
          entities={entities}
          filterableFields={[]}
          onSave={jest.fn()}
          pluralNames="items"
          setEntities={setEntities}
          singleName="item"
          sortableFields={[]}
          view={ListView}
        />,
      );

      await user.click(screen.getByRole("button", { name: /add new/i }));

      expect(setEntities).toHaveBeenCalled();
      expect(entities.some((e) => e._id === NEW_ENTITY_TEMP_ID)).toBe(true);

      rerender(
        <CrudMultiLineView.List
          edit={RowEdit}
          entities={[...entities]}
          filterableFields={[]}
          onSave={jest.fn()}
          pluralNames="items"
          setEntities={setEntities}
          singleName="item"
          sortableFields={[]}
          view={ListView}
        />,
      );

      const buttonsWithSvg = screen
        .getAllByRole("button")
        .filter((b) => b.querySelector("svg"));
      const cancel = buttonsWithSvg[buttonsWithSvg.length - 1];
      await user.click(cancel);

      await waitFor(() =>
        expect(entities.every((e) => e._id !== NEW_ENTITY_TEMP_ID)).toBe(true),
      );
    });

    it("deletes an existing row after confirmation", async () => {
      const user = userEvent.setup();
      let list = [makePlayable({ _id: "e1", name: "Nuke" })];
      const setEntities = jest.fn((update: any) => {
        list = typeof update === "function" ? update([...list]) : [...update];
      });
      const onDelete = jest.fn().mockResolvedValue(undefined);

      render(
        <CrudMultiLineView.List
          edit={function E() {
            return <div>e</div>;
          }}
          entities={list}
          filterableFields={[]}
          onDelete={onDelete}
          pluralNames="items"
          setEntities={setEntities}
          singleName="item"
          sortableFields={[]}
          view={ListView}
        />,
      );

      const rowHost = screen.getByTestId("list-view-e1").closest("div");
      fireEvent.mouseEnter(rowHost!.parentElement!);

      const trash = screen
        .getAllByRole("button")
        .filter((b) => b.querySelector("svg"))[1];
      await user.click(trash);

      await waitFor(() => expect(onDelete).toHaveBeenCalledWith("e1"));
    });

    it("exposes EntitiesUpdateContext.updateEntity and reloadEntities", async () => {
      const user = userEvent.setup();
      const onReload = jest.fn();
      const entities = [makePlayable({ _id: "e1", name: "Before" })];
      let current = [...entities];
      const setEntities = jest.fn((u: any) => {
        current = typeof u === "function" ? u(current) : u;
      });

      function ContextEdit({ entity }: { entity: Playable }) {
        const ctx = useContext(EntitiesUpdateContext);
        return (
          <div>
            <button
              data-testid="ctx-update"
              type="button"
              onClick={() =>
                ctx?.updateEntity(entity._id, {
                  name: "After",
                } as Partial<Playable>)
              }
            >
              patch
            </button>
            <button
              data-testid="ctx-reload"
              type="button"
              onClick={() => ctx?.reloadEntities?.()}
            >
              reload
            </button>
          </div>
        );
      }

      render(
        <CrudMultiLineView.List
          edit={ContextEdit}
          entities={current}
          filterableFields={[]}
          onReload={onReload}
          pluralNames="items"
          setEntities={setEntities}
          singleName="item"
          sortableFields={[]}
          view={ListView}
        />,
      );

      const rowHost = screen.getByTestId("list-view-e1").closest("div");
      fireEvent.mouseEnter(rowHost!.parentElement!);
      const iconButtons = screen
        .getAllByRole("button")
        .filter((b) => b.querySelector("svg"));
      await user.click(iconButtons[0]);
      await user.click(screen.getByTestId("ctx-update"));
      expect(setEntities).toHaveBeenCalled();

      await user.click(screen.getByTestId("ctx-reload"));
      expect(onReload).toHaveBeenCalled();
    });
  });

  describe("List sorting", () => {
    const SortView = ({ entity }: { entity: Playable }) => (
      <div data-sort-key={entity.name} data-testid={`sv-${entity._id}`}>
        {entity.name}
      </div>
    );

    it("reorders list when a sort field is chosen", async () => {
      const user = userEvent.setup();
      const entities = [
        makePlayable({ _id: "a", name: "Zebra" }),
        makePlayable({ _id: "b", name: "Ant" }),
      ];
      const setEntities = jest.fn();

      render(
        <CrudMultiLineView.List
          edit={function E() {
            return <div>e</div>;
          }}
          entities={entities}
          filterableFields={[]}
          pluralNames="items"
          setEntities={setEntities}
          singleName="item"
          sortableFields={[{ key: "name", label: "Name" }]}
          view={SortView}
        />,
      );

      const sortSelect = screen.getByRole("combobox");
      await user.click(sortSelect);
      const nameOpt = await screen.findByTitle(/^Name($| )/);
      await user.click(nameOpt);

      const keys = screen
        .getAllByTestId(/sv-/)
        .map((el) => el.getAttribute("data-sort-key"));
      expect(keys).toEqual(["Ant", "Zebra"]);
    });
  });

  describe("Table", () => {
    const CellView = ({
      entity,
      value,
      editMode,
    }: {
      entity: Playable;
      field: keyof Playable | string;
      value: unknown;
      editMode?: boolean;
    }) => (
      <span
        data-edit-mode={editMode ? "1" : "0"}
        data-testid={`cell-${entity._id}`}
      >
        {String(value ?? "")}
      </span>
    );

    const NameEditCell = ({
      entity,
      value,
      setValues,
      setValid,
    }: {
      entity: Playable;
      field: keyof Playable | string;
      value: unknown;
      setValues: React.Dispatch<React.SetStateAction<Partial<Playable>>>;
      setValid: React.Dispatch<React.SetStateAction<boolean>>;
    }) => {
      const [localName, setLocalName] = useState(String(value ?? ""));
      useEffect(() => {
        setLocalName(String(value ?? ""));
      }, [entity._id, value]);
      useEffect(() => {
        setValid(true);
      }, [setValid]);
      return (
        <input
          aria-label="name-edit"
          data-testid={`name-edit-${entity._id}`}
          value={localName}
          onChange={(e) => {
            const name = e.target.value;
            setLocalName(name);
            setValues(
              (prev) => ({ ...entity, ...prev, name }) as Partial<Playable>,
            );
          }}
        />
      );
    };

    it("renders configured columns, status, and actions", () => {
      const entities = [makePlayable({ _id: "t1", name: "TableRow" })];
      const setEntities = jest.fn();

      render(
        <CrudMultiLineView.Table
          entities={entities}
          filterableFields={[]}
          onSave={jest.fn()}
          pluralNames="rows"
          setEntities={setEntities}
          singleName="row"
          sortableStatus={true}
          table={[
            {
              edit: NameEditCell,
              field: "name",
              header: "Title",
              sortable: true,
              view: CellView,
            },
          ]}
        />,
      );

      expect(screen.getByText("Title")).toBeInTheDocument();
      expect(screen.getByText("Status")).toBeInTheDocument();
      expect(screen.getByText("Actions")).toBeInTheDocument();
      expect(screen.getByTestId("cell-t1")).toHaveTextContent("TableRow");
    });

    it("marks other rows as editMode while one row is editing", async () => {
      const user = userEvent.setup();
      const entities = [
        makePlayable({ _id: "r1", name: "A" }),
        makePlayable({ _id: "r2", name: "B" }),
      ];
      const setEntities = jest.fn();

      render(
        <CrudMultiLineView.Table
          entities={entities}
          filterableFields={[]}
          onSave={jest.fn().mockResolvedValue(entities[0])}
          pluralNames="rows"
          setEntities={setEntities}
          singleName="row"
          table={[
            {
              edit: NameEditCell,
              field: "name",
              header: "Name",
              view: CellView,
            },
          ]}
        />,
      );

      const actionGroups = screen.getAllByRole("button", { name: "" });
      const editFirst = actionGroups.filter((b) => b.querySelector("svg"))[0];
      await user.click(editFirst);

      expect(screen.getByTestId("name-edit-r1")).toBeInTheDocument();
      const otherCell = screen.getByTestId("cell-r2");
      expect(otherCell).toHaveAttribute("data-edit-mode", "1");
    });

    it("calls onSave when saving an edited row", async () => {
      const user = userEvent.setup();
      const entities = [makePlayable({ _id: "r1", name: "Old" })];
      const onSave = jest
        .fn()
        .mockImplementation((e: Playable) =>
          Promise.resolve({ ...e, name: "Saved" }),
        );
      const setEntities = jest.fn();

      render(
        <CrudMultiLineView.Table
          entities={entities}
          filterableFields={[]}
          onSave={onSave}
          pluralNames="rows"
          setEntities={setEntities}
          singleName="row"
          table={[
            {
              edit: NameEditCell,
              field: "name",
              header: "Name",
              view: CellView,
            },
          ]}
        />,
      );

      const editBtn = screen
        .getAllByRole("button")
        .filter((b) => b.querySelector("svg"))[0];
      await user.click(editBtn);

      fireEvent.change(screen.getByTestId("name-edit-r1"), {
        target: { value: "New" },
      });

      const saveBtn = screen
        .getAllByRole("button")
        .filter((b) => b.querySelector("svg"))[0];
      await act(async () => {
        await user.click(saveBtn);
      });

      await waitFor(() =>
        expect(onSave).toHaveBeenCalledWith(
          expect.objectContaining({ _id: "r1", name: "New" }),
        ),
      );
      await waitFor(() =>
        expect(screen.queryByTestId("name-edit-r1")).not.toBeInTheDocument(),
      );
    });

    it("renders rowFooter for each row when provided", () => {
      const entities = [makePlayable({ _id: "f1" })];
      const setEntities = jest.fn();

      render(
        <CrudMultiLineView.Table
          entities={entities}
          filterableFields={[]}
          onSave={jest.fn()}
          pluralNames="rows"
          rowFooter={(rec, editMode) => (
            <div data-edit={editMode ? "1" : "0"} data-testid="footer-f1">
              footer-{rec._id}
            </div>
          )}
          setEntities={setEntities}
          singleName="row"
          table={[{ field: "name", header: "N", view: CellView }]}
        />,
      );

      expect(screen.getByTestId("footer-f1")).toHaveTextContent("footer-f1");
      expect(screen.getByTestId("footer-f1")).toHaveAttribute("data-edit", "0");
    });

    it("applies table column sorting via onChange when not editing", () => {
      const entities = [
        makePlayable({ _id: "x1", name: "M" }),
        makePlayable({ _id: "x2", name: "A" }),
      ];
      const setEntities = jest.fn();

      render(
        <CrudMultiLineView.Table
          entities={entities}
          filterableFields={[]}
          onSave={jest.fn()}
          pluralNames="rows"
          setEntities={setEntities}
          singleName="row"
          table={[
            {
              field: "name",
              header: "Name",
              sortable: true,
              view: CellView,
            },
          ]}
        />,
      );

      const nameHeader = screen.getByText("Name").closest("th");
      expect(nameHeader).toBeTruthy();
      fireEvent.click(nameHeader!);

      const keys = screen.getAllByTestId(/cell-/).map((el) => el.textContent);
      expect(keys[0]).toMatch(/A/);
    });

    it("filters table rows via shared toolbar filter", async () => {
      const user = userEvent.setup();
      const entities = [
        makePlayable({ _id: "p1", name: "Keep" }),
        makePlayable({ _id: "p2", name: "Drop" }),
      ];
      const setEntities = jest.fn();

      render(
        <CrudMultiLineView.Table
          entities={entities}
          filterableFields={["name"]}
          onSave={jest.fn()}
          pluralNames="rows"
          setEntities={setEntities}
          singleName="row"
          table={[
            {
              edit: NameEditCell,
              field: "name",
              header: "Name",
              view: CellView,
            },
          ]}
        />,
      );

      await user.type(screen.getByPlaceholderText("Filter rows..."), "kee");

      await waitFor(() => {
        expect(screen.getByText("1 of 2 rows found")).toBeInTheDocument();
      });
      expect(screen.getByTestId("cell-p1")).toBeInTheDocument();
      expect(screen.queryByTestId("cell-p2")).not.toBeInTheDocument();
    });
  });
});
