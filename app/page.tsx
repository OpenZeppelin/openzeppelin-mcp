"use client";

import React, { useState, useEffect } from "react";
import "@/styles/landing.css";
import Image from "next/image";
import {
  ThemeIcon,
  GitHubIcon,
  SolidityIcon,
  CairoIcon,
  StellarIcon,
  StylusIcon,
  UniswapHooksIcon,
} from "@/components/icons";
import { ConfigModal } from "@/components/ConfigModal";

function ThemeToggle({ onThemeChange }) {
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
      setTheme(savedTheme);
      applyTheme(savedTheme);
      onThemeChange(savedTheme);
    } else {
      // Fallback to system default on first render
      const systemPrefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;
      const systemTheme = systemPrefersDark ? "dark" : "light";
      setTheme(systemTheme);
      applyTheme(systemTheme);
      onThemeChange(systemTheme);
    }
  }, [onThemeChange]);

  const applyTheme = (newTheme) => {
    const root = document.documentElement;
    root.setAttribute("data-theme", newTheme);
  };

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem("theme", nextTheme);
    applyTheme(nextTheme);
    onThemeChange(nextTheme);
  };

  return (
    <button
      className="header-button"
      onClick={toggleTheme}
      title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
    >
      <ThemeIcon theme={theme} />
    </button>
  );
}

function GitHubButton() {
  return (
    <a
      href="https://github.com/OpenZeppelin/openzeppelin-mcp"
      target="_blank"
      rel="noopener noreferrer"
      className="header-button"
      title="View on GitHub"
    >
      <GitHubIcon />
    </a>
  );
}

export default function HomePage() {
  const [currentTheme, setCurrentTheme] = useState("dark");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMcp, setSelectedMcp] = useState(null);

  const handleThemeChange = (theme) => {
    setCurrentTheme(theme);
  };

  const getLogoSrc = () => {
    return currentTheme === "light"
      ? "/OZ-Logo-BlackBG.png"
      : "/OZ-Logo-WhiteBG.png";
  };

  const openModal = (mcp) => {
    setSelectedMcp(mcp);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedMcp(null);
  };

  const BASE_URL =
    process.env.NODE_ENV === "development"
      ? "http://localhost:3000/"
      : "https://mcp.openzeppelin.com/";

  const AVAILABLE_MCPS = [
    {
      name: "Solidity Contracts",
      icon: SolidityIcon,
      description:
        "Generate Solidity secure smart contracts based on OpenZeppelin templates",
      url: `${BASE_URL}contracts/solidity/mcp`,
      npmMcpPackage: "@openzeppelin/contracts-mcp",
    },
    {
      name: "Cairo Contracts",
      icon: CairoIcon,
      description:
        "Generate Cairo secure smart contracts based on OpenZeppelin templates",
      url: `${BASE_URL}contracts/cairo/mcp`,
      npmMcpPackage: "@openzeppelin/contracts-mcp",
    },
    {
      name: "Stellar Contracts",
      icon: StellarIcon,
      description:
        "Generate Stellar secure smart contracts based on OpenZeppelin templates",
      url: `${BASE_URL}contracts/stellar/mcp`,
      npmMcpPackage: "@openzeppelin/contracts-mcp",
    },
    {
      name: "Stylus Contracts",
      icon: StylusIcon,
      description:
        "Generate Stylus secure smart contracts based on OpenZeppelin templates",
      url: `${BASE_URL}contracts/stylus/mcp`,
      npmMcpPackage: "@openzeppelin/contracts-mcp",
    },
    {
      name: "Uniswap Hooks",
      icon: UniswapHooksIcon,
      description:
        "Generate Uniswap Hooks secure smart contracts based on OpenZeppelin templates",
      url: `${BASE_URL}contracts/uniswap-hooks/mcp`,
      npmMcpPackage: "@openzeppelin/contracts-mcp",
    },
  ];

  return (
    <div className="page-container">
      <header className="page-header">
        <div className="header-content">
          <div className="header-left">
            <a
              href="https://www.openzeppelin.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="logo-link"
            >
              <Image
                src={getLogoSrc()}
                alt="OpenZeppelin Logo"
                width={200}
                height={36}
                className="header-logo"
              />
            </a>
          </div>
          <div className="header-right">
            <GitHubButton />
            <ThemeToggle onThemeChange={handleThemeChange} />
          </div>
        </div>
      </header>

      <div className="main-container">
        <h1 className="main-title">MCP Servers</h1>
        <p className="main-subtitle">
          Model Context Protocol Servers <br /> Repository for OpenZeppelin
          Products
        </p>
        <div className="mcp-grid">
          {AVAILABLE_MCPS.map((mcp, index) => (
            <div
              key={index}
              className="mcp-card"
              onClick={() => openModal(mcp)}
            >
              <div className="mcp-name">
                <mcp.icon theme={currentTheme} />
                <h3>{mcp.name}</h3>
              </div>
              <p className="mcp-description">{mcp.description}</p>
              <p className="mcp-view-config">{"View Setup Instructions →"}</p>
            </div>
          ))}
        </div>
      </div>

      <ConfigModal
        isOpen={isModalOpen}
        onClose={closeModal}
        mcp={selectedMcp}
        currentTheme={currentTheme}
      />
      <footer className="page-footer">
        <p>
          &copy; OpenZeppelin 2017-2025 |{" "}
          <a
            href="https://www.openzeppelin.com/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-link"
          >
            Privacy
          </a>{" "}
          |{" "}
          <a
            href="https://www.openzeppelin.com/tos"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-link"
          >
            Terms of use
          </a>
        </p>
      </footer>
    </div>
  );
}
