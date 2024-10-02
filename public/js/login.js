/* eslint-disable */
import axios from 'axios';
import { showAlert } from './alerts';

export async function login(email, password) {
  try {

    const res = await axios({
      method: `POST`,
      url: `/api/v1/users/auth/login`,
      data: {
        email: email,
        password: password
      }
    });

    if (res.data.status === `success`) {
      showAlert(`success`, `Logged in successfully!`);

      window.setTimeout(function() {
        location.assign(`/`);
      }, 1500);
    }

    // console.log(`Executing res: `, res);
  } catch (e) {
    showAlert(`error`, `Failed to login the user!`);
  }
}

export async function logout() {
  try {
    const res = await axios({
      method: `GET`,
      url: `/api/v1/users/auth/logout`
    });

    if (res.data.status === `success`) {

      showAlert(`success`, `You are logged out!`);

      window.setTimeout(function() {
        // the true val inside reload means the page would be reloaded not only from client cache, but
        // on server.
        location.reload(true);
      }, 1500);
    }

  } catch (e) {
    showAlert(`error`, `Failed to log out the user!`);
  }
}
