import { useState, useEffect } from 'react';
import {
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Send,
  Plus,
  Clock,
  Eye,
  Search,
  X,
  Tag,
  Pin,
  Lock,
  Trash2,
} from 'lucide-react';
import api from '../services/api';

interface Post {
  _id: string;
  title: string;
  content: string;
  category: string;
  author_name: string;
  author_id: string;
  author_avatar?: string;
  tags: string[];
  upvotes: number;
  downvotes: number;
  comment_count: number;
  views: number;
  pinned: boolean;
  locked: boolean;
  created_at: string;
  updated_at: string;
}

interface Comment {
  _id: string;
  post_id: string;
  content: string;
  author_name: string;
  upvotes: number;
  downvotes: number;
  parent_comment_id: string | null;
  replies?: Comment[];
  created_at: string;
}

const CATEGORIES = [
  { id: 'all', label: 'All Posts', color: 'cyan', icon: '📱' },
  { id: 'news', label: 'News & Updates', color: 'blue', icon: '📰' },
  { id: 'discussion', label: 'Discussion', color: 'purple', icon: '💬' },
  { id: 'bug_report', label: 'Bug Reports', color: 'red', icon: '🐛' },
  { id: 'build_guide', label: 'Build Guides', color: 'green', icon: '📖' },
  { id: 'update', label: 'Game Updates', color: 'yellow', icon: '🔄' },
];

interface CommunityHubProps {
  initialPostId?: string | null;
  onPostClose?: () => void;
}

