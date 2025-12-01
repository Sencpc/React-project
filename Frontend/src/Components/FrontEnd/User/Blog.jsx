import { useState } from 'react';

const Blog = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = [
    'All',
    'Hair Care',
    'Hair Trends',
    'Styling Tips',
    'Product Reviews',
    'Hair Health',
    'Tutorials'
  ];

  const blogPosts = [
    {
      id: 1,
      title: "10 Essential Tips for Healthy Hair Care",
      excerpt: "Learn the fundamental practices to maintain strong, shiny, and healthy hair. From proper washing techniques to the right products for your hair type.",
      category: "Hair Care",
      author: "Dr. Sarah Johnson",
      date: "Oct 25, 2025",
      readTime: "5 min read",
      image: "hair-care-tips.jpg",
      tags: ["Hair Care", "Tips", "Health"],
      relatedPosts: [2, 5, 6]
    },
    {
      id: 2,
      title: "2025 Hair Color Trends You Need to Try",
      excerpt: "Discover the hottest hair color trends of 2025, from bold vibrant shades to subtle natural tones that are taking the beauty world by storm.",
      category: "Hair Trends",
      author: "Emily Chen",
      date: "Oct 23, 2025",
      readTime: "7 min read",
      image: "color-trends.jpg",
      tags: ["Trends", "Color", "Style"],
      relatedPosts: [3, 7, 8]
    },
    {
      id: 3,
      title: "How to Style Beach Waves at Home",
      excerpt: "Master the art of creating perfect beach waves with our step-by-step tutorial. Get that effortless, tousled look without visiting the salon.",
      category: "Tutorials",
      author: "Lisa Martinez",
      date: "Oct 20, 2025",
      readTime: "6 min read",
      image: "beach-waves.jpg",
      tags: ["Tutorial", "Styling", "DIY"],
      relatedPosts: [4, 9, 10]
    },
    {
      id: 4,
      title: "The Ultimate Guide to Hair Straightening",
      excerpt: "Everything you need to know about hair straightening methods, from temporary styling to permanent treatments. Find the best option for you.",
      category: "Styling Tips",
      author: "Amanda White",
      date: "Oct 18, 2025",
      readTime: "8 min read",
      image: "straightening.jpg",
      tags: ["Styling", "Tutorial", "Tips"],
      relatedPosts: [3, 11, 12]
    },
    {
      id: 5,
      title: "Best Hair Masks for Damaged Hair",
      excerpt: "Repair and restore your damaged hair with these highly effective hair masks. Natural and commercial options reviewed.",
      category: "Product Reviews",
      author: "Jessica Lee",
      date: "Oct 15, 2025",
      readTime: "5 min read",
      image: "hair-masks.jpg",
      tags: ["Products", "Hair Care", "Reviews"],
      relatedPosts: [1, 6, 13]
    },
    {
      id: 6,
      title: "Understanding Hair Porosity and Its Impact",
      excerpt: "Learn about hair porosity and how it affects your hair care routine. Discover the best products for your porosity type.",
      category: "Hair Health",
      author: "Dr. Maria Rodriguez",
      date: "Oct 12, 2025",
      readTime: "6 min read",
      image: "hair-porosity.jpg",
      tags: ["Health", "Science", "Hair Care"],
      relatedPosts: [1, 5, 14]
    },
    {
      id: 7,
      title: "Balayage vs Ombre: Which is Right for You?",
      excerpt: "Confused about balayage and ombre? We break down the differences and help you choose the perfect coloring technique.",
      category: "Hair Trends",
      author: "Sophie Turner",
      date: "Oct 10, 2025",
      readTime: "5 min read",
      image: "balayage-ombre.jpg",
      tags: ["Trends", "Color", "Guide"],
      relatedPosts: [2, 8, 15]
    },
    {
      id: 8,
      title: "Trending Short Hairstyles for 2025",
      excerpt: "Bold, chic, and absolutely stunning - explore the short hairstyles that are dominating 2025's fashion scene.",
      category: "Hair Trends",
      author: "Alex Kim",
      date: "Oct 8, 2025",
      readTime: "6 min read",
      image: "short-styles.jpg",
      tags: ["Trends", "Short Hair", "Style"],
      relatedPosts: [2, 7, 16]
    },
    {
      id: 9,
      title: "Step-by-Step Braiding Techniques",
      excerpt: "From simple three-strand braids to intricate Dutch and French braids, master all braiding techniques with our detailed guide.",
      category: "Tutorials",
      author: "Rachel Green",
      date: "Oct 5, 2025",
      readTime: "10 min read",
      image: "braiding.jpg",
      tags: ["Tutorial", "Braids", "Styling"],
      relatedPosts: [3, 10, 17]
    },
    {
      id: 10,
      title: "How to Create the Perfect Updo",
      excerpt: "Elegant updos for every occasion. Learn professional techniques to create stunning updo hairstyles at home.",
      category: "Tutorials",
      author: "Monica Geller",
      date: "Oct 3, 2025",
      readTime: "7 min read",
      image: "updo.jpg",
      tags: ["Tutorial", "Updo", "Formal"],
      relatedPosts: [3, 9, 18]
    }
  ];

  const filteredPosts = blogPosts.filter(post => {
    const matchesCategory = selectedCategory === 'All' || post.category === selectedCategory;
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         post.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const getRelatedPosts = (relatedIds) => {
    return blogPosts.filter(post => relatedIds.includes(post.id)).slice(0, 3);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-pink-100 to-rose-50 pt-20">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-pink-300 to-rose-300 text-white py-16 px-6">
          <div className="max-w-7xl mx-auto text-center">
            <h1 className="text-5xl font-bold mb-4">Beauty & Hair Blog</h1>
            <p className="text-xl text-white/90 mb-8">
              Your ultimate guide to hair care, trends, and styling tips
            </p>
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search articles, tips, tutorials..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-6 py-4 pl-14 rounded-full bg-white text-gray-800 shadow-lg focus:outline-none focus:ring-4 focus:ring-white/50"
                />
                <svg className="absolute left-5 top-1/2 transform -translate-y-1/2 w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Category Filter */}
        <div className="bg-white shadow-md sticky top-0 z-40 border-b">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center gap-3 overflow-x-auto">
              <span className="font-semibold text-gray-700 whitespace-nowrap">Categories:</span>
              <div className="flex gap-2">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-5 py-2 rounded-full font-medium whitespace-nowrap transition-all duration-300 ${
                      selectedCategory === category
                        ? 'bg-pink-400 text-white shadow-lg transform scale-105'
                        : 'bg-gray-100 text-gray-700 hover:bg-pink-100 hover:text-pink-600'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Blog Posts Grid */}
        <div className="max-w-7xl mx-auto px-6 py-12">
          {/* Results Info */}
          <div className="mb-8">
            <p className="text-gray-600">
              Showing <span className="font-bold text-pink-600">{filteredPosts.length}</span> article{filteredPosts.length !== 1 ? 's' : ''}
              {searchQuery && ` for "${searchQuery}"`}
            </p>
          </div>

          {/* Posts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPosts.map((post) => (
              <article
                key={post.id}
                className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer"
              >
                {/* Image Placeholder */}
                <div className="relative h-56 bg-gradient-to-br from-pink-200 to-rose-200">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg className="w-20 h-20 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                    </svg>
                  </div>
                  {/* Category Badge */}
                  <div className="absolute top-4 left-4">
                    <span className="bg-white/95 backdrop-blur-sm text-pink-600 px-4 py-1 rounded-full text-sm font-bold shadow-md">
                      {post.category}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  {/* Meta Info */}
                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                      </svg>
                      <span>{post.date}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                      <span>{post.readTime}</span>
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="text-xl font-bold text-gray-800 mb-3 hover:text-pink-600 transition-colors duration-300 line-clamp-2">
                    {post.title}
                  </h3>

                  {/* Excerpt */}
                  <p className="text-gray-600 mb-4 line-clamp-3">
                    {post.excerpt}
                  </p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {post.tags.map((tag, index) => (
                      <span key={index} className="text-xs bg-pink-50 text-pink-600 px-3 py-1 rounded-full">
                        #{tag}
                      </span>
                    ))}
                  </div>

                  {/* Author & Read More */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-pink-300 to-rose-300 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold text-sm">
                          {post.author.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <span className="text-sm text-gray-700 font-medium">{post.author}</span>
                    </div>
                    <button className="text-pink-500 hover:text-pink-600 font-semibold text-sm flex items-center gap-1 group">
                      Read More
                      <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                      </svg>
                    </button>
                  </div>

                  {/* Related Articles Section */}
                  <div className="mt-6 pt-6 border-t border-gray-100">
                    <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                      <svg className="w-4 h-4 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                      </svg>
                      Related Articles
                    </h4>
                    <ul className="space-y-2">
                      {getRelatedPosts(post.relatedPosts).map((relatedPost) => (
                        <li key={relatedPost.id} className="text-xs">
                          <a href="#" className="text-pink-600 hover:text-pink-700 hover:underline line-clamp-1 flex items-start gap-2">
                            <span className="text-pink-400 mt-0.5">•</span>
                            <span className="flex-1">{relatedPost.title}</span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {/* No Results */}
          {filteredPosts.length === 0 && (
            <div className="text-center py-16">
              <svg className="w-20 h-20 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <h3 className="text-2xl font-bold text-gray-600 mb-2">No articles found</h3>
              <p className="text-gray-500">Try adjusting your search or filters</p>
            </div>
          )}

          {/* Load More Button */}
          {filteredPosts.length > 0 && (
            <div className="text-center mt-12">
              <button className="bg-gradient-to-r from-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500 text-white font-bold py-4 px-10 rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg">
                Load More Articles
              </button>
            </div>
          )}
        </div>
    </div>
  );
};

export default Blog;
