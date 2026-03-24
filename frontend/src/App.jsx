import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home';
import Demo from './pages/Demo';
import './App.css';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-white dark:bg-slate-900">
        {/* Navigation */}
        <nav className="bg-saffron text-white shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <Link to="/" className="flex items-center space-x-2">
                <span className="text-2xl font-bold">🚀 PolicyGPT</span>
              </Link>
              <div className="flex space-x-6">
                <Link to="/" className="hover:bg-opacity-90 px-3 py-2 rounded">
                  Chat
                </Link>
                <Link to="/demo" className="hover:bg-opacity-90 px-3 py-2 rounded">
                  Demo
                </Link>
              </div>
            </div>
          </div>
        </nav>

        {/* Routes */}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/demo" element={<Demo />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
