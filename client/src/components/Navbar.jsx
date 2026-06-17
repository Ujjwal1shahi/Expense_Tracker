import React from "react";
import { useNavigate } from "react-router-dom";

const Navbar = ({ scrolled, menuOpen, setMenuOpen }) => {
  const navigate = useNavigate();

  return (
    <header className="fixed top-3 left-0 right-0 z-50 px-6 transition-all duration-500">
      <div
        className="relative max-w-7xl mx-auto rounded-full overflow-hidden"
        style={{
          background: scrolled
            ? "rgba(255,255,255,0.08)"
            : "rgba(255,255,255,0.04)",
          backdropFilter: "blur(10px) saturate(180%)",
          WebkitBackdropFilter: "blur(30px) saturate(180%)",
          border: "1px solid rgba(255,255,255,0.12)",
          boxShadow: scrolled
            ? `
              0 12px 40px rgba(0,0,0,0.25),
              inset 0 1px 0 rgba(255,255,255,0.15),
              inset 0 -1px 0 rgba(255,255,255,0.05)
            `
            : `
              0 8px 30px rgba(0,0,0,0.15),
              inset 0 1px 0 rgba(255,255,255,0.1)
            `,
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `
              linear-gradient(
                135deg,
                rgba(255,255,255,0.18) 0%,
                rgba(255,255,255,0.03) 40%,
                rgba(255,255,255,0.08) 100%
              )
            `,
          }}
        />

        <div
          className="relative max-w-7xl mx-auto px-6 flex items-center justify-between"
          style={{ height: 62 }}
        >
          {/* Logo */}
          <div
            onClick={() => navigate("/")}
            className="flex items-center gap-4 cursor-pointer"
          >
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{
                background:
                  "linear-gradient(135deg,#10b981,#34d399)",
                boxShadow:
                  "0 0 30px rgba(16,185,129,0.45)",
              }}
            >
              <svg
                viewBox="0 0 20 20"
                fill="white"
                className="w-6 h-6"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.077 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.077-2.354-1.253V5z"
                  clipRule="evenodd"
                />
              </svg>
            </div>

            <span className="text-2xl font-extrabold tracking-tight text-white/70">
              Spendly
            </span>
          </div>

          {/* Desktop Links */}
          <nav className="hidden md:flex items-center gap-12">
            {["Features", "About", "Pricing", "Blog", "Company"].map(
              (item) => (
                <a
                  key={item}
                  href="#"
                  className="
                    text-white/75
                    hover:text-white
                    font-medium
                    tracking-wide
                    transition-all
                    duration-300
                    hover:scale-105
                  "
                >
                  {item}
                </a>
              )
            )}
          </nav>

          {/* Desktop Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={() => navigate("/sign-in")}
              className="
                px-4 py-2
                rounded-2xl
                text-md
                text-white/90
                border border-white/10
                bg-white/5
                hover:bg-white/10
                transition-all duration-300
              "
            >
              Sign In
            </button>

            <button
              onClick={() => navigate("/sign-up")}
              className="
                px-6 py-2
                rounded-2xl
                font-semibold
                text-white
                bg-gradient-to-r
                from-emerald-500/20
                to-green-400/20
                backdrop-blur-2xl
                shadow-[0_0_25px_rgba(16,185,129,0.35)]
                hover:scale-105
                transition-all duration-300
                text-md
              "
            >
              Get Started Free
            </button>
          </div>

          {/* Mobile Button */}
          <button
            onClick={() => setMenuOpen((prev) => !prev)}
            className="md:hidden text-white p-2"
          >
            ☰
          </button>
        </div>

        {/* Mobile Menu */}
        <div
          className="md:hidden overflow-hidden transition-all duration-300"
          style={{ maxHeight: menuOpen ? 320 : 0 }}
        >
          <div className="px-6 py-5 flex flex-col gap-4 border-t border-white/10">
            {["Features", "About", "Pricing", "Blog", "Company"].map(
              (item) => (
                <a
                  key={item}
                  href="#"
                  className="text-white/70 hover:text-white"
                >
                  {item}
                </a>
              )
            )}

            <button
              onClick={() => navigate("/sign-in")}
              className="px-4 py-2 rounded-xl bg-white/10 text-white w-fit"
            >
              Sign In
            </button>

            <button
              onClick={() => navigate("/sign-up")}
              className="px-4 py-2 rounded-xl bg-emerald-500 text-white w-fit"
            >
              Get Started Free
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;