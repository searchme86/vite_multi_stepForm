import React from "react";
import { Link } from "react-router-dom";
import { Navbar as HeroUINavbar, NavbarBrand, NavbarContent, NavbarItem, Button, Input } from "@heroui/react";
import { Icon } from "@iconify/react";

const Navbar: React.FC = () => {
  return (
    <HeroUINavbar maxWidth="xl" isBordered>
      <NavbarBrand>
        <Link to="/" className="flex items-center gap-2">
          <Icon icon="lucide:home" className="text-primary" width={24} height={24} />
          <p className="font-bold text-inherit text-xl">StuffUs</p>
        </Link>
      </NavbarBrand>
      
      <NavbarContent className="hidden sm:flex gap-4" justify="center">
        <NavbarItem>
          <Link to="/" className="text-default-600 hover:text-primary">
            Home
          </Link>
        </NavbarItem>
        <NavbarItem isActive>
          <Link to="/" className="text-primary font-medium">
            Blog
          </Link>
        </NavbarItem>
        <NavbarItem>
          <Link to="/" className="text-default-600 hover:text-primary">
            Inspiration
          </Link>
        </NavbarItem>
        <NavbarItem>
          <Link to="/" className="text-default-600 hover:text-primary">
            Shop
          </Link>
        </NavbarItem>
        <NavbarItem>
          <Link to="/" className="text-default-600 hover:text-primary">
            About
          </Link>
        </NavbarItem>
      </NavbarContent>
      
      <NavbarContent justify="end">
        <NavbarItem className="hidden lg:flex">
          <Input
            classNames={{
              base: "max-w-full sm:max-w-[10rem] h-10",
              mainWrapper: "h-full",
              input: "text-small",
              inputWrapper: "h-full font-normal text-default-500 bg-default-100",
            }}
            placeholder="Search..."
            size="sm"
            startContent={<Icon icon="lucide:search" size={16} />}
            type="search"
          />
        </NavbarItem>
        <NavbarItem>
          <Button color="primary" variant="flat" startContent={<Icon icon="lucide:user" size={16} />}>
            Sign In
          </Button>
        </NavbarItem>
      </NavbarContent>
    </HeroUINavbar>
  );
};

export default Navbar;