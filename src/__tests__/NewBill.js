/**
 * @jest-environment jsdom
 */

import { screen, fireEvent } from "@testing-library/dom";
import { ROUTES } from "../constants/routes.js";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store";

describe("Given I am logged in as an employee", () => {
  describe("When I am on the NewBill Page", () => {
    beforeEach(() => {
      // Setup mock for localStorage and render NewBill UI
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

    // Check that handleChangeFile() is called when a valid file is added
    test("Then the handleChangeFile() function should be called when a file is added", () => {
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
          files: [
            new File(["test-content"], "image.png", { type: "image/png" }),
          ],
        },
      });
      expect(handleChange).toHaveBeenCalled();
      expect(inputFile.files[0].name).toBe("image.png");
    });

    test("Then handleChangeFile() rejects unsupported file formats", () => {
      const alertMock = jest
        .spyOn(window, "alert")
        .mockImplementation(() => {});
      const newBill = new NewBill({
        document,
        onNavigate: jest.fn(),
        store: mockStore,
        localStorage: window.localStorage,
      });
      const inputFile = screen.getByTestId("file");

      // Simulate an unsupported file type
      fireEvent.change(inputFile, {
        target: {
          files: [
            new File(["content"], "document.pdf", { type: "application/pdf" }),
          ],
        },
      });

      expect(alertMock).toHaveBeenCalledWith(
        "Seuls les fichiers JPG, JPEG, ou PNG sont autorisés."
      );
      expect(inputFile.value).toBe(""); // Ensure input value is cleared
      alertMock.mockRestore();
    });

    test("Then handleChangeFile() handles file input with no file selected", () => {
      const newBill = new NewBill({
        document,
        onNavigate: jest.fn(),
        store: mockStore,
        localStorage: window.localStorage,
      });
      const inputFile = screen.getByTestId("file");

      // Simulate no file selected
      fireEvent.change(inputFile, { target: { files: [] } });
      expect(newBill.fileName).toBeNull(); // Nothing should be set
    });

    test("Then handleChangeFile() sets fileUrl and billId on successful upload", async () => {
      const mockResponse = { fileUrl: "https://test.com/file.jpg", key: "123" };
      const newBill = new NewBill({
        document,
        onNavigate: jest.fn(),
        store: {
          bills: () => ({
            create: jest.fn().mockResolvedValueOnce({
              fileUrl: "https://test.com/file.jpg",
              key: "123",
            }),
          }),
        },
        localStorage: window.localStorage,
      });

      const inputFile = screen.getByTestId("file");
      fireEvent.change(inputFile, {
        target: {
          files: [new File(["content"], "image.jpg", { type: "image/jpg" })],
        },
      });

      // Wait for the async code to complete
      await new Promise(process.nextTick);
      expect(newBill.fileUrl).toBe("https://test.com/file.jpg");
      expect(newBill.billId).toBe("123");
    });

    test("Then handleChangeFile() handles error during file upload", async () => {
      const consoleErrorMock = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});
      const newBill = new NewBill({
        document,
        onNavigate: jest.fn(),
        store: {
          bills: () => ({
            create: jest.fn().mockRejectedValueOnce(new Error("Upload error")),
          }),
        },
        localStorage: window.localStorage,
      });

      const inputFile = screen.getByTestId("file");
      fireEvent.change(inputFile, {
        target: {
          files: [new File(["content"], "image.jpg", { type: "image/jpg" })],
        },
      });

      await new Promise(process.nextTick);
      expect(consoleErrorMock).toHaveBeenCalledWith(expect.any(Error));
      consoleErrorMock.mockRestore();
    });

    // Integration test for form submission
    describe("When I fill in the form and click submit", () => {
      test("Then the bill is created and I am redirected to the bills page", () => {
        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname });
        };
        const newBill = new NewBill({
          document,
          onNavigate,
          store: mockStore,
          localStorage: {},
        });

        // Fill out the form inputs with test data
        const typeInput = screen.getByTestId("expense-type");
        const nameInput = screen.getByTestId("expense-name");
        const amountInput = screen.getByTestId("amount");
        const dateInput = screen.getByTestId("datepicker");
        const vatInput = screen.getByTestId("vat");
        const pctInput = screen.getByTestId("pct");
        const commentaryInput = screen.getByTestId("commentary");
        const fileInput = screen.getByTestId("file");

        fireEvent.change(typeInput, { target: { value: "Transport" } });
        fireEvent.change(nameInput, {
          target: { value: "Flight to New York" },
        });
        fireEvent.change(amountInput, { target: { value: "900" } });
        fireEvent.change(dateInput, { target: { value: "2023-12-15" } });
        fireEvent.change(vatInput, { target: { value: "50" } });
        fireEvent.change(pctInput, { target: { value: "10" } });
        fireEvent.change(commentaryInput, {
          target: { value: "Conference trip to NYC" },
        });
        fireEvent.change(fileInput, {
          target: {
            files: [
              new File(["receipt-content"], "receipt.jpg", {
                type: "image/jpg",
              }),
            ],
          },
        });

        // Simulate form submission
        const newBillForm = screen.getByTestId("form-new-bill");
        const handleSubmit = jest.fn((e) => newBill.handleSubmit(e));
        newBillForm.addEventListener("submit", handleSubmit);
        fireEvent.submit(newBillForm);

        expect(handleSubmit).toHaveBeenCalled();
      });
    });
  });
});
