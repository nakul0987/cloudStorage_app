import { Folder, Trash2, HardDrive, LogOut } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Sidebar() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="w-64 h-screen bg-gray-900 text-white flex flex-col justify-between p-4 flex-shrink-0">
      <div>
        <div className="flex items-center gap-3 mb-8 px-2">
          <HardDrive className="w-8 h-8 text-blue-500" />
          <h1 className="text-xl font-bold tracking-wide">CloudDrive</h1>
        </div>

        <nav className="space-y-2">
          <Link
            to="/"
            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition ${
              location.pathname === '/' ? 'bg-blue-600 font-medium' : 'hover:bg-gray-800 text-gray-300'
            }`}
          >
            <Folder className="w-5 h-5 text-blue-400" />
            <span>My Drive</span>
          </Link>
          <Link
            to="/trash"
            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition ${
              location.pathname === '/trash' ? 'bg-blue-600 font-medium' : 'hover:bg-gray-800 text-gray-300'
            }`}
          >
            <Trash2 className="w-5 h-5 text-red-400" />
            <span>Trash</span>
          </Link>
        </nav>
      </div>

      <div className="border-t border-gray-800 pt-4 flex items-center justify-between">
        <div className="truncate pr-2">
          <p className="text-sm font-semibold truncate">{user?.name}</p>
          <p className="text-xs text-gray-400 truncate">{user?.email}</p>
        </div>
        <button
          onClick={handleLogout}
          title="Logout"
          className="p-2 hover:bg-gray-800 rounded-lg text-red-400 transition"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}