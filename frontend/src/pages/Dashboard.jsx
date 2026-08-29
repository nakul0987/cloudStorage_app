import { useState, useEffect } from 'react';
import { FolderPlus, Upload, Folder, FileText, Trash2, Search } from 'lucide-react';
import api from '../api/client';
import Sidebar from '../components/Sidebar';

export default function Dashboard() {
  const [currentFolderId, setCurrentFolderId] = useState('root');
  const [items, setItems] = useState({ folders: [], files: [] });
  const [path, setPath] = useState([]);
  const [newFolderName, setNewFolderName] = useState('');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (searchQuery.trim()) {
      handleSearch();
    } else {
      fetchContents(currentFolderId);
    }
  }, [currentFolderId, searchQuery]);

  const fetchContents = async (id) => {
    try {
      const res = await api.get(`/folders/${id}`);
      setItems(res.data.children);
      setPath(res.data.path);
    } catch (error) {
      console.error('Error fetching contents', error);
    }
  };

  const handleSearch = async () => {
    try {
      const res = await api.get(`/search?q=${searchQuery}`);
      setItems({ folders: res.data.folders, files: res.data.files });
    } catch (error) {
      console.error('Search error', error);
    }
  };

  const handleCreateFolder = async (e) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    try {
      await api.post('/folders', {
        name: newFolderName,
        parentId: currentFolderId === 'root' ? null : currentFolderId,
      });
      setNewFolderName('');
      setIsCreatingFolder(false);
      fetchContents(currentFolderId);
    } catch (error) {
      alert(error.response?.data?.error?.message || 'Failed to create folder');
    }
  };

  const handleFileUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    for (const file of files) {
      try {
        const initRes = await api.post('/files/init', {
          name: file.name,
          mimeType: file.type || 'application/octet-stream',
          sizeBytes: file.size,
          folderId: currentFolderId === 'root' ? null : currentFolderId,
        });

        await api.post('/files/complete', {
          fileId: initRes.data.fileId,
        });
      } catch (error) {
        alert(`Failed to upload ${file.name}`);
      }
    }
    setIsUploading(false);
    fetchContents(currentFolderId);
  };

  const handleDeleteFolder = async (id, e) => {
    e.stopPropagation();
    if (confirm('Move folder to trash?')) {
      await api.delete(`/folders/${id}`);
      fetchContents(currentFolderId);
    }
  };

  const handleDeleteFile = async (id, e) => {
    e.stopPropagation();
    if (confirm('Move file to trash?')) {
      await api.delete(`/files/${id}`);
      fetchContents(currentFolderId);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />

      <div className="flex-1 overflow-y-auto p-8">
        {/* Top Bar with Search */}
        <div className="flex items-center justify-between mb-8">
          <div className="relative w-96">
            <Search className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search files and folders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg bg-white outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-3">
            <label className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 cursor-pointer transition">
              <Upload className="w-5 h-5" />
              <span>{isUploading ? 'Uploading...' : 'Upload File'}</span>
              <input type="file" multiple onChange={handleFileUpload} className="hidden" disabled={isUploading} />
            </label>

            <button
              onClick={() => setIsCreatingFolder(true)}
              className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition"
            >
              <FolderPlus className="w-5 h-5 text-yellow-500" />
              <span>New Folder</span>
            </button>
          </div>
        </div>

        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 text-lg font-semibold text-gray-700 mb-6">
          <button onClick={() => setCurrentFolderId('root')} className="hover:underline">Home</button>
          {path.map((crumb) => (
            <span key={crumb.id} className="flex items-center gap-2">
              <span className="text-gray-400">/</span>
              <button onClick={() => setCurrentFolderId(crumb.id)} className="hover:underline">
                {crumb.name}
              </button>
            </span>
          ))}
        </div>

        {/* New Folder Inline Modal */}
        {isCreatingFolder && (
          <form onSubmit={handleCreateFolder} className="mb-6 bg-white p-4 rounded-xl shadow border flex gap-3">
            <input
              type="text"
              placeholder="Folder name"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              className="flex-1 border px-3 py-2 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded-lg">Create</button>
            <button type="button" onClick={() => setIsCreatingFolder(false)} className="bg-gray-200 px-4 py-2 rounded-lg">Cancel</button>
          </form>
        )}

        {/* Folder & File Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {/* Folders */}
          {items.folders.map((folder) => (
            <div
              key={folder._id}
              onClick={() => setCurrentFolderId(folder._id)}
              className="flex items-center justify-between p-4 bg-white rounded-xl shadow-sm border hover:shadow-md cursor-pointer transition group"
            >
              <div className="flex items-center gap-3 truncate">
                <Folder className="w-6 h-6 text-yellow-500 flex-shrink-0" />
                <span className="font-medium text-gray-700 truncate">{folder.name}</span>
              </div>
              <button
                onClick={(e) => handleDeleteFolder(folder._id, e)}
                className="opacity-0 group-hover:opacity-100 text-red-500 hover:bg-red-50 p-1 rounded transition"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}

          {/* Files */}
          {items.files.map((file) => (
            <div
              key={file._id}
              className="flex items-center justify-between p-4 bg-white rounded-xl shadow-sm border hover:shadow-md transition group"
            >
              <div className="flex items-center gap-3 truncate">
                <FileText className="w-6 h-6 text-blue-500 flex-shrink-0" />
                <div className="truncate">
                  <p className="font-medium text-gray-700 truncate">{file.name}</p>
                  <p className="text-xs text-gray-400">{(file.sizeBytes / 1024).toFixed(1)} KB</p>
                </div>
              </div>
              <button
                onClick={(e) => handleDeleteFile(file._id, e)}
                className="opacity-0 group-hover:opacity-100 text-red-500 hover:bg-red-50 p-1 rounded transition"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        {items.folders.length === 0 && items.files.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            This folder is empty. Upload a file or create a folder to get started!
          </div>
        )}
      </div>
    </div>
  );
}