import {
  GithubAuthProvider,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";

import React, { useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { FcGoogle } from "react-icons/fc";
import { FaGithub } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import api from "../../libs/apiCall";
import { auth } from "../../libs/firebaseConfig";
import useStore from "../../store";
import { Button } from "./button";

export const SocialAuth = ({ isLoading, setLoading }) => {
  const [user] = useAuthState(auth);
  const [selectedProvider, setSelectedProvider] = useState("");

  const { setCredentials } = useStore((state) => state);

  const navigate = useNavigate();

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();

    try {
      setSelectedProvider("google");

      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error(error);
      toast.error("Google sign in failed");
    }
  };

  const signInWithGithub = async () => {
    const provider = new GithubAuthProvider();

    try {
      setSelectedProvider("github");

      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error(error);
      toast.error("Github sign in failed");
    }
  };

  useEffect(() => {
    const handleSocialLogin = async () => {
      if (!user) return;

      try {
        setLoading?.(true);

        const payload = {
          name: user.displayName,
          email: user.email,
          image: user.photoURL,
          provider: selectedProvider,
        };

        const res = await api.post("/auth/social-login", payload);

        if (res?.data?.success) {
          setCredentials(res.data.user);
          toast.success("Login successful");

          navigate("/dashboard");
        }
      } catch (error) {
        console.error(error);
        toast.error(
          error?.response?.data?.message || "Authentication failed"
        );
      } finally {
        setLoading?.(false);
      }
    };

    handleSocialLogin();
  }, [user]);

  return (
    <div className="flex flex-col gap-3 w-full">
      <Button
        type="button"
        disabled={isLoading}
        onClick={signInWithGoogle}
        className="w-full"
      >
        <FcGoogle className="mr-2 text-xl" />
        Continue with Google
      </Button>

      {/* <Button
        type="button"
        disabled={isLoading}
        onClick={signInWithGithub}
        className="w-full"
      >
        <FaGithub className="mr-2 text-xl" />
        Continue with GitHub
      </Button> */}
    </div>
  );
};

export default SocialAuth;