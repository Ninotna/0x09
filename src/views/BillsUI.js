import VerticalLayout from "./VerticalLayout.js";
import ErrorPage from "./ErrorPage.js";
import LoadingPage from "./LoadingPage.js";
import Actions from "./Actions.js";

const row = (bill) => {
  return `
    <tr data-testid="bill-item">
      <td data-testid="type">${bill.type}</td>
      <td data-testid="name">${bill.name}</td>
      <td data-testid="bill-date">${bill.date}</td>
      <td data-testid="amount">${bill.amount} €</td>
      <td data-testid="status">${bill.status}</td>
      <td>
        ${Actions(bill.fileUrl)}
      </td>
    </tr>
  `;
};

const rows = (data) => {
  return data && data.length ? data.map((bill) => row(bill)).join("") : "";
};

export default ({ data: bills, loading, error }) => {
  // If there is an error, render the error page
  if (error) {
    return `
      <div class='layout'>
        ${VerticalLayout(120)}
        <div class='content'>
          <div class='content-header'>
            <div class='content-title'> Mes notes de frais </div>
          </div>
          <div id="data-table">
            <p>${error}</p>
          </div>
        </div>
      </div>
    `;
  }

  // If loading is true, render loading page
  if (loading) {
    return LoadingPage();
  }

  // Sort bills by date from latest to earliest
  const sortedBills =
    bills && bills.length
      ? bills.sort((a, b) => new Date(b.date) - new Date(a.date))
      : [];

  // Handle cases where there are no bills
  if (!bills || bills.length === 0) {
    return `
      <div class='layout'>
        ${VerticalLayout(120)}
        <div class='content'>
          <div class='content-header'>
            <div class='content-title'> Mes notes de frais </div>
          </div>
          <div id="data-table">
            <p>Aucune note de frais</p>
          </div>
        </div>
      </div>
    `;
  }

  const modal = () => `
    <div class="modal fade" id="modaleFile" tabindex="-1" role="dialog" aria-labelledby="exampleModalCenterTitle" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered modal-lg" role="document">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="exampleModalLongTitle">Justificatif</h5>
            <button type="button" class="close" data-dismiss="modal" aria-label="Close">
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
          <div class="modal-body">
          </div>
        </div>
      </div>
    </div>
  `;

  return `
    <div class='layout'>
      ${VerticalLayout(120)}
      <div class='content'>
        <div class='content-header'>
          <div class='content-title'> Mes notes de frais </div>
          <button type="button" data-testid="btn-new-bill" class="btn btn-primary">Nouvelle note de frais</button>
        </div>
        <div id="data-table">
          <table id="example" class="table table-striped" style="width:100%">
            <thead>
              <tr data-testid="bill">
                <th>Type</th>
                <th>Nom</th>
                <th>Date</th>
                <th>Montant</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody data-testid="tbody">
              ${rows(sortedBills)}
            </tbody>
          </table>
        </div>
      </div>
      ${modal()}
    </div>
  `;
};
