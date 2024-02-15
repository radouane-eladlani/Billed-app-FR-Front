/**
 * @jest-environment jsdom
 */

import { screen, waitFor, within } from "@testing-library/dom"
import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import { ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store.js";
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"
import userEvent from '@testing-library/user-event';
import { ROUTES } from "../constants/routes.js"
import "@testing-library/jest-dom";
import Bills from "../containers/Bills.js";
import router from "../app/Router.js";

jest.mock("../app/store", () => mockStore);


describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {

      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')
      expect(windowIcon.classList).toContain("active-icon");
    })

    test("Then bills should be ordered from earliest to latest", async () => {
      let Bill = new Bills({ document, onNavigate, store: mockStore, localStorage: window.localStorage })
      let bills = await Bill.getBills()
      const dates = bills.map(b => b.date)
      const antiChrono = (a, b) => ((a.date < b.date) ? 1 : -1)
      const datesSorted = dates.sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })
  });
});


describe("When I click on New Bill Button", () => {
  test("Then I should be sent on New Bill form", () => {
    const onNavigate = pathname => {
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

    const buttonNewBill = screen.getByRole("button", {
      name: /nouvelle note de frais/i,
    });
    expect(buttonNewBill).toBeTruthy();
    const handleClickNewBill = jest.fn(bills.handleClickNewBill);
    buttonNewBill.addEventListener("click", handleClickNewBill);
    userEvent.click(buttonNewBill);
    expect(handleClickNewBill).toHaveBeenCalled();
  });
});


describe("When I click on one eye icon", () => {
  test("Then a modal should open", async () => {
    const onNavigate = pathname => {
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

    const billsPage = new Bills({
      document,
      onNavigate,
      store: mockStore,
      localStorage: window.localStorage,
    });

    document.body.innerHTML = BillsUI({ data: bills });

    const iconEyes = screen.getAllByTestId("icon-eye");

    const handleClickIconEye = jest.fn(billsPage.handleClickIconEye);

    const modale = document.getElementById("modaleFile");

    $.fn.modal = jest.fn(() => modale.classList.add("show")); //mock de la modale Bootstrap

    iconEyes.forEach(iconEye => {
      iconEye.addEventListener("click", () => handleClickIconEye(iconEye));
      userEvent.click(iconEye);

      expect(handleClickIconEye).toHaveBeenCalled();

      expect(modale.classList).toContain("show");
    });
  });
});

// test d'intégration GET
describe("When I navigate to Bills Page", () => {
  test("fetches bills from mock API GET", async () => {
    jest.spyOn(mockStore, "bills");
    Object.defineProperty(window, "localStorage", {
      value: localStorageMock,
    });
    localStorage.setItem(
      "user",
      JSON.stringify({ type: "Employee", email: "a@a" })
    );

    const root = document.createElement("div");
    root.setAttribute("id", "root");
    document.body.append(root);
    router();
    window.onNavigate(ROUTES_PATH.Bills);

    await waitFor(() => screen.getByText("Mes notes de frais"));

    const newBillBtn = await screen.findByRole("button", {
      name: /nouvelle note de frais/i
    });
    const billsTable = screen.queryAllByTestId("tbody");

    const firstBillsTable = billsTable[0];

    expect(newBillBtn).toBeTruthy();
    expect(firstBillsTable).toBeTruthy();
    expect(within(firstBillsTable).getAllByRole("row")).toHaveLength(4);
  });

  test("fetches bills from an API and fails with 404 message error", async () => {
    mockStore.bills.mockImplementationOnce(() => {
      return {
        list: () => {
          return Promise.reject(new Error("Erreur 404"));
        },
      };
    });
    window.onNavigate(ROUTES_PATH.Bills);
    await new Promise(process.nextTick);
    const message = screen.queryByText(/Erreur 404/);
    expect(message).toBeTruthy();
  });

  test("fetches messages from an API and fails with 500 message error", async () => {
    mockStore.bills.mockImplementationOnce(() => {
      return {
        list: () => {
          return Promise.reject(new Error("Erreur 500"));
        },
      };
    });

    window.onNavigate(ROUTES_PATH.Bills);
    await new Promise(process.nextTick);
    const message = screen.queryByText(/Erreur 500/);
    expect(message).toBeTruthy();
  });
});