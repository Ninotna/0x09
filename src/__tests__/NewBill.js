/**
 * @jest-environment jsdom
 */

import { screen, fireEvent } from "@testing-library/dom";
import { ROUTES } from "../constants/routes.js";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store";

describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    beforeEach(() => {
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );
      document.body.innerHTML = NewBillUI();
    });
    // Vérifie que le fichier est bien ajouté si le format est valide
    test("Then the handleChangeFile() function is called when a file is added", () => {
      const newBill = new NewBill({
        document,
        onNavigate: {},
        store: mockStore,
        localStorage: {},
      });
      const handleChange = jest.fn((e) => newBill.handleChangeFile(e));
      const inputFile = screen.getByTestId("file");
      inputFile.addEventListener("change", handleChange);
      fireEvent.change(inputFile, {
        target: {
          files: [new File(["test"], "test.png", { type: "image/png" })],
        },
      });
      expect(handleChange).toHaveBeenCalled();
      expect(inputFile.files[0].name).toBe("test.png");
    });
    // Test intégration POST
    // Vérifie que la nouvelle note de frais peut être envoyée
    describe("When I am on NewBill Page, i fill the form and i click submit", () => {
      test("Then the bill is added and I am redirected to the bills page", () => {
        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname });
        };
        const newBill = new NewBill({
          document,
          onNavigate,
          store: mockStore,
          localStorage: {},
        });
        // Simuler les informations du formulaire
        const typeInput = screen.getByTestId("expense-type");
        const nameInput = screen.getByTestId("expense-name");
        const amountInput = screen.getByTestId("amount");
        const dateInput = screen.getByTestId("datepicker");
        const vatInput = screen.getByTestId("vat");
        const pctInput = screen.getByTestId("pct");
        const commentaryInput = screen.getByTestId("commentary");
        const file = screen.getByTestId("file");

        fireEvent.change(typeInput, {
          target: { value: "IT et électronique" },
        });
        fireEvent.change(nameInput, { target: { value: "Vol Paris Tokyo" } });
        fireEvent.change(amountInput, { target: { value: "348" } });
        fireEvent.change(dateInput, { target: { value: "2023-11-20" } });
        fireEvent.change(vatInput, { target: { value: "70" } });
        fireEvent.change(pctInput, { target: { value: "20" } });
        fireEvent.change(commentaryInput, { target: { value: "" } });
        fireEvent.change(file, {
          target: {
            files: [new File(["test"], "test.jpg", { type: "image/jpg" })],
          },
        });

        const newBillForm = screen.getByTestId("form-new-bill");
        const handleSubmit = jest.fn((e) => newBill.handleSubmit(e));
        newBillForm.addEventListener("submit", handleSubmit);
        fireEvent.submit(newBillForm);
        expect(handleSubmit).toHaveBeenCalled();
      });

      test("updateBill should call store.bills().update and navigate to Bills page", async () => {
        const onNavigate = jest.fn();
        const mockStore = {
          bills: () => ({
            update: jest.fn(() => Promise.resolve({})),
          }),
        };

        const newBill = new NewBill({
          document,
          onNavigate,
          store: mockStore,
          localStorage: window.localStorage,
        });

        const bill = {
          email: "test@test.com",
          type: "Transport",
          name: "Bus ticket",
          amount: 20,
          date: "2024-01-01",
          vat: "10",
          pct: 20,
          commentary: "Travel",
          fileUrl: "https://test.com/file.jpg",
          fileName: "file.jpg",
          status: "pending",
        };

        await newBill.updateBill(bill);
        expect(mockStore.bills().update).toHaveBeenCalledWith({
          data: JSON.stringify(bill),
          selector: newBill.billId,
        });
        expect(onNavigate).toHaveBeenCalledWith(ROUTES_PATH["Bills"]);
      });

      test("handleChangeFile should alert and clear file input for invalid file types", () => {
        window.alert = jest.fn(); // Mock alert
        const newBill = new NewBill({
          document,
          onNavigate: jest.fn(),
          store: null,
          localStorage: window.localStorage,
        });

        const inputFile = screen.getByTestId("file");
        fireEvent.change(inputFile, {
          target: {
            files: [
              new File(["test"], "test.pdf", { type: "application/pdf" }),
            ],
          },
        });

        expect(window.alert).toHaveBeenCalledWith(
          "Seuls les fichiers JPG, JPEG, ou PNG sont autorisés."
        );
        expect(inputFile.value).toBe(""); // Input should be cleared
      });

      test("handleChangeFile should correctly set fileUrl and billId with a valid file", async () => {
        // Set up the mocked NewBill instance
        const newBill = new NewBill({
          document,
          onNavigate: jest.fn(),
          store: {
            bills: () => ({
              create: jest.fn(() =>
                Promise.resolve({
                  fileUrl: "https://test.com/file.jpg",
                  key: "1234",
                })
              ),
            }),
          },
          localStorage: window.localStorage,
        });

        // Mock the necessary parts of the DOM for the file input
        document.body.innerHTML = NewBillUI();
        const inputFile = screen.getByTestId("file");

        // Add a valid file to trigger handleChangeFile
        const handleChange = jest.spyOn(newBill, "handleChangeFile");
        inputFile.addEventListener("change", handleChange);

        fireEvent.change(inputFile, {
          target: {
            files: [new File(["test"], "test.jpg", { type: "image/jpg" })],
          },
        });

        // Wait for async operations to complete
        await new Promise(process.nextTick);

        // Assertions
        expect(handleChange).toHaveBeenCalled(); // Ensure the function was called
        expect(newBill.fileUrl).toBe("https://test.com/file.jpg");
        expect(newBill.billId).toBe("1234");
      });

      test("Then the handleChangeFile() function should reject unsupported file formats", () => {
        const newBill = new NewBill({
          document,
          onNavigate: {},
          store: mockStore,
          localStorage: {},
        });
        const inputFile = screen.getByTestId("file");
        const alertMock = jest
          .spyOn(window, "alert")
          .mockImplementation(() => {});

        fireEvent.change(inputFile, {
          target: {
            files: [
              new File(["test"], "test.pdf", { type: "application/pdf" }),
            ],
          },
        });

        expect(alertMock).toHaveBeenCalledWith(
          "Seuls les fichiers JPG, JPEG, ou PNG sont autorisés."
        );
        expect(inputFile.value).toBe(""); // Ensures file input is reset
        alertMock.mockRestore();
      });
    });
  });
});
