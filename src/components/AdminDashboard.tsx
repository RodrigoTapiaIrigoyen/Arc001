import { useState, useEffect } from 'react';
import { 
  Shield, 
  Users, 
  AlertTriangle, 
  FileText, 
  Activity,
  Ban,
  UserX,
  Trash2,
  Eye,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  MessageSquare,
  ShoppingCart
} from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';

interface DashboardStats {
  users: {
    total: number;
    active: number;
    banned: number;
    today: number;
  };
  content: {
    posts: number;
    listings: number;
    postsToday: number;
  };
  reports: {
    pending: number;
  };
}

interface User {
  _id: string;
  username: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  bannedAt?: string;
  banReason?: string;
  warnings?: Array<{ reason: string; date: string; adminId: string }>;
}

interface Report {
  _id: string;
  type: string;
  targetId: string;
  targetType: string;
  reportedBy: string;
  reason: string;
  status: string;
  createdAt: string;
}

interface AuditLog {
  _id: string;
  adminId: string;
  action: string;
  details: any;
  timestamp: string;
}

interface Post {
  _id: string;
  userId: string;
  username: string;
  title: string;
  content: string;
  category: string;
  createdAt: string;
  deleted?: boolean;
  likes?: number;
  comments?: number;
}

interface Listing {
  _id: string;
  userId: string;
  username: string;
  itemName: string;
  description: string;
  itemsOffered: string[];
  createdAt: string;
  deleted?: boolean;
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'content' | 'reports' | 'activity'>('overview');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [contentType, setContentType] = useState<'posts' | 'listings'>('posts');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showBanModal, setShowBanModal] = useState(false);
  const [showWarnModal, setShowWarnModal] = useState(false);
  const [banReason, setBanReason] = useState('');
  const [banDuration, setBanDuration] = useState('');
  const [warnReason, setWarnReason] = useState('');

  useEffect(() => {
    loadData();
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'content') {
      loadContent();
    }
  }, [contentType]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'overview') {
        await loadStats();
      } else if (activeTab === 'users') {
        await loadUsers();
      } else if (activeTab === 'content') {
        await loadContent();
      } else if (activeTab === 'reports') {
        await loadReports();
      } else if (activeTab === 'activity') {
        await loadAuditLogs();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error loading data');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    const response = await api.get('/admin/stats');
    setStats(response);
  };

  const loadUsers = async () => {
    const params = new URLSearchParams();
    if (searchTerm) params.append('search', searchTerm);
    if (filterRole) params.append('role', filterRole);
    if (filterStatus) params.append('isActive', filterStatus);

    const response = await api.get(`/admin/users?${params.toString()}`);
    setUsers(response.users);
  };

  const loadReports = async () => {
    const response = await api.get('/admin/reports');
    setReports(response.reports);
  };

  const loadAuditLogs = async () => {
    const response = await api.get('/admin/activity');
    setAuditLogs(response.activity);
  };

  const loadContent = async () => {
    if (contentType === 'posts') {
      const response = await api.get('/community/posts');
      setPosts(response.posts || []);
    } else {
      try {
        // Intentar endpoint admin primero
        const response = await api.get('/admin/content/listings');
        setListings(response.listings || []);
      } catch (error) {
        // Fallback al endpoint público si el admin aún no está desplegado
        console.log('Usando endpoint público como fallback');
        const response = await api.get('/marketplace');
        setListings(Array.isArray(response) ? response : []);
      }
    }
  };

  const handleBanUser = async () => {
    if (!selectedUser || !banReason) {
      toast.error('Debes proporcionar una razón');
      return;
    }

    try {
      const duration = banDuration ? parseInt(banDuration) * 24 * 60 * 60 * 1000 : null;
      await api.post(`/admin/users/${selectedUser._id}/ban`, {
        reason: banReason,
        duration
      });
      toast.success('Usuario baneado exitosamente');
      setShowBanModal(false);
      setBanReason('');
      setBanDuration('');
      loadUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al banear usuario');
    }
  };

  const handleUnbanUser = async (userId: string) => {
    try {
      await api.post(`/admin/users/${userId}/unban`);
      toast.success('Usuario desbaneado exitosamente');
      loadUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al desbanear usuario');
    }
  };

  const handleWarnUser = async () => {
    if (!selectedUser || !warnReason) {
      toast.error('Debes proporcionar una razón');
      return;
    }

    try {
      await api.post(`/admin/users/${selectedUser._id}/warn`, {
        reason: warnReason
      });
      toast.success('Advertencia enviada exitosamente');
      setShowWarnModal(false);
      setWarnReason('');
      loadUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al advertir usuario');
    }
  };

  const handleDeletePost = async (postId: string) => {
    const reason = prompt('Razón para eliminar esta publicación:');
    if (!reason) return;

    try {
      await api.delete(`/admin/posts/${postId}`, { data: { reason } });
      toast.success('Publicación eliminada exitosamente');
      loadContent();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al eliminar publicación');
    }
  };

  const handleDeleteListing = async (listingId: string) => {
    const reason = prompt('Razón para eliminar este artículo:');
    if (!reason) return;

    try {
      await api.delete(`/admin/listings/${listingId}`, { data: { reason } });
      toast.success('Artículo eliminado exitosamente');
      loadContent();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al eliminar artículo');
    }
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/20 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <Users className="text-blue-400" size={24} />
            <span className="text-xs text-gray-400">Total</span>
          </div>
          <div className="text-3xl font-bold text-white">{stats?.users.total || 0}</div>
          <div className="text-sm text-gray-400 mt-1">Usuarios registrados</div>
          <div className="text-xs text-green-400 mt-2">+{stats?.users.today || 0} hoy</div>
        </div>

        <div className="bg-gradient-to-br from-green-500/10 to-green-600/10 border border-green-500/20 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <CheckCircle className="text-green-400" size={24} />
            <span className="text-xs text-gray-400">Activos</span>
          </div>
          <div className="text-3xl font-bold text-white">{stats?.users.active || 0}</div>
          <div className="text-sm text-gray-400 mt-1">Usuarios activos</div>
        </div>

        <div className="bg-gradient-to-br from-red-500/10 to-red-600/10 border border-red-500/20 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <Ban className="text-red-400" size={24} />
            <span className="text-xs text-gray-400">Baneados</span>
          </div>
          <div className="text-3xl font-bold text-white">{stats?.users.banned || 0}</div>
          <div className="text-sm text-gray-400 mt-1">Usuarios baneados</div>
        </div>

        <div className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 border border-yellow-500/20 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <AlertTriangle className="text-yellow-400" size={24} />
            <span className="text-xs text-gray-400">Reportes</span>
          </div>
          <div className="text-3xl font-bold text-white">{stats?.reports.pending || 0}</div>
          <div className="text-sm text-gray-400 mt-1">Reportes pendientes</div>
        </div>
      </div>

      {/* Content Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#1a1f2e] border border-yellow-500/20 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-3">
            <MessageSquare className="text-yellow-400" size={20} />
            <h3 className="font-semibold text-white">Publicaciones</h3>
          </div>
          <div className="text-2xl font-bold text-white">{stats?.content.posts || 0}</div>
          <div className="text-xs text-green-400 mt-2">+{stats?.content.postsToday || 0} hoy</div>
        </div>

        <div className="bg-[#1a1f2e] border border-yellow-500/20 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-3">
            <ShoppingCart className="text-yellow-400" size={20} />
            <h3 className="font-semibold text-white">Artículos en venta</h3>
          </div>
          <div className="text-2xl font-bold text-white">{stats?.content.listings || 0}</div>
        </div>

        <div className="bg-[#1a1f2e] border border-yellow-500/20 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-3">
            <TrendingUp className="text-yellow-400" size={20} />
            <h3 className="font-semibold text-white">Actividad</h3>
          </div>
          <div className="text-2xl font-bold text-green-400">Alta</div>
        </div>
      </div>
    </div>
  );

  const renderUsers = () => (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-[#1a1f2e] border border-yellow-500/20 rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Buscar</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Usuario, email..."
                className="w-full bg-[#0f1419] border border-yellow-500/20 rounded-lg pl-10 pr-3 py-2 text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Rol</label>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="w-full bg-[#0f1419] border border-yellow-500/20 rounded-lg px-3 py-2 text-white"
            >
              <option value="">Todos</option>
              <option value="user">Usuario</option>
              <option value="moderator">Moderador</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Estado</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full bg-[#0f1419] border border-yellow-500/20 rounded-lg px-3 py-2 text-white"
            >
              <option value="">Todos</option>
              <option value="true">Activos</option>
              <option value="false">Baneados</option>
            </select>
          </div>
        </div>

        <button
          onClick={loadUsers}
          className="mt-4 w-full bg-yellow-500 hover:bg-yellow-600 text-black font-semibold py-2 rounded-lg transition-colors"
        >
          Aplicar Filtros
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-[#1a1f2e] border border-yellow-500/20 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#0f1419] border-b border-yellow-500/20">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Usuario</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Email</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Rol</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Estado</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Registro</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-yellow-500/10">
              {users.map((user) => (
                <tr key={user._id} className="hover:bg-yellow-500/5">
                  <td className="px-4 py-3">
                    <div className="font-medium text-white">{user.username}</div>
                    {user.warnings && user.warnings.length > 0 && (
                      <div className="text-xs text-yellow-400">⚠️ {user.warnings.length} advertencias</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-400">{user.email}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      user.role === 'admin' ? 'bg-red-500/20 text-red-400' :
                      user.role === 'moderator' ? 'bg-blue-500/20 text-blue-400' :
                      'bg-gray-500/20 text-gray-400'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {user.isActive ? (
                      <span className="flex items-center gap-1 text-green-400 text-sm">
                        <CheckCircle size={14} /> Activo
                      </span>
                    ) : (
                      <div>
                        <span className="flex items-center gap-1 text-red-400 text-sm">
                          <XCircle size={14} /> Baneado
                        </span>
                        {user.banReason && (
                          <div className="text-xs text-gray-500 mt-1">{user.banReason}</div>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-400">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setShowWarnModal(true);
                        }}
                        className="p-2 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/20 rounded-lg transition-colors"
                        title="Advertir"
                      >
                        <AlertTriangle size={16} className="text-yellow-400" />
                      </button>

                      {user.isActive ? (
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setShowBanModal(true);
                          }}
                          className="p-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg transition-colors"
                          title="Banear"
                        >
                          <Ban size={16} className="text-red-400" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleUnbanUser(user._id)}
                          className="p-2 bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 rounded-lg transition-colors"
                          title="Desbanear"
                        >
                          <CheckCircle size={16} className="text-green-400" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderContent = () => (
    <div className="space-y-4">
      {/* Toggle between Posts and Listings */}
      <div className="flex gap-2">
        <button
          onClick={() => { setContentType('posts'); loadContent(); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            contentType === 'posts'
              ? 'bg-yellow-500 text-black'
              : 'bg-[#1a1f2e] text-gray-400 hover:text-white border border-yellow-500/20'
          }`}
        >
          <MessageSquare size={18} />
          Publicaciones
        </button>
        <button
          onClick={() => { setContentType('listings'); loadContent(); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            contentType === 'listings'
              ? 'bg-yellow-500 text-black'
              : 'bg-[#1a1f2e] text-gray-400 hover:text-white border border-yellow-500/20'
          }`}
        >
          <ShoppingCart size={18} />
          Artículos de Venta
        </button>
      </div>

      {/* Content Table */}
      <div className="bg-[#1a1f2e] border border-yellow-500/20 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#0f1419] border-b border-yellow-500/20">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">
                  {contentType === 'posts' ? 'Título' : 'Artículo'}
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Usuario</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">
                  {contentType === 'posts' ? 'Categoría' : 'Descripción'}
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Fecha</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-yellow-500/10">
              {contentType === 'posts' ? (
                posts.filter(p => !p.deleted).map((post) => (
                  <tr key={post._id} className="hover:bg-yellow-500/5">
                    <td className="px-4 py-3">
                      <div className="font-medium text-white">{post.title}</div>
                      <div className="text-xs text-gray-500 mt-1 line-clamp-1">{post.content}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400">{post.username}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 rounded text-xs font-semibold bg-blue-500/20 text-blue-400">
                        {post.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400">
                      {new Date(post.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleDeletePost(post._id)}
                        className="p-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg transition-colors"
                        title="Eliminar publicación"
                      >
                        <Trash2 size={16} className="text-red-400" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                listings.filter(l => !l.deleted).map((listing) => (
                  <tr key={listing._id} className="hover:bg-yellow-500/5">
                    <td className="px-4 py-3">
                      <div className="font-medium text-white">{listing.itemName}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        Ofrece: {listing.itemsOffered?.join(', ')}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400">{listing.username}</td>
                    <td className="px-4 py-3 text-sm text-gray-400 max-w-xs truncate">
                      {listing.description}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400">
                      {new Date(listing.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleDeleteListing(listing._id)}
                        className="p-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg transition-colors"
                        title="Eliminar artículo"
                      >
                        <Trash2 size={16} className="text-red-400" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {contentType === 'posts' && posts.filter(p => !p.deleted).length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No hay publicaciones para mostrar
          </div>
        )}

        {contentType === 'listings' && listings.filter(l => !l.deleted).length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No hay artículos de venta para mostrar
          </div>
        )}
      </div>
    </div>
  );

  const renderActivity = () => (
    <div className="space-y-4">
      <div className="bg-[#1a1f2e] border border-yellow-500/20 rounded-lg p-4">
        <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
          <Activity className="text-yellow-400" size={20} />
          Actividad Reciente de Moderación
        </h3>

        <div className="space-y-3">
          {auditLogs.map((log) => (
            <div key={log._id} className="bg-[#0f1419] border border-yellow-500/10 rounded-lg p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-yellow-400">
                      {log.action.replace(/_/g, ' ').toUpperCase()}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <div className="text-sm text-gray-400">
                    Admin ID: {log.adminId}
                  </div>
                  {log.details && Object.keys(log.details).length > 0 && (
                    <div className="text-xs text-gray-500 mt-2">
                      {JSON.stringify(log.details, null, 2)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="text-red-500" size={32} />
          <h1 className="text-3xl font-bold text-white">Panel de Administración</h1>
        </div>
        <p className="text-gray-400">Gestiona usuarios, contenido y reportes</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {[
          { id: 'overview', label: 'Vista General', icon: TrendingUp },
          { id: 'users', label: 'Usuarios', icon: Users },
          { id: 'content', label: 'Contenido', icon: FileText },
          { id: 'reports', label: 'Reportes', icon: AlertTriangle },
          { id: 'activity', label: 'Actividad', icon: Activity }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-yellow-500 text-black'
                : 'bg-[#1a1f2e] text-gray-400 hover:text-white border border-yellow-500/20'
            }`}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-12 h-12 border-4 border-yellow-500/30 border-t-yellow-500 rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'users' && renderUsers()}
          {activeTab === 'content' && renderContent()}
          {activeTab === 'activity' && renderActivity()}
        </>
      )}

      {/* Ban Modal */}
      {showBanModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1f2e] border border-red-500/20 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Ban className="text-red-400" />
              Banear Usuario: {selectedUser?.username}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Razón del baneo</label>
                <textarea
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  className="w-full bg-[#0f1419] border border-yellow-500/20 rounded-lg px-3 py-2 text-white"
                  rows={3}
                  placeholder="Describe la razón del baneo..."
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Duración (días)</label>
                <input
                  type="number"
                  value={banDuration}
                  onChange={(e) => setBanDuration(e.target.value)}
                  className="w-full bg-[#0f1419] border border-yellow-500/20 rounded-lg px-3 py-2 text-white"
                  placeholder="Dejar vacío para baneo permanente"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleBanUser}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-2 rounded-lg transition-colors"
                >
                  Confirmar Baneo
                </button>
                <button
                  onClick={() => {
                    setShowBanModal(false);
                    setBanReason('');
                    setBanDuration('');
                  }}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Warn Modal */}
      {showWarnModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1f2e] border border-yellow-500/20 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <AlertTriangle className="text-yellow-400" />
              Advertir Usuario: {selectedUser?.username}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Razón de la advertencia</label>
                <textarea
                  value={warnReason}
                  onChange={(e) => setWarnReason(e.target.value)}
                  className="w-full bg-[#0f1419] border border-yellow-500/20 rounded-lg px-3 py-2 text-white"
                  rows={3}
                  placeholder="Describe la razón de la advertencia..."
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleWarnUser}
                  className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold py-2 rounded-lg transition-colors"
                >
                  Enviar Advertencia
                </button>
                <button
                  onClick={() => {
                    setShowWarnModal(false);
                    setWarnReason('');
                  }}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
