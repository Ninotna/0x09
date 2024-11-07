/**
 * @jest-environment jsdom
 */

import "@testing-library/jest-dom/extend-expect";
import LoginUI from "../views/LoginUI";
import Login from "../containers/Login.js";
import { ROUTES } from "../constants/routes";
import { fireEvent, screen } from "@testing-library/dom";

const setupLoginTest = (userType) => {
  document.body.innerHTML = LoginUI();

  const inputEmail = screen.getByTestId(`${userType}-email-input`);
  const inputPassword = screen.getByTestId(`${userType}-password-input`);
  const form = screen.getByTestId(`form-${userType}`);

  return { inputEmail, inputPassword, form };
};

const fillAndSubmitForm = (
  form,
  emailInput,
  passwordInput,
  email,
  password
) => {
  fireEvent.change(emailInput, { target: { value: email } });
  fireEvent.change(passwordInput, { target: { value: password } });
  fireEvent.submit(form);
};

describe("Given that I am a user on login page", () => {
  const userData = {
    employee: { email: "employee@example.com", password: "password123" },
    admin: { email: "admin@example.com", password: "admin123" },
  };

  ["employee", "admin"].forEach((userType) => {
    describe(`When I am on ${userType} login page`, () => {
      test("Then It should render Login page if fields are empty", () => {
        const { inputEmail, inputPassword, form } = setupLoginTest(userType);
        expect(inputEmail.value).toBe("");
        expect(inputPassword.value).toBe("");
        const handleSubmit = jest.fn((e) => e.preventDefault());
        form.addEventListener("submit", handleSubmit);
        fireEvent.submit(form);
        expect(screen.getByTestId(`form-${userType}`)).toBeTruthy();
      });

      test("Then It should render Login page for incorrect format", () => {
        const { inputEmail, inputPassword, form } = setupLoginTest(userType);
        fillAndSubmitForm(
          form,
          inputEmail,
          inputPassword,
          "notAnEmail",
          "12345"
        );
        expect(inputEmail.value).toBe("notAnEmail");
        expect(inputPassword.value).toBe("12345");
        expect(screen.getByTestId(`form-${userType}`)).toBeTruthy();
      });

      test("Then I should be identified correctly and redirected", () => {
        const { inputEmail, inputPassword, form } = setupLoginTest(userType);
        const { email, password } = userData[userType];

        Object.defineProperty(window, "localStorage", {
          value: { getItem: jest.fn(() => null), setItem: jest.fn(() => null) },
          writable: true,
        });

        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname });
        };
        const login = new Login({
          document,
          localStorage: window.localStorage,
          onNavigate,
        });

        const handleSubmit = jest.fn(
          login[
            `handleSubmit${
              userType.charAt(0).toUpperCase() + userType.slice(1)
            }`
          ]
        );
        form.addEventListener("submit", handleSubmit);
        fillAndSubmitForm(form, inputEmail, inputPassword, email, password);

        expect(handleSubmit).toHaveBeenCalled();
        expect(window.localStorage.setItem).toHaveBeenCalledWith(
          "user",
          JSON.stringify({
            type: userType.charAt(0).toUpperCase() + userType.slice(1),
            email,
            password,
            status: "connected",
          })
        );
      });
    });
  });

  test("Employee should see Bills page", () => {
    expect(screen.getAllByText("Mes notes de frais")).toBeTruthy();
  });

  test("Admin should see HR dashboard page", () => {
    expect(screen.queryByText("Validations")).toBeTruthy();
  });
});
