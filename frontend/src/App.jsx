import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Clientes from './pages/Clientes';
import Contratos from './pages/Contratos';
import Elevadores from './pages/Elevadores';
import Calendario from './pages/Calendario';
import Relatorios from './pages/Relatorios';
import 'bootstrap/dist/css/bootstrap.min.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import './App.css';

function App() {
  return (
    <Router>
      <Layout>
                  <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/clientes" element={<Clientes />} />
            <Route path="/contratos" element={<Contratos />} />
            <Route path="/elevadores" element={<Elevadores />} />
            <Route path="/calendario" element={<Calendario />} />
            <Route path="/relatorios" element={<Relatorios />} />
          </Routes>
      </Layout>
    </Router>
  );
}

export default App;
