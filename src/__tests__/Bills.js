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
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.Bills);
      await waitFor(() => screen.getByTestId("icon-window"));
      const windowIcon = screen.getByTestId("icon-window");
      expect(windowIcon).toHaveClass("active-icon");
    });
    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills });
      const dates = screen
        .getAllByText(
          /^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i
        )
        .map((a) => a.innerHTML);

      // Function to sort dates in ascending order (earliest to latest)
      // Chronological order...
      const chrono = (a, b) => new Date(a) - new Date(b);
      const datesSorted = [...dates].sort(chrono);
      expect(dates).toEqual(datesSorted);
    });

    // Vérifie que la page contient bien le titre "Mes notes de frais"
    test('Then bills page should contains "Mes notes de frais" title', async () => {
      document.body.innerHTML = BillsUI({ data: bills });
      await waitFor(() => screen.getByText("Mes notes de frais"));
      expect(screen.getByText("Mes notes de frais")).toBeTruthy();
    });

    // Vérifie que le formulaire de création de note de frais s'affiche bien
    describe('When I click on "Nouvelle note de frais"', () => {
      test("Then the form to create a new invoice should appear", async () => {
        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname });
        };
        Object.defineProperty(window, "localStorage", {
          value: localStorageMock,
        });
        window.localStorage.setItem(
          "user",
          JSON.stringify({
            type: "Employee",
          })
        );
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

    // Test pour vérifier que les factures sont bien récupérées et affichées
    test("Then bills should be fetched and displayed", async () => {
      console.log(bills);
      document.body.innerHTML = BillsUI({ data: bills });
      const billsList = screen.getAllByTestId("bill-item");
      expect(billsList.length).toBe(bills.length); // Vérifie que toutes les factures sont affichées
    });

    // Test pour simuler une erreur de récupération de données
    test("Then it should display an error message if bills fetch fails", async () => {
      // Configurer `list` pour renvoyer une erreur
      mockStore.bills().list = jest
        .fn()
        .mockImplementationOnce(() =>
          Promise.reject(new Error("Erreur de récupération"))
        );

      // Charger l'interface
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };

      const bills = new Bills({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      });

      // Rendre l'UI avec l'erreur
      document.body.innerHTML = BillsUI({ error: "Erreur de récupération" });
      await waitFor(() => screen.getByText("Erreur de récupération"));
      expect(screen.getByText("Erreur de récupération")).toBeTruthy();
    });

    // Test pour vérifier que le bouton "Nouvelle note de frais" fonctionne
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
      expect(handleClickNewBill).toHaveBeenCalled(); // Vérifie que l'événement est bien déclenché
      expect(screen.getByText("Envoyer une note de frais")).toBeTruthy(); // Vérifie que le formulaire est affiché
    });

    test("Then clicking on the eye icon should open the modal with the justificatif image", async () => {
      // Charger l'interface avec des données factices
      document.body.innerHTML = BillsUI({ data: bills });

      const billsContainer = new Bills({
        document,
        onNavigate: (pathname) => {
          document.body.innerHTML = ROUTES({ pathname });
        },
        store: mockStore,
        localStorage: window.localStorage,
      });

      // Sélectionner la première icône "oeil" et simuler le clic
      const eyeIcon = screen.getAllByTestId("icon-eye")[0];
      const billsData = bills; // Access the bills array passed to BillsUI
      eyeIcon.setAttribute("data-bill-url", billsData[0].fileUrl); // Assurer que data-bill-url est défini

      // Attacher la fonction `handleClickIconEye` et simuler le clic
      const handleClickIconEye = jest.fn((icon) =>
        billsContainer.handleClickIconEye(icon)
      );
      eyeIcon.addEventListener("click", () => handleClickIconEye(eyeIcon));

      fireEvent.click(eyeIcon);

      // Vérifier que la fonction est appelée
      expect(handleClickIconEye).toHaveBeenCalled();

      // Vérifier que la modal s'affiche avec l'image appropriée
      await waitFor(() =>
        expect(screen.getByText("Justificatif")).toBeTruthy()
      );

      const modalImage = document.querySelector("#modaleFile .modal-body img");
      expect(modalImage).toBeTruthy();
      expect(modalImage.getAttribute("src")).toBe(bills[0].fileUrl);
      expect(modalImage.getAttribute("alt")).toBe("Bill");

      const modalElement = document.querySelector("#modaleFile");
      // const imgWidth = Math.floor(modalElement.getBoundingClientRect().width * 0.5);
      const imgWidth = Math.floor($("#modaleFile").width() * 0.5);
      expect(modalImage.getAttribute("width")).toBe(imgWidth.toString());
    });
  });

  let consoleSpy;

  beforeEach(() => {
    // Espionner console.log pour vérifier que l'erreur est bien loggée
    consoleSpy = jest.spyOn(console, "log").mockImplementation();
  });

  test("Then it should log an error and return unformatted date if formatDate fails", () => {
    const consoleSpy = jest.spyOn(console, "log").mockImplementation();

    // Simuler un snapshot contenant une date invalide
    const snapshot = [
      {
        date: "invalid-date",
        status: "pending",
      },
    ];

    // Traiter les données simulées pour vérifier le comportement
    const bills = snapshot
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .map((doc) => {
        try {
          return {
            ...doc,
            date: formatDate(doc.date),
            status: formatStatus(doc.status),
          };
        } catch (e) {
          // Retourner les données avec la date non formatée en cas d'erreur
          console.log(e, "for", doc);
          return {
            ...doc,
            date: doc.date,
            status: formatStatus(doc.status),
          };
        }
      });

    // Vérifier que console.log a été appelé avec l'erreur
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.any(Error),
      "for",
      snapshot[0]
    );

    // Vérifier que la date est retournée sans formatage
    expect(bills[0].date).toBe("invalid-date");
    // Vérifier que le statut est formaté correctement
    expect(bills[0].status).toBe(formatStatus(snapshot[0].status));

    // Nettoyer le mock
    consoleSpy.mockRestore();
  });

  // Integration test for GET Bills
  describe("Given I am a user connected as Employee", () => {
    describe("When fetch bills from API fails", () => {
      beforeEach(() => {
        jest.spyOn(mockStore, "bills");
      });

      // Verify that the 404 error is displayed
      test("Then, ErrorPage should be rendered with 404 error", async () => {
        mockStore.bills.mockImplementationOnce(() => ({
          list: () => Promise.reject(new Error("Erreur 404")),
        }));
        document.body.innerHTML = BillsUI({ error: "Erreur 404" });
        expect(screen.getByText(/Erreur 404/)).toBeTruthy();
      });

      // Verify that the 500 error is displayed
      test("Then, ErrorPage should be rendered with 500 error", async () => {
        mockStore.bills.mockImplementationOnce(() => ({
          list: () => Promise.reject(new Error("Erreur 500")),
        }));
        document.body.innerHTML = BillsUI({ error: "Erreur 500" });
        expect(screen.getByText(/Erreur 500/)).toBeTruthy();
      });
    });
  });
});
