import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import './App.css';
import GradeCalculator from './components/GradeCalculator';

function App() {
  return (
    <BrowserRouter>
      <div className="App">
        <GradeCalculator />
      </div>
    </BrowserRouter>
  );
}

export default App;
