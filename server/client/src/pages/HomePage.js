import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import img from '../assest/pexels-tara-winstead-7723510.jpg'; 
import { Modal, Box, Typography } from '@mui/material';
import axios from 'axios';
import { message } from 'antd';
import { Button, TextField } from '@mui/material';
import '../styles/HomePage.css';

export default function HomePage() {
  const [user, setUser] = useState(null); // Initialize as null

  // Fetch logged-in user profile
  const getProfile = async () => {
    try {
      const res = await axios.get("http://localhost:7000/api/v1/user/getUserDatabyId", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      console.log("API Response:", res.data); 
      if (res.data.success) {
        setUser(res.data.data); // Set user data
      } else {
        message.error(res.data.message || "Failed to fetch user data");
      }
    } catch (error) {
      console.error("Error fetching profile:", error); 
      message.error(`Error fetching profile: ${error.message}`);
    }
  };

  useEffect(() => {
    getProfile();
  }, []);

  const [inputValue, setInputValue] = useState('');
  const [isButtonEnabled, setIsButtonEnabled] = useState(false);

  // Handle input change
  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputValue(value);

    // Enable the button if the input is not empty
    setIsButtonEnabled(value.trim().length > 0);
  };

  // Handle submit
  const handleSubmit = () => {
    console.log('Submitted value:', inputValue);
    // Perform the required action (e.g., API call)
  };

  // Ensure open is a boolean
  const isModalOpen = !!user;

  return (
    <Layout>
      <div
        className="hero-container"
        style={{
          backgroundImage: `url(${img})`,
        }}
      >
        <h2 className="hero-title">
          HEALING STARTS HERE
          <LocalHospitalIcon sx={{ fontSize: '50px', marginLeft: '10px' }} />
        </h2>
        <h3 className="hero-subtitle">
          Your health and healing is our top most priority!
        </h3>
      </div>

      <Modal
        open={isModalOpen}  // Use boolean for open prop
        onClose={() => {}}
        disableEscapeKeyDown
        aria-labelledby="blocked-modal-title"
        aria-describedby="blocked-modal-description"
      >
        {/* Background overlay for the modal */}
        <div className="modal-overlay"></div>

        <Box className="modal-box">
          <Typography id="blocked-modal-title" className="modal-title" variant="h6" component="h2">
            Account Blocked
          </Typography>
          <Typography id="blocked-modal-description" className="modal-description" sx={{ mt: 2 }}>
            Your account is currently blocked. Please contact support for assistance.
          </Typography>
          <TextField
            className="input-field"
            label="Enter Details"
            variant="outlined"
            value={inputValue}
            onChange={handleInputChange}
          />
          <Button
            className="submit-button"
            variant="contained"
            color="primary"
            disabled={!isButtonEnabled}
            onClick={handleSubmit}
          >
            Submit
          </Button>
        </Box>
      </Modal>
    </Layout>
  );
}
