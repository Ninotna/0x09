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

jest.mock("../app/format.js", () => ({
  formatDate: jest.fn(),
  formatStatus: jest.fn(),
}));

jest.mock("../app/store", () => mockStore);

describe("Given I am connected as an employee", () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
      expect(windowIcon).toHaveClass("active-icon");
    });

    test("Then, bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills });

      const dates = screen.getAllByTestId("bill-date").map((a) => a.innerHTML);
      const antiChrono = (a, b) => (a < b ? 1 : -1);
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
        const billsInstance = new Bills({
          document,
          onNavigate,
          store: mockStore,
          localStorage: window.localStorage,
        });
        document.body.innerHTML = BillsUI({ data: bills });
        const buttonNewBill = screen.getByTestId("btn-new-bill");
        expect(buttonNewBill).toBeTruthy();
        const handleClickNewBill = jest.fn(billsInstance.handleClickNewBill);
        buttonNewBill.addEventListener("click", handleClickNewBill);
        fireEvent.click(buttonNewBill);
        expect(handleClickNewBill).toHaveBeenCalled();
        await waitFor(() => screen.getByText("Envoyer une note de frais"));
        expect(screen.getByText("Envoyer une note de frais")).toBeTruthy();
      });
    });

    test("Should display an error message if bills fetch fails", async () => {
      jest.spyOn(mockStore.bills(), "list").mockImplementationOnce(() => ({
        list: () => Promise.reject(new Error("Erreur de récupération")),
      }));
      document.body.innerHTML = BillsUI({ error: "Erreur de récupération" });
      await waitFor(() => screen.getByText("Erreur de récupération"));
      expect(screen.getByText("Erreur de récupération")).toBeTruthy();
    });
  });

  describe("When fetching bills fails", () => {
    beforeEach(() => {
      jest.spyOn(mockStore, "bills");
    });

    test("Should display a 404 error message", async () => {
      mockStore.bills = jest.fn(() => ({
        list: () => Promise.reject({ response: { status: 404 } }),
      }));
      document.body.innerHTML = BillsUI({ error: "Erreur 404" });
      const message = await screen.getByText(/Erreur 404/);
      expect(message).toBeTruthy();
    });

    test("Should display a 500 error message", async () => {
      mockStore.bills.mockImplementationOnce(() => ({
        list: () => Promise.reject(new Error("Erreur 500")),
      }));
      document.body.innerHTML = BillsUI({ error: "Erreur 500" });
      const message = await screen.getByText(/Erreur 500/);
      expect(message).toBeTruthy();
    });
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
    await waitFor(() => expect(screen.getByText("Justificatif")).toBeTruthy());
    const modalImage = document.querySelector("#modaleFile .modal-body img");
    expect(modalImage).toBeTruthy();
    expect(modalImage.getAttribute("src")).toBe(bills[0].fileUrl);
    expect(modalImage.getAttribute("alt")).toBe("Bill");
    const imgWidth = Math.floor($("#modaleFile").width() * 0.5);
    expect(modalImage.getAttribute("width")).toBe(imgWidth.toString());
  });
});
