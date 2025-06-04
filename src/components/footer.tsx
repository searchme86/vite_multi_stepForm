import React from "react";
import { Link } from "react-router-dom";
import { Icon } from "@iconify/react";

const Footer: React.FC = () => {
  return (
    <footer className="bg-default-50 pt-12 pb-6">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Icon icon="lucide:home" className="text-primary" width={24} height={24} />
              <h3 className="text-xl font-bold">StuffUs</h3>
            </div>
            <p className="text-default-600 mb-4">
              Transforming houses into homes with innovative design solutions and inspiration.
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-default-500 hover:text-primary">
                <Icon icon="logos:facebook" width={24} height={24} />
              </a>
              <a href="#" className="text-default-500 hover:text-primary">
                <Icon icon="logos:instagram-icon" width={24} height={24} />
              </a>
              <a href="#" className="text-default-500 hover:text-primary">
                <Icon icon="logos:linkedin-icon" width={24} height={24} />
              </a>
              <a href="#" className="text-default-500 hover:text-primary">
                <Icon icon="logos:youtube-icon" width={24} height={24} />
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-bold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-default-600 hover:text-primary">Home</Link>
              </li>
              <li>
                <Link to="/" className="text-default-600 hover:text-primary">Blog</Link>
              </li>
              <li>
                <Link to="/" className="text-default-600 hover:text-primary">About Us</Link>
              </li>
              <li>
                <Link to="/" className="text-default-600 hover:text-primary">Contact</Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-bold mb-4">Categories</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-default-600 hover:text-primary">Home Transformation</Link>
              </li>
              <li>
                <Link to="/" className="text-default-600 hover:text-primary">Interior Design</Link>
              </li>
              <li>
                <Link to="/" className="text-default-600 hover:text-primary">DIY Projects</Link>
              </li>
              <li>
                <Link to="/" className="text-default-600 hover:text-primary">Decor Trends</Link>
              </li>
              <li>
                <Link to="/" className="text-default-600 hover:text-primary">Space Optimization</Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-bold mb-4">Contact Us</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <Icon icon="lucide:map-pin" className="text-primary mt-1" />
                <span className="text-default-600">
                  123 Design Street, Creative City, 10001
                </span>
              </li>
              <li className="flex items-center gap-2">
                <Icon icon="lucide:phone" className="text-primary" />
                <span className="text-default-600">+1 (555) 123-4567</span>
              </li>
              <li className="flex items-center gap-2">
                <Icon icon="lucide:mail" className="text-primary" />
                <span className="text-default-600">info@stuffus.com</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-default-200 pt-6 flex flex-col md:flex-row justify-between items-center">
          <p className="text-default-500 text-sm mb-4 md:mb-0">
            © 2024 StuffUs. All rights reserved.
          </p>
          <div className="flex gap-4">
            <Link to="/" className="text-default-500 text-sm hover:text-primary">
              Privacy Policy
            </Link>
            <Link to="/" className="text-default-500 text-sm hover:text-primary">
              Terms of Service
            </Link>
            <Link to="/" className="text-default-500 text-sm hover:text-primary">
              Cookie Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;