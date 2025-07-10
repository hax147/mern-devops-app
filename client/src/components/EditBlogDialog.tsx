import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BlogData, UserBlog } from "@/types/blog";
import { useState } from 'react';

interface EditBlogDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onUpdate: (e: React.FormEvent) => Promise<void>;
    blog: UserBlog;
}

export function EditBlogDialog({
    isOpen,
    onClose,
    onUpdate,
    blog
}: EditBlogDialogProps) {
    const [blogData, setBlogData] = useState<BlogData>({
        id: blog._id,
        title: blog.title,
        content: blog.content,
        severity: blog.severity,
        location: blog.location,
        image: blog.image,
        date: new Date(blog.createdAt).toISOString().split('T')[0],
        keywords: blog.keywords || '',
        donationTarget: blog.donationTarget?.toString() || ''
    });

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto my-4">
                <DialogHeader className="sticky top-0 bg-white pb-4 z-10">
                    <DialogTitle>Edit Blog Post</DialogTitle>
                </DialogHeader>
                <form onSubmit={onUpdate} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Title and Date */}
                        <div>
                            <Label htmlFor="edit-title">Title</Label>
                            <Input
                                id="edit-title"
                                value={blogData.title}
                                placeholder="Enter blog title"
                                onChange={(e) => setBlogData({ ...blogData, title: e.target.value })}
                            />
                        </div>
                        <div>
                            <Label htmlFor="edit-date">Date</Label>
                            <Input
                                id="edit-date"
                                type="date"
                                value={blogData.date}
                                onChange={(e) => setBlogData({ ...blogData, date: e.target.value })}
                            />
                        </div>

                        {/* Severity and Location */}
                        <div>
                            <Label htmlFor="edit-severity">Severity Level</Label>
                            <Select
                                value={blogData.severity}
                                onValueChange={(value) => setBlogData({ ...blogData, severity: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select severity" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Low">Low</SelectItem>
                                    <SelectItem value="Medium">Medium</SelectItem>
                                    <SelectItem value="High">High</SelectItem>
                                    <SelectItem value="Critical">Critical</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label htmlFor="edit-location">Location</Label>
                            <Input
                                id="edit-location"
                                value={blogData.location}
                                placeholder="City, Province"
                                onChange={(e) => setBlogData({ ...blogData, location: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Image URL */}
                    <div>
                        <Label htmlFor="edit-image">Image URL</Label>
                        <Input
                            id="edit-image"
                            value={blogData.image}
                            placeholder="Enter image URL"
                            onChange={(e) => setBlogData({ ...blogData, image: e.target.value })}
                        />
                    </div>

                    {/* Keywords and Donation Target */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="edit-keywords">Keywords</Label>
                            <Input
                                id="edit-keywords"
                                value={blogData.keywords}
                                placeholder="e.g., balochistan, earthquake"
                                onChange={(e) => setBlogData({ ...blogData, keywords: e.target.value })}
                            />
                        </div>
                        <div>
                            <Label htmlFor="edit-donationTarget">Donation Target (PKR)</Label>
                            <Input
                                id="edit-donationTarget"
                                value={blogData.donationTarget}
                                placeholder="Enter target amount"
                                onChange={(e) => setBlogData({ ...blogData, donationTarget: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Content */}
                    <div>
                        <Label htmlFor="edit-content">Blog Content</Label>
                        <Textarea
                            id="edit-content"
                            value={blogData.content}
                            placeholder="Write your blog content here..."
                            className="h-24"
                            onChange={(e) => setBlogData({ ...blogData, content: e.target.value })}
                        />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end space-x-2 pt-4 sticky bottom-0 bg-white">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            Save Changes
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}