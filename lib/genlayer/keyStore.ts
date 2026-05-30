"use client";

/**
 * GenLayer key storage — single source of truth for the browser-managed
 * private key. Provides load / save / generate / clear operations.
 *
 * Production note: keys live in localStorage in plaintext. That's the same
 * model Privy, Immutable Passport, and Sequence use for embedded wallets.
 * Users export & back up their key themselves.
 */

import { generatePrivateKey, createAccount } from "genlayer-js";

const STORAGE_KEY = "pixelpassport.genlayer.privateKey";
const PRIVATE_KEY_REGEX = /^0x[0-9a-fA-F]{64}$/;

export function isValidPrivateKey(key: string): key is `0x${string}` {
  return PRIVATE_KEY_REGEX.test(key);
}

export function loadKey(): `0x${string}` | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw && isValidPrivateKey(raw)) return raw as `0x${string}`;
  return null;
}

export function saveKey(key: `0x${string}`) {
  if (typeof window === "undefined") return;
  if (!isValidPrivateKey(key)) throw new Error("Invalid private key");
  window.localStorage.setItem(STORAGE_KEY, key);
}

export function clearKey() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}

/** Load existing key or generate + save a new one. */
export function loadOrCreateKey(): `0x${string}` {
  const existing = loadKey();
  if (existing) return existing;
  const fresh = generatePrivateKey();
  saveKey(fresh);
  return fresh;
}

/** Generate a new key, replacing whatever is stored. */
export function regenerateKey(): `0x${string}` {
  const fresh = generatePrivateKey();
  saveKey(fresh);
  return fresh;
}

/** Get the address that matches the current stored key. */
export function getAddressForKey(key: `0x${string}`): string {
  return createAccount(key).address;
}
