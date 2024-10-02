import axios from 'axios';
import { showAlert } from './alerts';

export async function updateData(name, email, photo) {

  try {
    const res = await axios({
      method: `PATCH`,
      url: `http://localhost:8001/api/v1/users/auth/updateMe`,
      data: {
        name,
        email,
        photo: photo || undefined
      }
    });

    if (res.data.status === `success`) {
      location.reload(true);
    }

    if (res.data.status !== `success`) {
      showAlert(`error`, `Failed to update the data! Please try again later!`);
    }

  } catch (e) {
    showAlert(`error`, e.response.data.message || `Failed to update the data! Please try again later!`);
  }

}

export async function changePassword(oldPassword, newPassword) {
  try {
    const res = await axios({
      method: `PATCH`,
      url: `http://localhost:8001/api/v1/users/auth/updatePassword`,
      data: {
        oldPassword,
        newPassword
      }
    });

    if (res.data.status === `success`) {
      showAlert(`success`, `The Password was successfully updated!`);
      return;
    }

    if (res.data.status !== `success`) {
      showAlert(`success`, `Failed to update the password! Please try again!`);
    }


  } catch (e) {
    showAlert(`error`, e.response.data.message || `Failed to update the password! Please try again!`);
  }
}
