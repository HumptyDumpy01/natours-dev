/* eslint-disable */
import axios from 'axios';
import { loadStripe } from '@stripe/stripe-js';
import { showAlert } from './alerts';

const stripePromise = loadStripe(`pk_test_51Q5SwYDCNxL2XOwanZ3tQyiVU1UgyOQ5uSaLXeEDDnEnoIk5YOl8l3Pp3pvCDHHmrSHEkiGydCbSTU4ZvTsfEDCS00jFAUjEKo`);

export async function bookTour(tourId) {
  try {
    /* TODO: 1. Get checkout session from API */
    const session = await axios(`http://localhost:8001/api/v1/bookings/checkout-session/${tourId}`);

    // console.log(`Executing session: `, session);

    /* TODO: 2. Create checkout form + charge credit card */
    const stripe = await stripePromise;
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id
    });

  } catch (e) {
    console.log(e);
    showAlert(`error`, `Failed to load payment intent!`);
  }
}