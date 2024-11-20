import { ROUTES_PATH } from "../constants/routes.js";
import Logout from "./Logout.js";

export default class NewBill {
  constructor({ document, onNavigate, store, localStorage }) {
    this.document = document;
    this.onNavigate = onNavigate;
    this.store = store;
    const formNewBill = this.document.querySelector(
      `form[data-testid="form-new-bill"]`
    );
    formNewBill.addEventListener("submit", this.handleSubmit);
    const file = this.document.querySelector(`input[data-testid="file"]`);
    file.addEventListener("change", this.handleChangeFile);
    this.fileUrl = null;
    this.fileName = null;
    this.billId = null;
    new Logout({ document, localStorage, onNavigate });
  }

  handleChangeFile = (e) => {
    e.preventDefault();
    const file = this.document.querySelector(`input[data-testid="file"]`)
      .files[0];
    const fileName = file.name;

    // Variables nécessaires pour vérifier le format de l'image
    const fileInput = this.document.querySelector(`input[data-testid="file"]`);
    const fileAcceptedFormats = ["jpg", "jpeg", "png"];
    const fileNameParts = fileName.split(".");
    const fileExtension = fileNameParts[fileNameParts.length - 1].toLowerCase();
    this.isImgFormatValid = false;

    // Vérifier s'il y a au moins deux parties dans le nom du fichier avant de continuer
    if (fileNameParts.length > 1) {
      // Vérifie si le format de l'image est valide (.jpg, .jpeg ou .png)
      // Si oui, définit isImgFormatValid à true, sinon à false
      fileAcceptedFormats.indexOf(fileExtension) !== -1
        ? (this.isImgFormatValid = true)
        : (this.isImgFormatValid = false);
    }

    if (!this.isImgFormatValid) {
      // Si le format de l'image n'est pas valide :
      fileInput.value = ""; // Réinitialise l'input
      fileInput.classList.add("is-invalid"); // Ajoute la classe is-invalid pour indiquer une erreur à l'utilisateur
      fileInput.classList.remove("blue-border"); // Supprime la classe blue-border
      alert(
        "Attention! Le format de votre fichier n'est pas pris en charge.\n" +
          "Seuls les formats .jpg, .jpeg, .png sont acceptés."
      ); // Affiche un message d'erreur à l'utilisateur
    } else {
      // Si le format de l'image est valide :
      fileInput.classList.remove("is-invalid"); // Supprime la classe is-invalid
      fileInput.classList.add("blue-border"); // Ajoute la classe blue-border
      const formData = new FormData();
      const email = JSON.parse(localStorage.getItem("user")).email;
      formData.append("file", file);
      formData.append("email", email);
      this.formData = formData; // Stocke formData pour une utilisation dans d'autres méthodes
      this.fileName = fileName;
    }
  };

  handleSubmit = (e) => {
    e.preventDefault();
    console.log(
      'e.target.querySelector(`input[data-testid="datepicker"]`).value',
      e.target.querySelector(`input[data-testid="datepicker"]`).value
    );

    const email = JSON.parse(localStorage.getItem("user")).email;
    const bill = {
      email,
      type: e.target.querySelector(`select[data-testid="expense-type"]`).value,
      name: e.target.querySelector(`input[data-testid="expense-name"]`).value,
      amount: parseInt(
        e.target.querySelector(`input[data-testid="amount"]`).value
      ),
      date: e.target.querySelector(`input[data-testid="datepicker"]`).value,
      vat: e.target.querySelector(`input[data-testid="vat"]`).value,
      pct:
        parseInt(e.target.querySelector(`input[data-testid="pct"]`).value) ||
        20,
      commentary: e.target.querySelector(`textarea[data-testid="commentary"]`)
        .value,
      fileUrl: this.fileUrl,
      fileName: this.fileName,
      status: "pending",
    };

    if (this.isImgFormatValid) {
      // Si le format de l'image est valide :
      // Déplace le processus dans handleSubmit pour uploader l'image et créer une nouvelle facture uniquement si le format est valide
      this.store
        .bills()
        .create({
          data: this.formData,
          headers: {
            noContentType: true,
          },
        })
        .then(({ fileUrl, key }) => {
          console.log(fileUrl);
          this.billId = key; // Définit l'ID de la facture
          this.fileUrl = fileUrl; // Définit l'URL du fichier
        })
        .then(() => {
          this.updateBill(bill); // Met à jour la facture
        })
        .catch((error) => console.error(error)); // Gère les erreurs
    }
  };

  // Cette fonction ne nécessite pas de couverture dans les tests
  /* istanbul ignore next */
  updateBill = (bill) => {
    if (this.store) {
      this.store
        .bills()
        .update({ data: JSON.stringify(bill), selector: this.billId })
        .then(() => {
          this.onNavigate(ROUTES_PATH["Bills"]); // Navigue vers la liste des factures
        })
        .catch((error) => console.error(error)); // Gère les erreurs
    }
  };
}
