"use client";

import { useState } from "react";
import { auth, provider } from "../../../lib/firebase";
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signInWithPopup,
    fetchSignInMethodsForEmail,
} from "firebase/auth";
import Link from "next/link";
import styles from "./AuthForm.module.css";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import getAuthErrorMessage from "../../../lib/authErrors";
import { on } from "events";

export default function AuthForm({ mode }: { mode: "login" | "register" }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [emailError, setEmailError] = useState<string | null>(null);
    const [passwordErrors, setPasswordErrors] = useState<string[]>([]);


    const validateEmail = (value: string): string | null => {
        if (!value) return "Email is required.";
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) return "Please enter a valid email address.";
        return null;
    };

    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        // if (!value) return "";

        setEmail(value);

        if (!value) {
            setEmailError(null);
            return;
        }
        setEmailError(validateEmail(value));
    };

    const validatePassword = (value: string): string[] => {
        const errors: string[] = [];

        if (!value) return [];

        if (value.length < 6) {
            errors.push("Password must be at least 6 characters.");
        }
        if (!/[A-Za-z]/.test(value)) {
            errors.push("Password must contain at least one letter.");
        }
        if (!/[0-9]/.test(value)) {
            errors.push("Password must contain at least one number.");
        }
        return errors;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const emailError = validateEmail(email);
        const passwordError = validatePassword(password);

        setEmailError(emailError);
        setPasswordErrors(passwordError);

        if (emailError || passwordError.length > 0) return;

        try {
            if (mode === "login") {
                await signInWithEmailAndPassword(auth, email, password);
                alert("Login successfully!");
            } else {
                if (mode === "register") {
                    const methods = await fetchSignInMethodsForEmail(auth, email);
                    if (methods.length > 0) {
                        alert("This email is already registered. Please log in instead.");
                        return;
                    }
                }
                await createUserWithEmailAndPassword(auth, email, password);
                alert("register successfully!");
            }
        } catch (err: any) {
            const msg = getAuthErrorMessage(err, mode);
            alert(msg);
        }
    };

    const handleGoogle = async () => {
        try {
            await signInWithPopup(auth, provider)
                .then((result) => {
                    const user = result.user;
                    let profil_URL = user.photoURL;
                    console.log(profil_URL);
                });
            alert("login successfully with Google!");
        } catch (err: any) {
            const msg = getAuthErrorMessage(err, mode);
            alert(msg);
        }
    };

    return (
        <div className={styles.container}>
            <div
                className={`${styles.box} ${mode === "register" ? styles.boxRegister : ""
                    }`}
            >
                <img src="../" alt="Logo" className={styles.logo} />

                <h2 className={styles.title}>
                    {mode === "login" ? "Log in" : "Sign up"}
                </h2>

                <p className={styles.subtitle}>
                    {mode === "login"
                        ? "Log in by entering your email address and password."
                        : "Enter your email and password to create your account."}
                </p>

                <form onSubmit={handleSubmit} className={styles.form}>
                    {/* Email */}
                    <label className={styles.label}>
                        Email address
                        <div className={styles.inputWrapper}>
                            <span className={styles.inputIconLeft}>
                                <Mail size={16} color="#000000ff" />
                            </span>

                            <input
                                type="email"
                                placeholder="email@address.com"
                                value={email}
                                onChange={handleEmailChange}
                                className={styles.input}
                                required
                            />
                        </div>
                        {emailError && <div className={styles.error}>{emailError}</div>}
                    </label>

                    {/* Password */}
                    <label className={styles.label}>
                        Password
                        <div className={styles.inputWrapper}>
                            <span className={styles.inputIconLeft}>
                                <Lock size={18} color="#000000ff" />
                            </span>

                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••"
                                value={password}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    setPassword(value);
                                    setPasswordErrors(validatePassword(value));
                                }}
                                className={styles.input}
                                required
                            />

                            <button
                                type="button"
                                onClick={() => setShowPassword((s) => !s)}
                                className={styles.iconButton}
                                aria-label={showPassword ? "Hide password" : "Show password"}
                            >
                                {showPassword ? <EyeOff size={18} color="#6B7280" /> : <Eye size={18} color="#6B7280" />}
                            </button>
                        </div>

                        {passwordErrors.length > 0 && (
                            <div className={styles.error}>
                                {passwordErrors.map((err, idx) => (
                                    <p key={idx}>{err}</p>
                                ))}
                            </div>
                        )}
                    </label>

                    {mode === "register" && (
                        <label className={styles.checkboxRow}>
                            <input type="checkbox" className={styles.checkbox} />
                            <span>Receive news, updates and deals</span>
                        </label>
                    )}

                    <button
                        type="submit"
                        className={styles.primaryBtn}
                        disabled={passwordErrors.length > 0 || !email || !password}                    >
                        {mode === "login" ? "Log in" : "Create Account"}
                    </button>
                </form>

                <div className={styles.divider}>
                    <span>Or</span>
                </div>

                <button onClick={handleGoogle} className={styles.googleBtn}>
                    <img
                        className={styles.googleIcon}
                        src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                        alt="Google logo"
                    />
                    <span>
                        {mode === "login" ? "Log in with Google" : "Continue with Google"}
                    </span>
                </button>

                {mode === "register" && (
                    <p className={styles.terms}>
                        By creating an account, you agree to the{" "}
                        <a href="#" className={styles.textLink}>
                            Terms of Service
                        </a>{" "}
                        and{" "}
                        <a href="#" className={styles.textLink}>
                            Privacy Policy
                        </a>
                        .
                    </p>
                )}

                <p className={styles.switch}>
                    {mode === "login"
                        ? "Don't have an account? <br> Forget password?"
                        : "Already have an account?"}{" "}
                    <Link
                        href={mode === "login" ? "/register" : "/login"}
                        className={styles.textLink}
                    >
                        {mode === "login" ? "Sign up here" : "Log in here"}
                    </Link>
                </p>

                {mode === "login" && (
                    <p className={styles.switch}>
                        <Link
                            href="/forget-password"
                            className={styles.textLink}
                        >
                            Forget password?
                        </Link>
                    </p>
                )}
            </div>
        </div>
    );
}
