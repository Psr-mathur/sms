import { useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";
import { toast } from "sonner";

/**
 * AndroidAppBackButtonHandler Component
 * Intercepts the Android hardware back button using Capacitor App Listener.
 * - Closes any open modals, dropdowns, or sheets first (by dispatching Escape key).
 * - Navigates back in history if possible.
 * - Prompts to double-press to exit if on the root page or login screen.
 */
export default function AndroidAppBackButtonHandler() {
  const [location, setLocation] = useLocation();
  const lastTimeBackPressRef = useRef<number>(0);
  const locationRef = useRef(location);
  const setLocationRef = useRef(setLocation);

  // Keep refs updated to avoid re-registering event listener on route change
  useEffect(() => {
    locationRef.current = location;
  }, [location]);

  useEffect(() => {
    setLocationRef.current = setLocation;
  }, [setLocation]);

  useEffect(() => {
    // Only register back button listener on native Android platform
    if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== "android") {
      return;
    }

    let listenerHandle: any = null;

    const setupListener = async () => {
      try {
        listenerHandle = await App.addListener("backButton", (data) => {
          // 1. Close open Radix Dialogs, Dropdowns, Sheets, or other popups
          const openDialog = document.querySelector('[role="dialog"], [role="menu"], [data-state="open"]');
          if (openDialog) {
            const escapeEvent = new KeyboardEvent("keydown", {
              key: "Escape",
              code: "Escape",
              keyCode: 27,
              which: 27,
              bubbles: true,
              cancelable: true,
            });
            document.dispatchEvent(escapeEvent);
            return;
          }

          // 2. Check if we are at the root or login page
          const currentPath = locationRef.current;
          const isAtRoot = currentPath === "/" || currentPath === "/login";

          if (isAtRoot) {
            const currentTime = Date.now();
            // If the back button is pressed twice within 2 seconds, exit the app
            if (currentTime - lastTimeBackPressRef.current < 2000) {
              App.exitApp();
            } else {
              lastTimeBackPressRef.current = currentTime;
              toast.info("Press back again to exit");
            }
          } else {
            // 3. Navigate back if history exists, otherwise default back to dashboard
            if (data.canGoBack) {
              window.history.back();
            } else {
              setLocationRef.current("/");
            }
          }
        });
      } catch (error) {
        console.error("Failed to add Capacitor backButton listener:", error);
      }
    };

    setupListener();

    return () => {
      if (listenerHandle) {
        listenerHandle.remove();
      }
    };
  }, []);

  return null;
}
