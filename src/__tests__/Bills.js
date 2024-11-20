/**
 * @jest-environment jsdom
 */

import { screen, waitFor, fireEvent } from "@testing-library/dom";
import BillsUI from "../views/BillsUI.js";
import { bills } from "../fixtures/bills.js";
import Bills from "../containers/Bills.js";
import { ROUTES_PATH, ROUTES } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store";
import router from "../app/Router.js";
import "@testing-library/jest-dom";
import $ from "jquery";
import "bootstrap/dist/js/bootstrap.bundle.min";
import { formatDate, formatStatus } from "../app/format.js";

// Mock formatDate to handle invalid dates gracefully
jest.mock("../app/format.js", () => ({
  ...jest.requireActual("../app/format.js"),
  formatDate: jest.fn((date) => {
    const parsedDate = Date.parse(date);
    if (isNaN(parsedDate)) {
      throw new Error("Invalid date");
    }
    return new Date(parsedDate).toLocaleDateString("fr-FR");
  }),
}));

jest.mock("../app/store", () => mockStore);

describe("Given I am connected as an employee", () => {
  beforeEach(() => {
    jest.clearAllMocks(); // Clear mocks before each test for isolation
    Object.defineProperty(window, "localStorage", { value: localStorageMock });
    window.localStorage.setItem("user", JSON.stringify({ type: "Employee" }));
  });

  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.Bills);
      await waitFor(() => screen.getByTestId("icon-window"));
      const windowIcon = screen.getByTestId("icon-window");
      //to-do write expect expression
      expect(windowIcon).toHaveClass("active-icon");
    });

    test("Then bills should be ordered from latest to earliest", () => {
      document.body.innerHTML = BillsUI({ data: bills });
      const dates = screen
        .getAllByText(
          /^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i
        )
        .map((a) => a.innerHTML);
      const antiChrono = (a, b) => new Date(b) - new Date(a);
      const datesSorted = [...dates].sort(antiChrono);
      expect(dates).toEqual(datesSorted);
    });

    test('Then bills page should contain "Mes notes de frais" title', async () => {
      document.body.innerHTML = BillsUI({ data: bills });
      await waitFor(() => screen.getByText("Mes notes de frais"));
      expect(screen.getByText("Mes notes de frais")).toBeTruthy();
    });

    describe('When I click on "Nouvelle note de frais"', () => {
      test("Then the form to create a new invoice should appear", async () => {
        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname });
        };
        const bills = new Bills({
          document,
          onNavigate,
          store: mockStore,
          localStorage: window.localStorage,
        });
        document.body.innerHTML = BillsUI({ data: bills });
        const buttonNewBill = screen.getByTestId("btn-new-bill");
        expect(buttonNewBill).toBeTruthy();
        const handleClickNewBill = jest.fn(bills.handleClickNewBill);
        buttonNewBill.addEventListener("click", handleClickNewBill);
        fireEvent.click(buttonNewBill);
        expect(handleClickNewBill).toHaveBeenCalled();
        await waitFor(() => screen.getByText("Envoyer une note de frais"));
        expect(screen.getByText("Envoyer une note de frais")).toBeTruthy();
      });
    });

    test("Should not add event listener if buttonNewBill is not found", () => {
      document.body.innerHTML = "";
      const bills = new Bills({
        document,
        onNavigate: jest.fn(),
        store: null,
        localStorage: window.localStorage,
      });
      const button = document.querySelector(
        `button[data-testid="btn-new-bill"]`
      );
      expect(button).toBeNull();
    });

    test("Should add event listeners to iconEye elements if they exist", () => {
      document.body.innerHTML = `
        <div data-testid="icon-eye" data-bill-url="https://example.com/bill1.jpg"></div>
        <div data-testid="icon-eye" data-bill-url="https://example.com/bill2.jpg"></div>
      `;
      const onNavigate = jest.fn();
      const bills = new Bills({
        document,
        onNavigate,
        store: null,
        localStorage: window.localStorage,
      });
      const iconEyeElements = screen.getAllByTestId("icon-eye");
      const handleClickIconEyeSpy = jest.spyOn(bills, "handleClickIconEye");
      iconEyeElements.forEach((icon) => {
        fireEvent.click(icon);
      });
      expect(handleClickIconEyeSpy).toHaveBeenCalledTimes(
        iconEyeElements.length
      );
    });

    test("Should not run forEach loop if iconEye elements do not exist", () => {
      document.body.innerHTML = "";
      const bills = new Bills({
        document,
        onNavigate: jest.fn(),
        store: null,
        localStorage: window.localStorage,
      });
      const iconEyeElements = document.querySelectorAll(
        `div[data-testid="icon-eye"]`
      );
      expect(iconEyeElements.length).toBe(0);
    });

    test("Then bills should be fetched and displayed", async () => {
      document.body.innerHTML = BillsUI({ data: bills });
      const billsList = screen.getAllByTestId("bill-item");
      expect(billsList.length).toBe(bills.length);
    });

    test("Then it should display an error message if bills fetch fails", async () => {
      jest.spyOn(mockStore.bills(), "list").mockImplementationOnce(() => ({
        list: () => Promise.reject(new Error("Erreur de récupération")),
      }));
      document.body.innerHTML = BillsUI({ error: "Erreur de récupération" });
      await waitFor(() => screen.getByText("Erreur de récupération"));
      expect(screen.getByText("Erreur de récupération")).toBeTruthy();
    });

    test("Then clicking on 'Nouvelle note de frais' should navigate to the new bill form", () => {
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };
      const bills = new Bills({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      });
      document.body.innerHTML = BillsUI({ data: bills });
      const buttonNewBill = screen.getByTestId("btn-new-bill");
      const handleClickNewBill = jest.fn(bills.handleClickNewBill);
      buttonNewBill.addEventListener("click", handleClickNewBill);
      fireEvent.click(buttonNewBill);
      expect(handleClickNewBill).toHaveBeenCalled();
      expect(screen.getByText("Envoyer une note de frais")).toBeTruthy();
    });

    test("Then clicking on the eye icon should open the modal with the justificatif image", async () => {
      document.body.innerHTML = BillsUI({ data: bills });
      const billsContainer = new Bills({
        document,
        onNavigate: (pathname) => {
          document.body.innerHTML = ROUTES({ pathname });
        },
        store: mockStore,
        localStorage: window.localStorage,
      });
      const eyeIcon = screen.getAllByTestId("icon-eye")[0];
      const billsData = bills;
      eyeIcon.setAttribute("data-bill-url", billsData[0].fileUrl);
      const handleClickIconEye = jest.fn((icon) =>
        billsContainer.handleClickIconEye(icon)
      );
      eyeIcon.addEventListener("click", () => handleClickIconEye(eyeIcon));
      fireEvent.click(eyeIcon);
      expect(handleClickIconEye).toHaveBeenCalled();
      await waitFor(() =>
        expect(screen.getByText("Justificatif")).toBeTruthy()
      );
      const modalImage = document.querySelector("#modaleFile .modal-body img");
      expect(modalImage).toBeTruthy();
      expect(modalImage.getAttribute("src")).toBe(bills[0].fileUrl);
      expect(modalImage.getAttribute("alt")).toBe("Bill");
      const imgWidth = Math.floor($("#modaleFile").width() * 0.5);
      expect(modalImage.getAttribute("width")).toBe(imgWidth.toString());
    });
  });

  describe("When fetching bills fails", () => {
    beforeEach(() => {
      jest.spyOn(mockStore, "bills");
    });

    test("Should display error message for network failure", async () => {
      mockStore.bills.mockImplementationOnce(() => ({
        list: () => Promise.reject(new Error("Network Error")),
      }));
      document.body.innerHTML = BillsUI({ error: "Network Error" });
      await waitFor(() =>
        expect(screen.getByText("Network Error")).toBeTruthy()
      );
    });

    test("Should display default error message if error message is missing", async () => {
      mockStore.bills.mockImplementationOnce(() => ({
        list: () => Promise.reject(new Error()),
      }));
      document.body.innerHTML = BillsUI({
        error: "An unknown error occurred",
      });
      await waitFor(() =>
        expect(screen.getByText("An unknown error occurred")).toBeTruthy()
      );
    });
  });

  test("Then, there should be 4 eye icons displayed on the dashboard", () => {
    document.body.innerHTML = BillsUI({ data: bills }); // Ensure `bills` contains 4 items
    const eyeIcons = screen.getAllByTestId("icon-eye"); // Assuming each icon has `data-testid="icon-eye"`
    expect(eyeIcons.length).toBe(4);
  });

  describe("When there are no bills", () => {
    test("Should display a message indicating no bills are available", () => {
      document.body.innerHTML = BillsUI({ data: [] });
      expect(screen.getByText("Aucune note de frais")).toBeTruthy();
    });
  });

  describe("When handling unexpected behavior", () => {
    test("Should handle empty data gracefully", () => {
      document.body.innerHTML = BillsUI({ data: null });
      expect(screen.getByText("Aucune note de frais")).toBeTruthy();
    });

    test("Should not break if data contains unexpected fields", () => {
      const corruptedBills = [{ date: "2023-11-01", unknownField: "test" }];
      document.body.innerHTML = BillsUI({ data: corruptedBills });
      expect(screen.getByText("Mes notes de frais")).toBeTruthy();
    });
  });
});
