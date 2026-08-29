import { useState, useEffect } from 'react';
import { RefreshCw, Folder, FileText } from 'lucide-react';
import api from '../api/client';
import Sidebar from '../components/Sidebar';

export default function Trash() {
  const [items, setItems] = useState({ folders: [], files: [] });

  useEffect(() => {
    fetchTrash();
  }, []);

  const fetchTrash = async () => {
    try {
      const res = await api.get('/trash');
      setItems({ folders: res.data.folders, files: res.data.files });
    } catch (error) {
      console.error('Error fetching trash items', error);
    }
  };

  const handleRestore = async (resourceType, resourceId) => {
    try {
      await api.post('/trash/restore', { resourceType, resourceId });
      fetchTrash();
    } catch (error) {
      alert('Failed to restore item');
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />

      <div className="flex-1 overflow-y-auto p-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Trash Bin</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {items.folders.map((folder) => (
            <div
              key={folder._id}
              className="flex items-center justify-between p-4 bg-white rounded-xl shadow-sm border opacity-75"
            >
              <div className="flex items-center gap-3 truncate">
                <Folder className="w-6 h-6 text-gray-400 flex-shrink-0" />
                <span className="font-medium text-gray-600 truncate">{folder.name}</span>
              </div>
              <button
                onClick={() => handleRestore('folder', folder._id)}
                title="Restore Folder"
                className="text-blue-600 hover:bg-blue-50 p-1.5 rounded-lg transition"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          ))}

          {items.files.map((file) => (
            <div
              key={file._id}
              className="flex items-center justify-between p-4 bg-white rounded-xl shadow-sm border opacity-75"
            >
              <div className="flex items-center gap-3 truncate">
                <FileText className="w-6 h-6 text-gray-400 flex-shrink-0" />
                <span className="font-medium text-gray-600 truncate">{file.name}</span>
              </div>
              <button
                onClick={() => handleRestore('file', file._id)}
                title="Restore File"
                className="text-blue-600 hover:bg-blue-50 p-1.5 rounded-lg transition"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        {items.folders.length === 0 && items.files.length === 0 && (
          <div className="text-center py-16 text-gray-400">Your trash bin is empty.</div>
        )}
      </div>
    </div>
  );
}