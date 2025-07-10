import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Swal from 'sweetalert2';
import { EditBlogDialog } from '@/components/EditBlogDialog';
import { BlogData, UserBlog } from '@/types/blog';
import { RescueTeamList } from '@/components/RescueTeamList';
import CommunityChat from '@/components/community-chat';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const AdminPanel = () => {
  const { user } = useAuth();
  const [blogs, setBlogs] = useState<UserBlog[]>([]);
  const [editingBlog, setEditingBlog] = useState<UserBlog | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [blogData, setBlogData] = useState<BlogData>({
    image: '',
    severity: '',
    title: '',
    date: new Date().toISOString().split('T')[0],
    keywords: '',
    content: '',
    donationTarget: '',
    location: ''
  });

  useEffect(() => {
    const fetchAllBlogs = async () => {
      try {
        const response = await fetch('http://localhost:8080/api/blogs');

        if (!response.ok) {
          throw new Error('Failed to fetch blogs');
        }

        const data = await response.json();

        if (data.success) {
          setBlogs(data.data);
        } else {
          console.error('Error fetching blogs:', data.error);
        }
      } catch (error) {
        console.error('Error fetching blogs:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to load blogs. Please try again later.',
          confirmButtonColor: '#3B82F6'
        });
      }
    };

    fetchAllBlogs();
  }, []);

  const handleDelete = async (blogId: string) => {
    try {
      const result = await Swal.fire({
        title: 'Are you sure?',
        text: "You won't be able to revert this!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3B82F6',
        cancelButtonColor: '#EF4444',
        confirmButtonText: 'Yes, delete it!'
      });

      if (result.isConfirmed) {
        const response = await fetch(`http://localhost:8080/api/blogs/${blogId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            // Add authorization header if needed
            // 'Authorization': `Bearer ${token}`
          }
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to delete blog');
        }

        setBlogs((prev: UserBlog[]) => prev.filter(blog => blog._id !== blogId));
        Swal.fire('Deleted!', 'Your blog has been deleted.', 'success');
      }
    } catch (error) {
      console.error('Delete error:', error);
      Swal.fire('Error', error instanceof Error ? error.message : 'Failed to delete blog', 'error');
    }
  };

  const handleEdit = async (blog: UserBlog) => {
    // Set initial data for the edit form
    setEditingBlog(blog);
    setBlogData({
      id: blog._id,
      title: blog.title,
      content: blog.content,
      severity: blog.severity,
      location: blog.location,
      image: blog.image,
      date: new Date(blog.createdAt).toISOString().split('T')[0],
      keywords: blog.keywords || '', // Add if exists in your model
      donationTarget: blog.donationTarget?.toString() || '' // Add if exists in your model
    });
    setIsEditDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      const formData = new FormData();

      if (blogData.imageFile) {
        formData.append('image', blogData.imageFile);  // Use the actual File object
      } else if (!editingBlog) {
        throw new Error('Please select an image');
      }

      // Append all other fields except imageFile
      Object.keys(blogData).forEach((key) => {
        if (key !== 'imageFile' && blogData[key] !== undefined) {
          formData.append(key, blogData[key] as string);
        }
      });

      // Add author name
      formData.append('authorName', userData.name);

      const url = editingBlog
        ? `http://localhost:8080/api/blogs/${editingBlog._id}`
        : 'http://localhost:8080/api/blogs';

      const method = editingBlog ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        body: formData,
        // Don't set Content-Type header - let browser set it with boundary
      });

      if (!response.ok) {
        throw new Error(`Failed to ${editingBlog ? 'update' : 'create'} blog`);
      }

      const data = await response.json();

      // Update local state based on operation type
      if (editingBlog) {
        setBlogs((prev) =>
          prev.map((blog) =>
            blog._id === editingBlog._id ? data.data : blog
          )
        );
        setEditingBlog(null);
        setIsEditDialogOpen(false);
      } else {
        setBlogs((prev) => [data.data, ...prev]);
      }

      // Show success message
      await Swal.fire({
        icon: 'success',
        title: `Blog ${editingBlog ? 'Updated' : 'Posted'} Successfully!`,
        text: `Your blog has been ${editingBlog ? 'updated' : 'published'}.`,
        confirmButtonColor: '#3B82F6'
      });

      // Reset form
      resetForm();

    } catch (error) {
      console.error('Error:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error instanceof Error ? error.message : 'Failed to process blog post. Please try again.',
        confirmButtonColor: '#3B82F6'
      });
    }
  };

  // Add a helper function to reset the form
  const resetForm = () => {
    setBlogData({
      image: '',
      severity: '',
      title: '',
      date: new Date().toISOString().split('T')[0],
      keywords: '',
      content: '',
      donationTarget: '',
      location: ''
    });

    // Reset file input
    const fileInput = document.getElementById('image') as HTMLInputElement;
    if (fileInput) fileInput.value = '';

    // Reset all form fields
    const formFields = [
      'title',
      'keywords',
      'content',
      'donationTarget'
    ];

    formFields.forEach(field => {
      const element = document.getElementById(field) as HTMLInputElement | HTMLTextAreaElement;
      if (element) element.value = '';
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setBlogData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (field: string, value: string) => {
    setBlogData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      {/* Admin Banner */}
      <div className="bg-gradient-to-r from-red-600 via-pink-500 to-orange-500 transition-all duration-500 shadow-lg text-white py-12 mb-8">
        <div className="container mx-auto px-4 py-12 text-white">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Admin Dashboard
          </h1>
          <p className="text-lg opacity-90">
            Manage disaster response and communicate with rescue teams
          </p>
        </div>
      </div>

      {/* User Info Card */}
      <div className="container mx-auto px-4">
        <Card className="mb-8 rounded-2xl shadow-xl border border-gray-200 bg-gradient-to-br from-white via-gray-50 to-gray-100">
          <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white p-6 rounded-t-2xl">
            <h2 className="text-2xl font-bold tracking-wide">👤 Profile Information</h2>
          </CardHeader>
          <CardContent className="p-6">
            <p className="text-lg text-gray-700 mb-2">
              <span className="font-medium text-gray-900">Name:</span> {user?.name}
            </p>
            <p className="text-lg text-gray-700">
              <span className="font-medium text-gray-900">Email:</span> {user?.email}
            </p>
          </CardContent>
        </Card>

        {/* Admin Communication and Management Tabs */}
        <Tabs defaultValue="chat" className="mb-8">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="chat">Communication Hub</TabsTrigger>
            <TabsTrigger value="blogs">Manage Blogs</TabsTrigger>
            <TabsTrigger value="create">Create Blog</TabsTrigger>
          </TabsList>
          
          {/* Communication Tab */}
          <TabsContent value="chat">
            <Card className="rounded-2xl shadow-xl border border-gray-200 bg-white overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-red-600 to-orange-500 text-white p-6 rounded-t-2xl">
                <h2 className="text-2xl font-bold tracking-wide">💬 Command & Communication Hub</h2>
                <p className="text-sm opacity-90 mt-1">
                  Send announcements, coordinate with rescue teams, and manage disaster response
                </p>
              </CardHeader>
              <CardContent className="p-6">
                <div className="mb-4 bg-orange-50 p-4 rounded-lg border border-orange-200">
                  <h3 className="font-bold text-orange-800 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    Admin Communication Tips
                  </h3>
                  <ul className="list-disc list-inside mt-2 text-sm text-orange-700 space-y-1">
                    <li>Use <strong>Announcement Mode</strong> for critical updates visible to all users</li>
                    <li>Mention rescue teams with <strong>@</strong> to ensure they see your message</li>
                    <li>Your messages are highlighted in red to indicate admin authority</li>
                    <li>All communications are logged and stored for reference</li>
                  </ul>
                </div>
                <CommunityChat />
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Blogs Management Tab */}
          <TabsContent value="blogs">
            <Card className="rounded-2xl shadow-xl border border-gray-200 bg-gradient-to-br from-white via-gray-50 to-gray-100">
              <CardHeader className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white p-6 rounded-t-2xl">
                <h2 className="text-2xl font-bold tracking-wide">📝 All Blogs</h2>
                <p className="text-sm text-white/90 mt-1">Manage all published blogs</p>
              </CardHeader>
              <CardContent className="p-6">
                {blogs.length === 0 ? (
                  <p className="text-gray-500 text-center py-4 italic">No blogs have been published yet.</p>
                ) : (
                  <div className="space-y-4">
                    {blogs.map((blog) => (
                      <div
                        key={blog._id}
                        className="border border-gray-200 rounded-xl p-4 bg-white shadow-sm hover:shadow-md transition-shadow duration-300 flex justify-between items-start"
                      >
                        <div>
                          <h3 className="font-semibold text-lg text-gray-800">{blog.title}</h3>
                          <p className="text-sm text-gray-600">
                            📍 Location: {blog.location} &nbsp;|&nbsp; ⚠️ Severity: {blog.severity}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            👤 Author: {blog.authorName} &nbsp;|&nbsp;
                            🗓️ Posted on: {new Date(blog.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="hover:bg-indigo-100 transition-colors"
                            onClick={() => handleEdit(blog)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(blog._id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Create Blog Tab */}
          <TabsContent value="create">
            <Card className="rounded-2xl shadow-xl border border-gray-200 bg-gradient-to-b from-white via-gray-50 to-gray-100">
              <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-500 text-white p-6 rounded-t-2xl">
                <h2 className="text-2xl font-bold">📣 Create a Blog Post</h2>
                <p className="text-sm mt-1 text-white/90">Share details about a disaster needing urgent attention</p>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="title" className="text-sm font-medium text-gray-700">
                        Blog Title
                      </Label>
                      <Input
                        id="title"
                        name="title"
                        value={blogData.title}
                        onChange={handleInputChange}
                        className="mt-1 w-full bg-white"
                        placeholder="Enter a descriptive title"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="location" className="text-sm font-medium text-gray-700">
                        Location
                      </Label>
                      <Input
                        id="location"
                        name="location"
                        value={blogData.location}
                        onChange={handleInputChange}
                        className="mt-1 w-full bg-white"
                        placeholder="City, Province"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="date" className="text-sm font-medium text-gray-700">
                        Date
                      </Label>
                      <Input
                        id="date"
                        name="date"
                        type="date"
                        value={blogData.date}
                        onChange={handleInputChange}
                        className="mt-1 w-full bg-white"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="severity" className="text-sm font-medium text-gray-700">
                        Severity Level
                      </Label>
                      <Select
                        name="severity"
                        value={blogData.severity}
                        onValueChange={(value) => handleSelectChange("severity", value)}
                      >
                        <SelectTrigger className="w-full mt-1 bg-white">
                          <SelectValue placeholder="Select severity level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Low">Low</SelectItem>
                          <SelectItem value="Medium">Medium</SelectItem>
                          <SelectItem value="High">High</SelectItem>
                          <SelectItem value="Critical">Critical</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="image" className="text-sm font-medium text-gray-700">
                      Image URL
                    </Label>
                    <Input
                      id="image"
                      name="image"
                      value={blogData.image}
                      onChange={handleInputChange}
                      className="mt-1 w-full bg-white"
                      placeholder="Enter image URL"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="keywords" className="text-sm font-medium text-gray-700">
                      Keywords
                    </Label>
                    <Input
                      id="keywords"
                      name="keywords"
                      value={blogData.keywords}
                      onChange={handleInputChange}
                      className="mt-1 w-full bg-white"
                      placeholder="Comma separated keywords (flood, earthquake, etc.)"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="donationTarget" className="text-sm font-medium text-gray-700">
                      Donation Target (PKR)
                    </Label>
                    <Input
                      id="donationTarget"
                      name="donationTarget"
                      value={blogData.donationTarget}
                      onChange={handleInputChange}
                      className="mt-1 w-full bg-white"
                      placeholder="Enter donation target amount"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="content" className="text-sm font-medium text-gray-700">
                      Blog Content
                    </Label>
                    <Textarea
                      id="content"
                      name="content"
                      value={blogData.content}
                      onChange={handleInputChange}
                      className="mt-1 h-40 w-full bg-white"
                      placeholder="Describe the disaster situation, needs, and how people can help..."
                      required
                    />
                  </div>

                  <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
                    Publish Blog
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Rescue Teams Section - Keep this outside tabs for visibility */}
        <Card className="mb-8 rounded-2xl shadow-xl border border-gray-200 bg-gradient-to-br from-white via-gray-50 to-gray-100">
          <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-6 rounded-t-2xl">
            <h2 className="text-2xl font-bold tracking-wide">🚑 Rescue Teams</h2>
            <p className="text-sm text-white/90 mt-1">View and manage all registered rescue teams</p>
          </CardHeader>
          <CardContent className="p-6">
            <RescueTeamList blogs={blogs} setBlogs={setBlogs} />
          </CardContent>
        </Card>
      </div>

      {/* Edit Blog Dialog */}
      {isEditDialogOpen && editingBlog && (
        <EditBlogDialog
          blog={editingBlog}
          isOpen={isEditDialogOpen}
          onClose={() => setIsEditDialogOpen(false)}
          onUpdate={handleSubmit}
        />
      )}
    </div>
  );
};

export default AdminPanel;