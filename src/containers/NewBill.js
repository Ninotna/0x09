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
    this.isImgFormatValid = false;
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
    // console.log("Selected file name:", fileName); // Debugging statement
    // new variables needed to check image format
    const fileInput = this.document.querySelector(`input[data-testid="file"]`);
    const fileAcceptedFormats = ["jpg", "jpeg", "png"];
    const fileNameParts = fileName.split(".");
    const fileExtension = fileNameParts[fileNameParts.length - 1].toLowerCase();
    // console.log("File extension:", fileExtension); // Debugging statement
    this.isImgFormatValid = false;
    // if there are at least two pieces to the file name, continue the check
    if (fileNameParts.length > 1) {
      // Check if image format is .jpg, jpeg or png - if true set isImgFormatValid to true else false
      fileAcceptedFormats.indexOf(fileExtension) !== -1
        ? (this.isImgFormatValid = true)
        : (this.isImgFormatValid = false);
    }
    // console.log("isImgFormatValid:", this.isImgFormatValid); // Debugging statement
    if (!this.isImgFormatValid) {
      // if image format is not valid ...
      fileInput.value = ""; // ... remove file from the input
      fileInput.classList.add("is-invalid"); // ... add is-invalid class to tell user input is invalid
      fileInput.classList.remove("blue-border"); // ... remove blue-border class
      alert(
        "Attention! Le format de votre fichier n'est pas supporté." +
          "\n" +
          "Seuls les .jpg, .jpeg, .png sont acceptés."
      ); // Error message for user
    } else {
      // if image format is valid ...
      fileInput.classList.remove("is-invalid"); // ... remove is-invalid class
      fileInput.classList.add("blue-border"); // ... add blue-border class
      const formData = new FormData();
      const email = JSON.parse(localStorage.getItem("user")).email;
      formData.append("file", file);
      formData.append("email", email);
      this.formData = formData; // so it can be used in other methods
      this.fileName = fileName;
      this.store
        .bills()
        .create({
          data: this.formData,
          headers: {
            noContentType: true,
          },
        })
        .then(({ fileUrl, key }) => {
          this.billId = key;
          this.fileUrl = fileUrl;
        })
        .catch((error) => console.error(error));
    }
  };
  handleSubmit = async (e) => {
    e.preventDefault();

    const email = JSON.parse(localStorage.getItem("user"))?.email || "";
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

    if (this.isImgFormatValid && this.fileUrl) {
      try {
        await this.store.bills().create({
          data: this.formData,
          headers: { noContentType: true },
        });
        this.updateBill(bill);
      } catch (error) {
        console.error("Error creating bill:", error);
      }
    } else {
      alert("Invalid image format or missing file.");
    }
  };

  // not need to cover this function by tests
  /* istanbul ignore next */
  updateBill = (bill) => {
    if (this.store) {
      this.store
        .bills()
        .update({ data: JSON.stringify(bill), selector: this.billId })
        .then(() => {
          this.onNavigate(ROUTES_PATH["Bills"]);
        })
        .catch((error) => console.error(error));
    }
  };
}
