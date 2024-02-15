/*
 @jest-environment jsdom
*/

import { fireEvent, screen, waitFor } from "@testing-library/dom";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import mockStore from "../__mocks__/store";
import { ROUTES, ROUTES_PATH } from "../constants/routes";
import { localStorageMock } from "../__mocks__/localStorage.js";
import userEvent from "@testing-library/user-event";
import router from "../app/Router.js";
import store from "../__mocks__/store.js";



jest.mock("../app/Store", () => mockStore);

/* page NewBill en tant qu'employé*/
describe("When I am on NewBill Page", () => {
  beforeEach(() => {
    Object.defineProperty(window, "localStorage", { value: localStorageMock });
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
  });

  /*je vérifie que l'icône de courrier électronique est mise en surbrillance */
  test("Then mail icon on vertical layout should be highlighted", async () => {
    window.onNavigate(ROUTES_PATH.NewBill);
    await waitFor(() => screen.getByTestId("icon-mail"));
    const Icon = screen.getByTestId("icon-mail");
    expect(Icon.classList).toContain("active-icon");
  });

  test("Then I add File with supported file type", async () => {
    const dashboard = new NewBill({
      document,
      onNavigate,
      store: mockStore,
      localStorage: localStorageMock,
    });

    const handleChangeFile = jest.fn(dashboard.handleChangeFile);

    const inputFile = screen.getByTestId("file");
    inputFile.addEventListener("change", handleChangeFile);

    fireEvent.change(inputFile, {
      target: {
        files: [
          new File(["document.jpg"], "document.jpg", {
            type: "document/jpg",
          }),
        ],
      },
    });
    expect(handleChangeFile).toHaveBeenCalled();
  });

  test("Handles file change with unsupported file type", () => {
    const dashboard = new NewBill({
      document,
      onNavigate,
      store: mockStore,
      localStorage: localStorageMock,
    });

    const handleChangeFile = jest.fn(dashboard.handleChangeFile);

    const inputFile = screen.getByTestId("file");
    inputFile.addEventListener("change", handleChangeFile);

    fireEvent.change(inputFile, {
      target: {
        files: [
          new File(["document.pdf"], "document.pdf", {
            type: "application/pdf",
          }),
        ],
      },
    });
    expect(handleChangeFile).toHaveBeenCalled();
    expect(screen.getByText("Veuillez choisir une image (jpg, jpeg ou png)")).toBeTruthy();
  });
});

////////////////////////////////////////////////////////////////////////////////////

/* connecté en tant qu'employé  */
describe("Given I am connected as an employee", () => {
  describe("When I submit a new Bill", () => {
    /* je verifie l'enregistrement de la facture et afficher la nouvelle page de facturation */
    test("Then must save the bill and show the new bill page", async () => {
      localStorage.setItem("user", JSON.stringify({ type: "Employee", email: "a@a" }));
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.NewBill);

      const html = NewBillUI();
      document.body.innerHTML = html;

      const newBillInit = new NewBill({
        document,
        onNavigate,
        store: null,
        localStorage: window.localStorage,
      });

      const formNewBill = screen.getByTestId("form-new-bill");
      expect(formNewBill).toBeTruthy();

      const handleSubmit = jest.fn((e) => newBillInit.handleSubmit(e));
      formNewBill.addEventListener("submit", handleSubmit);
      fireEvent.submit(formNewBill);
      expect(handleSubmit).toHaveBeenCalled();
    });

    /* verifier que l'image de facture est correctement enregistree */
    test("Then verify the file bill", async () => {
      jest.spyOn(mockStore, "bills");

      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };

      Object.defineProperty(window, "localStorage", { value: localStorageMock });
      Object.defineProperty(window, "location", { value: { hash: ROUTES_PATH['NewBill'] } });
      window.localStorage.setItem("user", JSON.stringify({
        type: "Employee",
      }));

      const html = NewBillUI();
      document.body.innerHTML = html;

      const newBillInit = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      });

      const file = new File(['image'], 'image.png', { type: 'image/png' });
      const handleChangeFile = jest.fn((e) => newBillInit.handleChangeFile(e));
      const formNewBill = screen.getByTestId("form-new-bill");
      const billFile = screen.getByTestId('file');

      billFile.addEventListener("change", handleChangeFile);
      userEvent.upload(billFile, file);

      expect(billFile.files[0].name).toBeDefined();
      expect(handleChangeFile).toBeCalled();

      const handleSubmit = jest.fn((e) => newBillInit.handleSubmit(e));
      formNewBill.addEventListener("submit", handleSubmit);
      fireEvent.submit(formNewBill);

      expect(handleSubmit).toHaveBeenCalled();
      expect(mockStore.bills).toHaveBeenCalled();
    });
  });
});

///////////////////////////////////////////////////////////////////////////
///////////////////////test d'intégration /////////////////////////////////
///////////////////////////////////////////////////////////////////////////


// test intégration Post
//utilisateur connecté en tant qu'employé et soumet le formulaire
describe("Given I am a user connected as Employee", () => {
  describe("When I submit the completed form", () => {
    //création d'une nouvelle facture 
    test("Then the bill should be created", async () => {
      // Initialiser l'interface utilisateur avec le formulaire NewBill
      document.body.innerHTML = NewBillUI();

      // Définir la fonction de navigation
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };

      // les informations de l'utilisateur connecté
      Object.defineProperty(window, "localStorage", { value: localStorageMock });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
          email: "user@billed.com",
        })
      );

      // Initialiser la classe NewBill avec les dépendances nécessaires
      const newBill = new NewBill({
        document,
        onNavigate,
        store: null,
        localStorage: window.localStorage,
      });

      // Simuler les données du formulaire de l'utilisateur
      const billTest = {
        type: "Transport",
        name: "Vol Nice Paris",
        date: "2022-03-17",
        amount: 50,
        vat: 5,
        pct: 2,
        commentary: "some commentary",
        fileUrl: "../picture/0.jpg",
        fileName: "ticket.jpg",
        status: "pending",
      };

      // Remplir le formulaire avec les données de l'utilisateur
      screen.getByTestId("expense-type").value = billTest.type;
      screen.getByTestId("expense-name").value = billTest.name;
      screen.getByTestId("datepicker").value = billTest.date;
      screen.getByTestId("amount").value = billTest.amount;
      screen.getByTestId("vat").value = billTest.vat;
      screen.getByTestId("pct").value = billTest.pct;
      screen.getByTestId("commentary").value = billTest.commentary;

      // Assigner les propriétés fileUrl et fileName à la classe NewBill
      newBill.fileName = billTest.fileName;
      newBill.fileUrl = billTest.fileUrl;

      // Espionner la fonction de mise à jour de la facture et la soumission du formulaire
      newBill.updateBill = jest.fn();
      const handleSubmit = jest.fn((e) => newBill.handleSubmit(e));

      // Ajouter un gestionnaire d'événement à la soumission du formulaire
      const formBill = screen.getByTestId("form-new-bill");
      formBill.addEventListener("submit", handleSubmit);

      // soumettre le formulaire
      fireEvent.submit(formBill);

      // Vérifier si les fonctions appropriées ont été appelées
      expect(handleSubmit).toHaveBeenCalled();
      expect(newBill.updateBill).toHaveBeenCalled();
    });
  });
});
