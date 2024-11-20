import { ROUTES_PATH } from "../constants/routes.js";
export let PREVIOUS_LOCATION = "";

// Classe pour gérer les soumissions d'utilisateur
export default class Login {
  constructor({
    document,
    localStorage,
    onNavigate,
    PREVIOUS_LOCATION,
    store,
  }) {
    this.document = document;
    this.localStorage = localStorage;
    this.onNavigate = onNavigate;
    this.PREVIOUS_LOCATION = PREVIOUS_LOCATION;
    this.store = store;

    // Initialisation des formulaires
    this.initForms();
  }

  initForms() {
    const formEmployee = this.document.querySelector(
      `form[data-testid="form-employee"]`
    );
    const formAdmin = this.document.querySelector(
      `form[data-testid="form-admin"]`
    );

    formEmployee.addEventListener("submit", (e) =>
      this.handleSubmit(e, "Employee", ROUTES_PATH["Bills"])
    );
    formAdmin.addEventListener("submit", (e) =>
      this.handleSubmit(e, "Admin", ROUTES_PATH["Dashboard"])
    );
  }

  async handleSubmit(e, userType, navigateTo) {
    e.preventDefault();

    // Collecte des informations utilisateur
    const user = {
      type: userType,
      email: e.target.querySelector(
        `input[data-testid="${userType.toLowerCase()}-email-input"]`
      ).value,
      password: e.target.querySelector(
        `input[data-testid="${userType.toLowerCase()}-password-input"]`
      ).value,
      status: "connected",
    };

    // Stockage local
    this.localStorage.setItem("user", JSON.stringify(user));

    try {
      // Tentative de connexion
      await this.login(user);
      this.finalizeLogin(navigateTo);
    } catch (err) {
      // Si login échoue, vérifier et créer utilisateur si nécessaire
      const userExists = await this.checkUserExists(user.email);
      if (!userExists) {
        await this.createUser(user);
        this.finalizeLogin(navigateTo);
      } else {
        console.error("Erreur : utilisateur déjà existant.");
        alert("Utilisateur déjà existant. Veuillez vérifier vos informations.");
      }
    }
  }

  async login(user) {
    if (this.store) {
      const response = await this.store.login(
        JSON.stringify({
          email: user.email,
          password: user.password,
        })
      );
      localStorage.setItem("jwt", response.jwt);
    } else {
      throw new Error("Store non disponible");
    }
  }

  async createUser(user) {
    if (this.store) {
      await this.store.users().create({
        data: JSON.stringify({
          type: user.type,
          name: user.email.split("@")[0],
          email: user.email,
          password: user.password,
        }),
      });
      console.log(`Utilisateur créé : ${user.email}`);
      await this.login(user);
    } else {
      throw new Error("Store non disponible");
    }
  }

  async checkUserExists(email) {
    if (this.store) {
      try {
        await this.store.users().get({ selector: email });
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }

  finalizeLogin(navigateTo) {
    this.onNavigate(navigateTo);
    this.PREVIOUS_LOCATION = navigateTo;
    PREVIOUS_LOCATION = this.PREVIOUS_LOCATION;
    this.document.body.style.backgroundColor = "#fff";
  }
}
