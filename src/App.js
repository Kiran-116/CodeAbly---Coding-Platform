import React, { useState } from 'react';
import { Routes, BrowserRouter, Route } from 'react-router-dom';
import { ChakraProvider, CheckboxGroup } from "@chakra-ui/react";
import CodeEditor from './components/CodeEditor';
import AllCodes from './components/AllCodes';
import LandingPage from './components/Landing';
import VideoCall from './components/VideoCall';
import { Realtime } from 'ably';
import { AblyProvider } from 'ably/react';

function App() {
  const client = new Realtime({ key: process.env.REACT_APP_ABLY_KEY });

  return (
    <>
    <AblyProvider client={client}>
    <ChakraProvider>
    <BrowserRouter>
    <Routes>
        <Route path="/" element={<LandingPage/>}></Route>
        <Route path="/home" element={<AllCodes/>}></Route>
        <Route path='/code/:id' element={<CodeEditor/>}></Route>
        <Route path="/vcall" element={<VideoCall/>}></Route>
    </Routes>
    </BrowserRouter>
    </ChakraProvider>
    </AblyProvider>
    </>
  );
}

export default App;
