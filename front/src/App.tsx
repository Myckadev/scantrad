import React, { useState } from 'react';
import { Container, Typography, Box, Stepper, Step, StepLabel, Button } from '@mui/material';
import { BrowserRouter } from "react-router-dom";
import { Login } from './components/Login';
import { BatchUpload } from './features/batchUpload/BatchUpload';
import { Gallery } from './features/gallery/Gallery';
import { Reader } from './features/reader/Reader';

const steps = ['Upload', 'Processing', 'Read'];

export default function App() {
  const [userPseudo, setUserPseudo] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [batchId, setBatchId] = useState<string | null>(null);

  const handleLoginSuccess = (pseudo: string) => {
    setUserPseudo(pseudo);
  };

  const handleLogout = () => {
    setUserPseudo(null);
    setActiveStep(0);
    setBatchId(null);
  };

  const handleUploadSuccess = (newBatchId: string) => {
    setBatchId(newBatchId);
    setActiveStep(1);
  };

  const handleProcessingComplete = () => {
    setActiveStep(2);
  };

  if (!userPseudo) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <BrowserRouter>
      <Container maxWidth="lg">
        <Box sx={{ my: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h3" component="h1">
              Scantrad App
            </Typography>
            <Box>
              <Typography variant="body1" sx={{ mr: 2, display: 'inline' }}>
                Welcome, {userPseudo}
              </Typography>
              <Button variant="outlined" size="small" onClick={handleLogout}>
                Logout
              </Button>
            </Box>
          </Box>
          
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {activeStep === 0 && (
            <BatchUpload onUploadSuccess={handleUploadSuccess} userPseudo={userPseudo} />
          )}

          {activeStep === 1 && batchId && (
            <Gallery batchId={batchId} userPseudo={userPseudo} onProcessingComplete={handleProcessingComplete} />
          )}

          {activeStep === 2 && batchId && (
            <Reader batchId={batchId} userPseudo={userPseudo} />
          )}
        </Box>
      </Container>
    </BrowserRouter>
  )
}