export default function CommunityHub({ initialPostId, onPostClose }: CommunityHubProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewPostModal, setShowNewPostModal] = useState(false);
  const [newComment, setNewComment] = useState('');

  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostCategory, setNewPostCategory] = useState('discussion');
  const [newPostTags, setNewPostTags] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    // Obtener usuario actual
    const user = localStorage.getItem('user');
    if (user) {
      const parsedUser = JSON.parse(user);
      setCurrentUserId(parsedUser.userId);
    }
    loadPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory, sortBy]);

  // Efecto para abrir post automáticamente desde Activity Feed
  useEffect(() => {
    if (initialPostId && posts.length > 0) {
      const post = posts.find(p => p._id === initialPostId);
      if (post) {
        handlePostClick(post);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPostId, posts]);

  const loadPosts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        category: selectedCategory === 'all' ? '' : selectedCategory,
        sort: sortBy,
        ...(searchQuery && { search: searchQuery }),
      });

      const data = await api.get(`/community/posts?${params}`);
      setPosts(data.posts || []);
    } catch (error) {
      console.error('Error loading posts:', error);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const loadComments = async (postId: string) => {
    try {
      const data = await api.get(`/community/posts/${postId}/comments`);
      setComments(data);
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  };

  const handlePostClick = async (post: Post) => {
    setSelectedPost(post);
    await loadComments(post._id);
  };

  const createPost = async () => {
    try {
      await api.post('/community/posts', {
        title: newPostTitle,
        content: newPostContent,
        category: newPostCategory,
        tags: newPostTags.split(',').map(t => t.trim()).filter(Boolean),
      });

      // Incrementar posts_shared en el perfil del raider
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (user.userId) {
        try {
          const statsResponse = await api.get(`/api/raider-profiles/${user.userId}/statistics`);
          if (statsResponse.stats) {
            await api.put(`/api/raider-profiles/${user.userId}/stats`, {
              posts_shared: statsResponse.stats.posts_shared + 1
            });
          }
        } catch (err) {
          // Si no existe perfil, ignorar el error
          console.log('Raider profile not found, skipping stats update');
        }
      }

      setShowNewPostModal(false);
      setNewPostTitle('');
      setNewPostContent('');
      setNewPostTags('');
      loadPosts();
    } catch (error) {
      console.error('Error creating post:', error);
    }
  };

  const closePostModal = () => {
    setSelectedPost(null);
    if (onPostClose) {
      onPostClose();
    }
  };

  const deletePost = async (postId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este post?')) return;
    
    try {
      await api.delete(`/community/posts/${postId}`);
      closePostModal();
      loadPosts();
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  const votePost = async (postId: string, voteType: 'up' | 'down') => {
    try {
      await api.post(`/community/posts/${postId}/vote`, { vote: voteType });
      loadPosts();
      if (selectedPost && selectedPost._id === postId) {
        const updatedPost = posts.find(p => p._id === postId);
        if (updatedPost) setSelectedPost(updatedPost);
      }
    } catch (error) {
      console.error('Error voting:', error);
    }
  };

  const addComment = async () => {
    if (!selectedPost || !newComment.trim()) return;

    try {
      await api.post(`/community/posts/${selectedPost._id}/comments`, {
        content: newComment,
        author_name: 'Anonymous',
      });

      setNewComment('');
      loadComments(selectedPost._id);
      loadPosts();
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const voteComment = async (commentId: string, voteType: 'up' | 'down') => {
    try {
      await api.post(`/community/comments/${commentId}/vote`, { vote: voteType });
      if (selectedPost) {
        loadComments(selectedPost._id);
      }
    } catch (error) {
      console.error('Error voting comment:', error);
    }
  };

  const getCategoryInfo = (categoryId: string) => {
    return CATEGORIES.find(c => c.id === categoryId) || CATEGORIES[0];
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-red-500/30 border-t-red-500 rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-400">Loading community posts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-red-500 via-yellow-400 to-green-500 bg-clip-text text-transparent">
            Community Hub
          </h1>
          <p className="text-gray-400 mt-1">
            Discuss, share builds, and stay updated with the community
          </p>
        </div>

        <button
          onClick={() => setShowNewPostModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg hover:from-green-600 hover:to-blue-600 transition-colors"
        >
          <Plus size={20} />
          New Post
        </button>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
          <input
            type="text"
            placeholder="Search posts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadPosts()}
            className="w-full pl-10 pr-4 py-2 bg-[#1a1f2e] border border-yellow-500/20 rounded-lg text-sm focus:outline-none focus:border-yellow-500/50"
          />
        </div>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-4 py-2 bg-[#1a1f2e] border border-green-500/20 rounded-lg text-sm focus:outline-none focus:border-green-500/50"
        >
          <option value="recent">Recent</option>
          <option value="popular">Popular</option>
          <option value="trending">Trending</option>
        </select>
      </div>

      {/* Categories */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`px-4 py-2 rounded-lg border transition-colors ${
              selectedCategory === category.id
                ? 'bg-blue-500/20 border-blue-500/50 text-blue-400'
                : 'bg-[#1a1f2e]/50 border-gray-700/30 text-gray-400 hover:border-blue-500/30'
            }`}
          >
            <span className="mr-2">{category.icon}</span>
            {category.label}
          </button>
        ))}
      </div>

      {/* Posts List */}
      <div className="grid grid-cols-1 gap-4">
        {posts.length === 0 ? (
          <div className="text-center py-12 bg-[#1a1f2e]/50 border border-gray-700/30 rounded-lg">
            <MessageSquare className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No posts yet. Be the first to post!</p>
          </div>
        ) : (
          posts.map((post) => {
            const categoryInfo = getCategoryInfo(post.category);
            return (
              <div
                key={post._id}
                onClick={() => {
                  setSelectedPost(post);
                  loadComments(post._id);
                }}
                className="bg-gradient-to-br from-[#1a1f2e] to-[#0a0e1a] border border-red-500/20 rounded-lg p-4 sm:p-6 hover:border-yellow-500/50 transition-all cursor-pointer overflow-hidden"
              >
                <div className="flex items-start gap-2 sm:gap-4">
                  {/* Vote Section */}
                  <div className="flex flex-col items-center gap-1 min-w-[50px] sm:min-w-[60px]">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        votePost(post._id, 'up');
                      }}
                      className="p-2 hover:bg-green-500/10 rounded-lg transition-colors"
                    >
                      <ThumbsUp className="text-gray-400 hover:text-green-400" size={20} />
                    </button>
                    <span className="text-lg font-bold text-yellow-400">
                      {post.upvotes - post.downvotes}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        votePost(post._id, 'down');
                      }}
                      className="p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      <ThumbsDown className="text-gray-400 hover:text-red-400" size={20} />
                    </button>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      {post.pinned && <Pin className="text-yellow-400" size={16} />}
                      {post.locked && <Lock className="text-red-400" size={16} />}
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30">
                        {categoryInfo.icon} {categoryInfo.label}
                      </span>
                    </div>

                    <h3 className="text-base sm:text-xl font-bold text-white mb-2 hover:text-yellow-400 transition-colors break-words">
                      {post.title}
                    </h3>

                    <p className="text-gray-400 text-xs sm:text-sm mb-4 line-clamp-2 break-words">{post.content}</p>

                    {(post.tags && post.tags.length > 0) && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {(post.tags || []).map((tag, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-gray-700/30 rounded text-xs text-gray-400"
                          >
                            <Tag size={12} className="inline mr-1" />
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <MessageSquare size={16} />
                        {post.comment_count} comments
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye size={16} />
                        {post.views} views
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={16} />
                        {formatDate(post.created_at)}
                      </span>
                      <div className="ml-auto flex items-center gap-3">
                        {post.author_avatar && (
                          <img 
                            src={post.author_avatar.startsWith('http') ? post.author_avatar : `${import.meta.env.VITE_API_URL || 'http://localhost:10000/api'}/../..E_API_URL || 'http://localhost:10000/api'}/../..${post.author_avatar}`}
                            alt={post.author_name}
                            className="w-6 h-6 rounded-full border border-green-500/30"
                            onError={(e) => e.currentTarget.style.display = 'none'}
                          />
                        )}
                        <span className="text-green-400">by {post.author_name}</span>
                        {currentUserId === post.author_id && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deletePost(post._id);
                            }}
                            className="p-1.5 hover:bg-red-500/10 rounded-lg transition-colors"
                            title="Eliminar post"
                          >
                            <Trash2 className="text-gray-400 hover:text-red-400" size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* New Post Modal */}
      {showNewPostModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1f2e] rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-yellow-500/30">
            <div className="flex items-center justify-between p-6 border-b border-yellow-500/20">
              <h2 className="text-2xl font-bold text-yellow-400">Create New Post</h2>
              <button
                onClick={() => setShowNewPostModal(false)}
                className="p-2 hover:bg-cyan-500/10 rounded-lg transition-colors"
              >
                <X className="text-gray-400" size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Title</label>
                <input
                  type="text"
                  value={newPostTitle}
                  onChange={(e) => setNewPostTitle(e.target.value)}
                  placeholder="Enter post title..."
                  className="w-full px-4 py-2 bg-[#0a0e1a] border border-gray-700/30 rounded-lg text-white focus:outline-none focus:border-cyan-500/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
                <select
                  value={newPostCategory}
                  onChange={(e) => setNewPostCategory(e.target.value)}
                  className="w-full px-4 py-2 bg-[#0a0e1a] border border-gray-700/30 rounded-lg text-white focus:outline-none focus:border-cyan-500/50"
                >
                  {CATEGORIES.filter(c => c.id !== 'all').map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.icon} {category.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Content</label>
                <textarea
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  placeholder="Write your post content..."
                  rows={8}
                  className="w-full px-4 py-2 bg-[#0a0e1a] border border-gray-700/30 rounded-lg text-white focus:outline-none focus:border-cyan-500/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={newPostTags}
                  onChange={(e) => setNewPostTags(e.target.value)}
                  placeholder="weapons, builds, pvp..."
                  className="w-full px-4 py-2 bg-[#0a0e1a] border border-gray-700/30 rounded-lg text-white focus:outline-none focus:border-cyan-500/50"
                />
              </div>

              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                <p className="text-sm text-blue-400">
                  Tu publicación se creará con tu nombre de usuario y avatar actual.
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowNewPostModal(false)}
                  className="flex-1 px-6 py-3 bg-gray-700/30 text-gray-300 rounded-lg hover:bg-gray-700/50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={createPost}
                  disabled={!newPostTitle || !newPostContent}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg hover:from-cyan-600 hover:to-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Post
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Post Detail Modal */}
      {selectedPost && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1f2e] rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-cyan-500/30">
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-cyan-500/20 gap-2">
              <h2 className="text-lg sm:text-2xl font-bold text-white break-words flex-1 min-w-0">{selectedPost.title}</h2>
              <div className="flex items-center gap-2">
                {currentUserId === selectedPost.author_id && (
                  <button
                    onClick={() => deletePost(selectedPost._id)}
                    className="p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                    title="Eliminar post"
                  >
                    <Trash2 className="text-gray-400 hover:text-red-400" size={20} />
                  </button>
                )}
                <button
                  onClick={closePostModal}
                  className="p-2 hover:bg-cyan-500/10 rounded-lg transition-colors"
                >
                  <X className="text-gray-400" size={24} />
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
              <div className="bg-[#0a0e1a] rounded-lg p-3 sm:p-4">
                <p className="text-sm sm:text-base text-gray-300 whitespace-pre-wrap break-words">{selectedPost.content}</p>
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-4 text-xs sm:text-sm">
                  {selectedPost.author_avatar && (
                    <img 
                      src={selectedPost.author_avatar.startsWith('http') ? selectedPost.author_avatar : `${import.meta.env.VITE_API_URL || 'http://localhost:10000/api'}/../..${selectedPost.author_avatar}`}
                      alt={selectedPost.author_name}
                      className="w-8 h-8 rounded-full border-2 border-cyan-500/50"
                      onError={(e) => e.currentTarget.style.display = 'none'}
                    />
                  )}
                  <span className="text-cyan-400 font-medium">{selectedPost.author_name}</span>
                  <span className="text-gray-500">{formatDate(selectedPost.created_at)}</span>
                </div>
              </div>

              {/* Comments */}
              <div className="space-y-3 sm:space-y-4">
                <h3 className="text-base sm:text-lg font-bold text-white">
                  Comments ({comments.length})
                </h3>

                {/* Add Comment */}
                <div className="flex gap-2 sm:gap-3">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Write a comment..."
                    className="flex-1 px-4 py-2 bg-[#0a0e1a] border border-gray-700/30 rounded-lg text-white focus:outline-none focus:border-cyan-500/50"
                    onKeyDown={(e) => e.key === 'Enter' && addComment()}
                  />
                  <button
                    onClick={addComment}
                    disabled={!newComment.trim()}
                    className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg hover:from-cyan-600 hover:to-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send size={20} />
                  </button>
                </div>

                {/* Comments List */}
                {comments.map((comment) => (
                  <div
                    key={comment._id}
                    className="bg-[#0a0e1a] rounded-lg p-3 sm:p-4 border border-gray-700/30"
                  >
                    <p className="text-sm sm:text-base text-gray-300 mb-3 break-words">{comment.content}</p>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                      <span className="text-sm text-cyan-400">{comment.author_name}</span>
                      <span className="text-sm text-gray-500">{formatDate(comment.created_at)}</span>
                      <div className="ml-auto flex items-center gap-2">
                        <button
                          onClick={() => voteComment(comment._id, 'up')}
                          className="flex items-center gap-1 text-gray-400 hover:text-green-400"
                        >
                          <ThumbsUp size={16} />
                          <span className="text-sm">{comment.upvotes}</span>
                        </button>
                        <button
                          onClick={() => voteComment(comment._id, 'down')}
                          className="flex items-center gap-1 text-gray-400 hover:text-red-400"
                        >
                          <ThumbsDown size={16} />
                          <span className="text-sm">{comment.downvotes}</span>
                        </button>
                      </div>
                    </div>

                    {/* Replies */}
                    {comment.replies && comment.replies.length > 0 && (
                      <div className="ml-8 mt-3 space-y-2">
                        {comment.replies.map((reply) => (
                          <div
                            key={reply._id}
                            className="bg-[#1a1f2e] rounded-lg p-3 border border-gray-700/20"
                          >
                            <p className="text-gray-300 text-sm mb-2">{reply.content}</p>
                            <span className="text-xs text-cyan-400">{reply.author_name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
