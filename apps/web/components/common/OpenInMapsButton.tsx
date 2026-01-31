"use client";

import { useEffect, useMemo, useState } from "react";

type NavigationPreference = "auto" | "google_maps" | "apple_maps" | "waze";

let cachedPreference: NavigationPreference | null | undefined;
let preferencePromise: Promise<NavigationPreference | null> | null = null;

type AddressInput = {
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  state?: string | null;
  zip_code?: string | null;
  country?: string | null;
};

type OpenInMapsButtonProps = {
  address?: AddressInput | null;
  addressText?: string | null;
  label?: string;
  className?: string;
};

const buildAddress = (address?: AddressInput | null, addressText?: string | null) => {
  if (addressText?.trim()) {
    return addressText.trim();
  }
  if (!address) {
    return "";
  }
  const parts = [
    address.address_line1,
    address.address_line2,
    address.city,
    address.state,
    address.zip_code,
    address.country
  ].filter((part) => Boolean(part && String(part).trim()));
  return parts.map((part) => String(part).trim()).join(", ");
};

const isValidAddress = (address?: AddressInput | null, addressText?: string | null) => {
  if (addressText?.trim()) {
    return true;
  }
  if (!address) {
    return false;
  }
  return Boolean(
    address.address_line1 &&
      address.city &&
      address.state &&
      address.zip_code &&
      address.country
  );
};

export default function OpenInMapsButton({
  address,
  addressText,
  label = "Abrir no mapa",
  className
}: OpenInMapsButtonProps) {
  const [preference, setPreference] = useState<NavigationPreference | null | undefined>(
    cachedPreference
  );
  const addressValue = buildAddress(address, addressText);
  const canOpen = isValidAddress(address, addressText);

  useEffect(() => {
    let isMounted = true;

    if (cachedPreference !== undefined) {
      setPreference(cachedPreference);
      return;
    }

    const loadPreference = async () => {
      try {
        if (!preferencePromise) {
          preferencePromise = fetch("/api/user/preferences", {
            cache: "no-store"
          })
            .then(async (response) => {
              if (!response.ok) {
                return null;
              }
              const payload = (await response.json()) as {
                data?: { preferred_navigation_app?: NavigationPreference | null };
              };
              return payload.data?.preferred_navigation_app ?? null;
            })
            .catch(() => null);
        }
        const resolved = await preferencePromise;
        cachedPreference = resolved;
        if (isMounted) {
          setPreference(resolved);
        }
      } catch {
        cachedPreference = null;
        if (isMounted) {
          setPreference(null);
        }
      }
    };

    loadPreference();

    return () => {
      isMounted = false;
    };
  }, []);

  const href = useMemo(() => {
    if (!addressValue) {
      return "";
    }
    const encoded = encodeURIComponent(addressValue);
    const googleUrl = `https://www.google.com/maps/search/?api=1&query=${encoded}`;
    const appleUrl = `https://maps.apple.com/?q=${encoded}`;
    const wazeUrl = `https://www.waze.com/ul?q=${encoded}&navigate=yes`;

    if (typeof navigator === "undefined") {
      return googleUrl;
    }

    const isIOS = /iPad|iPhone|iPod/i.test(navigator.userAgent);
    const resolvedPreference = preference ?? "auto";
    const target =
      resolvedPreference === "auto"
        ? isIOS
          ? "apple_maps"
          : "google_maps"
        : resolvedPreference;

    if (target === "apple_maps") {
      return appleUrl;
    }
    if (target === "waze") {
      return wazeUrl;
    }
    return googleUrl;
  }, [addressValue, preference]);

  const baseClasses =
    "inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-semibold transition";
  const activeClasses =
    "border-slate-200/70 bg-white/90 text-slate-600 hover:bg-slate-50/70 hover:text-slate-800";
  const disabledClasses =
    "cursor-not-allowed border-slate-200/70 bg-slate-100 text-slate-400";

  if (!canOpen) {
    return (
      <button
        type="button"
        disabled
        className={`${baseClasses} ${disabledClasses} ${className ?? ""}`}
        aria-disabled="true"
      >
        <MapIcon />
        {label}
      </button>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`${baseClasses} ${activeClasses} ${className ?? ""}`}
    >
      <MapIcon />
      {label}
    </a>
  );
}

function MapIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <circle cx="12" cy="10" r="2.8" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}
