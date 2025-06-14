import React from "react";
import { useParams, Link } from "react-router-dom";
import { Avatar, Button, Chip, Divider } from "@heroui/react";
import { Icon } from "@iconify/react";
import { blogPosts } from "../data/blog-posts";

const BlogPost: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const post = blogPosts.find(post => post.id === id);
  
  if (!post) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold mb-4">Blog post not found</h2>
        <Link to="/">
          <Button color="primary">Return to Blog</Button>
        </Link>
      </div>
    );
  }
  
  const socialPlatforms = [
    { name: "Facebook", icon: "logos:facebook", color: "bg-[#1877F2] text-white" },
    { name: "Instagram", icon: "logos:instagram-icon", color: "bg-gradient-to-r from-[#405DE6] to-[#E1306C] text-white" },
    { name: "LinkedIn", icon: "logos:linkedin-icon", color: "bg-[#0A66C2] text-white" },
    { name: "YouTube", icon: "logos:youtube-icon", color: "bg-[#FF0000] text-white" }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="relative w-full h-[500px] rounded-xl overflow-hidden mb-8">
        <img 
          src={post.coverImage} 
          alt={post.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex flex-col justify-end p-8">
          <div className="flex items-center gap-2 mb-2">
            <Chip color="primary" variant="flat" size="sm">Newest Blog</Chip>
            <span className="text-white/80 text-sm">{post.readTime} Min</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">{post.title}</h1>
          <div className="flex items-center gap-3">
            <Avatar src={post.author.avatar} name={post.author.name} size="md" />
            <div>
              <div className="text-white/80 text-sm">Written by</div>
              <div className="text-white font-medium">{post.author.name}</div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sidebar */}
        <div className="lg:col-span-3 order-2 lg:order-1">
          <div className="sticky top-24 space-y-8">
            {/* Date and Social Links */}
            <div className="bg-default-50 p-6 rounded-xl">
              <h3 className="text-lg font-semibold mb-4">Share</h3>
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <Icon icon="lucide:calendar" className="text-default-500" />
                  <span className="text-default-700">{post.date}</span>
                </div>
                <Divider />
                <div className="flex flex-wrap gap-2">
                  {socialPlatforms.map((platform) => (
                    <Button 
                      key={platform.name}
                      isIconOnly
                      variant="flat"
                      className="text-default-700"
                      aria-label={`Share on ${platform.name}`}
                    >
                      <Icon icon={platform.icon} width={24} height={24} />
                    </Button>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Categories */}
            <div className="bg-default-50 p-6 rounded-xl">
              <h3 className="text-lg font-semibold mb-4">Categories</h3>
              <div className="flex flex-wrap gap-2">
                {post.categories.map((category) => (
                  <Chip key={category} color="primary" variant="flat">
                    {category}
                  </Chip>
                ))}
              </div>
            </div>
            
            {/* Related Posts */}
            <div className="bg-default-50 p-6 rounded-xl">
              <h3 className="text-lg font-semibold mb-4">Related Posts</h3>
              <div className="space-y-4">
                {blogPosts
                  .filter(p => p.id !== post.id)
                  .slice(0, 3)
                  .map((relatedPost) => (
                    <Link key={relatedPost.id} to={`/blog/${relatedPost.id}`} className="block group">
                      <div className="flex gap-3">
                        <div className="w-20 h-20 rounded-md overflow-hidden flex-shrink-0">
                          <img 
                            src={relatedPost.coverImage} 
                            alt={relatedPost.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                        <div>
                          <h4 className="font-medium text-default-700 group-hover:text-primary transition-colors line-clamp-2">
                            {relatedPost.title}
                          </h4>
                          <p className="text-xs text-default-500 mt-1">{relatedPost.date}</p>
                        </div>
                      </div>
                    </Link>
                  ))}
              </div>
            </div>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="lg:col-span-9 order-1 lg:order-2">
          <article className="prose prose-lg max-w-none">
            <p className="text-xl text-default-700 font-medium mb-6 leading-relaxed">
              {post.excerpt}
            </p>
            
            <div dangerouslySetInnerHTML={{ __html: post.content }} />
            
            {/* Author Bio */}
            <div className="bg-default-50 p-6 rounded-xl mt-12 flex flex-col sm:flex-row gap-6 items-center sm:items-start">
              <Avatar 
                src={post.author.avatar} 
                name={post.author.name} 
                className="w-24 h-24"
              />
              <div>
                <h3 className="text-xl font-bold mb-2">{post.author.name}</h3>
                <p className="text-default-600 mb-4">{post.author.bio}</p>
                <div className="flex gap-2">
                  <Button size="sm" variant="flat" color="primary">
                    View All Posts
                  </Button>
                  <Button size="sm" variant="light" startContent={<Icon icon="lucide:mail" />}>
                    Contact
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Comments Section */}
            <div className="mt-12">
              <h3 className="text-2xl font-bold mb-6">Comments (12)</h3>
              <div className="space-y-6">
                {[1, 2, 3].map((comment) => (
                  <div key={comment} className="flex gap-4">
                    <Avatar 
                      src={`https://img.heroui.chat/image/avatar?w=200&h=200&u=${comment + 10}`} 
                      name={`User ${comment}`}
                      className="w-10 h-10"
                    />
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-medium">Sarah Johnson</h4>
                        <span className="text-sm text-default-500">2 days ago</span>
                      </div>
                      <p className="text-default-700 mb-3">
                        This article was exactly what I needed! I've been struggling with my living room layout for months, and your tips about furniture placement really helped me see the space differently.
                      </p>
                      <div className="flex gap-4">
                        <Button size="sm" variant="light" startContent={<Icon icon="lucide:thumbs-up" size={16} />}>
                          Like (8)
                        </Button>
                        <Button size="sm" variant="light" startContent={<Icon icon="lucide:reply" size={16} />}>
                          Reply
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Comment Form */}
              <div className="mt-8">
                <h4 className="text-xl font-bold mb-4">Leave a Comment</h4>
                <div className="flex gap-4">
                  <Avatar 
                    src="https://img.heroui.chat/image/avatar?w=200&h=200&u=1" 
                    name="You"
                    className="w-10 h-10"
                  />
                  <div className="flex-1">
                    <textarea 
                      className="w-full p-3 border border-default-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      rows={4}
                      placeholder="Write your comment here..."
                    />
                    <div className="flex justify-end mt-2">
                      <Button color="primary">
                        Post Comment
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </article>
        </div>
      </div>
      
      {/* Newsletter */}
      <div className="mt-16 bg-primary-50 p-8 rounded-xl">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-2">Subscribe to Our Newsletter</h2>
          <p className="text-default-600 mb-6">
            Get the latest home transformation tips, trends, and inspiration delivered straight to your inbox.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
            <input 
              type="email" 
              placeholder="Your email address" 
              className="flex-1 p-2 px-4 rounded-lg border border-default-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            <Button color="primary">
              Subscribe
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlogPost;