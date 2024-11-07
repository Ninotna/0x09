import { ROUTES_PATH } from "../constants/routes.js";
import { formatDate, formatStatus } from "../app/format.js";
import Logout from "./Logout.js";

export default class {
  constructor({ document, onNavigate, store, localStorage }) {
    this.document = document;
    this.onNavigate = onNavigate;
    this.store = store;
    const buttonNewBill = document.querySelector(
      `button[data-testid="btn-new-bill"]`
    );
    if (buttonNewBill)
      buttonNewBill.addEventListener("click", this.handleClickNewBill);
    const iconEye = document.querySelectorAll(`div[data-testid="icon-eye"]`);

    if (iconEye)
      iconEye.forEach((icon) => {
        icon.addEventListener("click", () => this.handleClickIconEye(icon));
      });
    new Logout({ document, localStorage, onNavigate });
  }

  handleClickNewBill = () => {
    this.onNavigate(ROUTES_PATH["NewBill"]);
  };

  /**
   * Handles the click event on the eye icon to display the bill image in a modal.
   *
   * @param {HTMLElement} icon - The eye icon element that was clicked.
   */
  handleClickIconEye = (icon) => {
    const billUrl = icon.getAttribute("data-bill-url");
    const imgWidth = Math.floor($("#modaleFile").width() * 0.5);
    $("#modaleFile")
      .find(".modal-body")
      .html(
        `<div style='text-align: center;' class="bill-proof-container"><img width=${imgWidth} src=${billUrl} alt="Bill" /></div>`
      );
    $("#modaleFile").modal("show");
  };

  /**
   * Retrieves the list of bills from the store, formats their dates and statuses,
   * and sorts them by date in ascending order (earliest to latest).
   *
   * @returns {Promise<Array<Object>>} A promise that resolves to an array of bill objects.
   * Each bill object contains the formatted date and status.
   * If the date formatting fails, the original date is returned.
   */
  getBills = () => {
    if (this.store) {
      return this.store
        .bills()
        .list()
        .then((snapshot) => {
          const bills = snapshot
            //  Issue 1: Trier par date (du plus ancien au plus récent) earliest to latest...
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .map((doc) => {
              try {
                return {
                  ...doc,
                  date: formatDate(doc.date),
                  status: formatStatus(doc.status),
                };
              } catch (e) {
                // if for some reason, corrupted data was introduced, we manage here failing formatDate function
                // log the error and return unformatted date in that case
                // console.log(e, "for", doc);
                return {
                  ...doc,
                  date: doc.date,
                  status: formatStatus(doc.status),
                };
              }
            });
          // .sort((a, b) => new Date(a.date) - new Date(b.date)); // Sorting by ascending date
          // .sort((a, b) => new Date(b.date) - new Date(a.date)); // Sorts by descending order
          console.log("length", bills.length);
          console.log(bills);
          return bills;
        });
    }
  };
}
