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

      describe("When I am on NewBill page, and a user upload a accepted format file", () => {
        test("Then, the file name should be correctly displayed into the input and isImgFormatValid shoud be true", () => {
          window.localStorage.setItem(
            "user",
            JSON.stringify({
              type: "Employee",
            })
          );

          document.body.innerHTML = NewBillUI();

          const onNavigate = (pathname) => {
            document.body.innerHTML = ROUTES({ pathname });
          };
          const store = null;

          const newBill = new NewBill({
            document,
            onNavigate,
            store,
            localStorage,
          });
          const handleChangeFile = jest.fn((e) => newBill.handleChangeFile(e));
          const file = screen.getByTestId("file");

          window.alert = jest.fn();

          file.addEventListener("change", handleChangeFile);
          fireEvent.change(file, {
            target: {
              files: [
                new File(["file.png"], "file.png", { type: "image/png" }),
              ],
            },
          });

          jest.spyOn(window, "alert");
          expect(window.alert).not.toHaveBeenCalled();

          expect(handleChangeFile).toHaveBeenCalled();
          expect(file.files[0].name).toBe("file.png");
          expect(newBill.fileName).toBe("file.png");
          expect(newBill.isImgFormatValid).toBe(true);
          expect(newBill.formData).not.toBe(null);
        });
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
          "Attention! Le format de votre fichier n'est pas supporté." +
            "\n" +
            "Seuls les .jpg, .jpeg, .png sont acceptés."
        );
        expect(inputFile.value).toBe(""); // Input should be cleared
      });

      beforeAll(() => {
        console.log = jest.fn(); // Utilisation de jest.fn() pour vérifier que console.log est bien appelé
      });
      test.only("handleChangeFile should correctly set fileUrl and billId with a valid file", async () => {
        console.log("This is a log inside the specific test");
        // Set up the mocked NewBill instance
        const newBill = new NewBill({
          document,
          onNavigate: jest.fn(),
          store: {
            bills: () => ({
              create: jest.fn(() =>
                Promise.resolve({
                  fileUrl: "https://test.com/file.jpg", // Mock file URL returned by the API
                  key: "1234", // Mock bill ID returned by the API
                })
              ),
            }),
          },
          localStorage: window.localStorage,
        });

        // Mock the necessary parts of the DOM for the file input
        document.body.innerHTML = NewBillUI(); // Ensure NewBillUI is defined and rendered
        const inputFile = screen.getByTestId("file");

        // Mock alert to avoid the alert message popping up in the test
        window.alert = jest.fn();

        // Create a valid file and trigger the file change event
        fireEvent.change(inputFile, {
          target: {
            files: [
              new File(["file.png"], "file.png", { type: "image/png" }), // Valid image file
            ],
          },
        });

        // Wait for any asynchronous operations to complete (ensure async code runs)
        await new Promise((resolve) => setTimeout(resolve, 0)); // Ensure the async operations have completed

        // Check file extension and format validation
        console.log("isImgFormatValid:", newBill.isImgFormatValid); // Check if the format is valid

        // Assertions to validate the behavior after file upload
        expect(window.alert).not.toHaveBeenCalled(); // Ensure no alert was shown for valid file
        expect(newBill.isImgFormatValid).toBe(true); // Ensure the image format is valid
        expect(newBill.fileName).toBe("file.png"); // Ensure the file name is set correctly
        expect(newBill.fileUrl).toBe("https://test.com/file.jpg"); // Ensure the file URL is set after the API call
        expect(newBill.billId).toBe("1234"); // Ensure the bill ID is set after the API call
        expect(newBill.formData).not.toBe(null); // Ensure form data is populated correctly
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
          "Attention! Le format de votre fichier n'est pas supporté." +
            "\n" +
            "Seuls les .jpg, .jpeg, .png sont acceptés."
        );
        expect(inputFile.value).toBe(""); // Ensures file input is reset
        alertMock.mockRestore();
      });
    });
  });
});
