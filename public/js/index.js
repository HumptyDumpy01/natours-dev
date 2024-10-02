/* eslint-disable */
import '@babel/polyfill';
import { login, logout } from './login';
import { hideAlert, showAlert } from './alerts';
import axios from 'axios';
import { bookTour } from './stripe';

document.addEventListener('DOMContentLoaded', function() {
  const form = document.querySelector('.form');
  const userForm = document.querySelector('.form-user-data');
  const mapBox = document.querySelector('#map');
  const logOutButton = document.querySelector('.nav__el--logout');
  const bookBtn = document.querySelector(`#book-tour`);

  if (mapBox) {
    const locations = JSON.parse(document.getElementById('map').dataset.locations);
    // displayMap(locations);
  }

  if (form) {
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);

      const email = formData.get('email');
      const password = formData.get('password');

      if (!email || !email.includes('@') || !password) {
        return;
      }
      login(email, password);
    });
  }

  if (userForm) {
    userForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);

      const name = formData.get('name');
      const email = formData.get('email');
      const photo = formData.get('photo');

      if (!name || !email || !email.includes('@')) {
        showAlert('error', 'Invalid input data! Please fill in the fields!');
        return;
      }

      try {
        const res = await axios({
          method: 'PATCH',
          url: 'http://localhost:8001/api/v1/users/auth/updateMe',
          data: formData,
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });

        if (res.data.status === 'success') {
          showAlert('success', 'The data was successfully updated!');
          window.setTimeout(function() {
            hideAlert();
          }, 2000);
        } else {
          showAlert('error', 'Failed to update the data! Please, try again later!');
          window.setTimeout(function() {
            hideAlert();
          }, 2000);
        }
      } catch (err) {
        showAlert('error', 'Failed to update the data! Please, try again later!');
        window.setTimeout(function() {
          hideAlert();
        }, 2000);
      }
    });
  }

  if (bookBtn) {
    bookBtn.addEventListener(`click`, function(e) {
      e.target.textContent = `Booking...`;
      const { tourId } = e.target.dataset;
      bookTour(tourId);
    });
  }

  if (logOutButton) {
    logOutButton.addEventListener('click', logout);
  }
});