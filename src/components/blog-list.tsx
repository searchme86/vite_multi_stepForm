import React from "react";
import { Link } from "react-router-dom";
import { Card, CardBody, CardFooter, Chip, Avatar, Button,addToast } from "@heroui/react";
import { Icon } from "@iconify/react";
import { blogPosts } from "../data/blog-posts";

const BlogList: React.FC = () => {
  const [activeCategory, setActiveCategory] = React.useState<string>("all");

  const categories = [
    { key: "all", label: "All Posts" },
    { key: "transformation", label: "Transformation" },
    { key: "decor", label: "Decor" },
    { key: "diy", label: "DIY Projects" },
    { key: "trends", label: "Trends" },
    { key: "tips", label: "Tips & Tricks" }
  ];

  const filteredPosts = activeCategory === "all"
    ? blogPosts
    : blogPosts.filter(post => post.categories.includes(activeCategory));

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Home Transformation Blog</h1>
        <p className="text-default-600 max-w-2xl mx-auto">
          Discover the latest trends, tips, and inspiration for transforming your living spaces into beautiful, functional environments that reflect your personal style.
        </p>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2 justify-center mb-8">
        {categories.map((category) => (
          <Button
            key={category.key}
            variant={activeCategory === category.key ? "solid" : "flat"}
            color={activeCategory === category.key ? "primary" : "default"}
            className="mb-2"
            onPress={() => setActiveCategory(category.key)}
          >
            {category.label}
          </Button>
        ))}
      </div>

      {/* Featured Post */}
      <div className="mb-12">
        <Link to={`/blog/${blogPosts[0].id}`} className="block">
          <Card className="w-full h-[500px] overflow-hidden">
            <div className="relative w-full h-full">
              <img
                src={blogPosts[0].coverImage}
                alt={blogPosts[0].title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-6">
                <div className="flex items-center gap-2 mb-2">
                  <Chip color="primary" variant="flat" size="sm">Newest Blog</Chip>
                  <span className="text-white/80 text-sm">{blogPosts[0].readTime} Min</span>
                </div>
                <h2 className="text-4xl font-bold text-white mb-4">{blogPosts[0].title}</h2>
                <div className="flex items-center gap-3">
                  <Avatar src={blogPosts[0].author.avatar} name={blogPosts[0].author.name} size="sm" />
                  <div>
                    <div className="text-white text-sm">Written by</div>
                    <div className="text-white font-medium">{blogPosts[0].author.name}</div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </Link>
      </div>

      {/* Blog Posts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPosts.slice(1).map((post) => (
          <Card key={post.id} className="overflow-hidden" isPressable>
            <Link to={`/blog/${post.id}`}>
              <div className="h-48 overflow-hidden">
                <img
                  src={post.coverImage}
                  alt={post.title}
                  className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                />
              </div>
              <CardBody className="p-4">
                <div className="flex gap-2 mb-2">
                  {post.categories.slice(0, 2).map((category) => (
                    <Chip key={category} color="primary" variant="flat" size="sm">
                      {category}
                    </Chip>
                  ))}
                  <span className="text-default-500 text-sm ml-auto">{post.readTime} min</span>
                </div>
                <h3 className="text-xl font-bold mb-2">{post.title}</h3>
                <p className="text-default-600 line-clamp-2">{post.excerpt}</p>
              </CardBody>
              <CardFooter className="flex items-center gap-3 p-4 pt-0">
                <Avatar src={post.author.avatar} name={post.author.name} size="sm" />
                <div>
                  <div className="text-default-500 text-xs">Written by</div>
                  <div className="text-default-700 text-sm font-medium">{post.author.name}</div>
                </div>
                <div className="ml-auto text-default-500 text-sm">{post.date}</div>
              </CardFooter>
            </Link>
          </Card>
        ))}
      </div>

      {/* Load More Button */}
      <div className="flex justify-center mt-12">
        <Button color="primary" variant="flat" size="lg">
          Load More Articles
        </Button>
      </div>
    </div>
  );
};

export default BlogList;