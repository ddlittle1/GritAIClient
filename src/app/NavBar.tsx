"use client";
import Link from "@chakra-ui/next-js";
import { usePathname } from "next/navigation";
import React from "react";
import { SiAutodeskrevit } from "react-icons/si";
import classnames from "classnames";

const NavBar = () => {
  const currentPath = usePathname();
  console.log("currentpath", currentPath);
  const links = [
    { label: "Dashboard", href: "/" },
    { label: "Issues", href: "/issues" },
  ];
  return (
    <nav className="flex space-x-6 border-b mb-5 px-5 h-14 items-center">
      <Link href="/">
        <SiAutodeskrevit size={40} />
      </Link>
      <ul className="flex space-x-6">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={classnames({
              "blue.400": link.href === currentPath,
              "text-zinc-500": link.href !== currentPath,
              "hover:text-zinc-800 transition-colors": true,
            })}
          >
            {link.label}
          </Link>
        ))}
      </ul>
    </nav>
  );
};

export default NavBar;
