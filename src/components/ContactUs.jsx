import React, { useState } from 'react';
import './ContactUs.css';

const ContactUs = () => {
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="contact-container">
      <h1 className="contact-title">Connect With JR Tech Inc!</h1>
      <p className="contact-description">
        At JR Tech Inc, we value every inquiry and collaboration. Whether you have a question about our products, need support, or want to discuss a partnership, our team is here to help. Reach out and become part of our journey in technology and innovation.
      </p>

      <div className="contact-details">
        <p><strong>Phone:</strong> +91-93104-75549</p>
        <p><strong>Email:</strong> jrtechinc21@gmail.com</p>
        <p><strong>Address:</strong> Pocket A8/129, Kalkaji Extension, New Delhi, India</p>
      </div>

      {!submitted ? (
        <form
          className="contact-form"
          action="https://formsubmit.co/jrtechinc21@gmail.com"
          method="POST"
          onSubmit={() => setSubmitted(true)}
        >
          {/* Hidden inputs to configure Formsubmit */}
          <input type="hidden" name="_captcha" value="false" />
          <input type="hidden" name="_template" value="box" />
          <input type="hidden" name="_autoresponse" value="Thanks for contacting JR Tech Inc! We’ll get back to you soon." />
          <div className='form-group-1-parent'>
            <div className="form-group-1">
              <label htmlFor="name">Your Name</label>
              <input name="name" type="text" id="name" placeholder="Your Full Name" required />
            </div>
            <div className="form-group-1">
              <label htmlFor="phone">Your Phone</label>
              <input name="phone" type="tel" id="phone" placeholder='+91 - xxxx-xxxx-xx' required />
            </div>
          </div>
          <div className="form-group-2">
            <label htmlFor="email">Your Email</label>
            <input name="email" type="email" id="email" placeholder="you@example.com" required />
          </div>
          <div className="form-group-2">
            <label htmlFor="message">Message</label>
            <textarea name="message" id="message" placeholder="Tell us what's on your mind..." rows="6" required></textarea>
          </div>
          <button type="submit" className="contact-button">Send Message</button>
        </form>
      ) : (
        <div className="thank-you-message">
          <h2>Thank you!</h2>
          <p>Your message has been sent. We'll get back to you soon.</p>
        </div>
      )}
    </div>
  );
};

export default ContactUs;
