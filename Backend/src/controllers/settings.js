import express from "express";
import Settings from "../models/Settings.js";
import { authenticate, authorizeRoles } from "../middleware/auth.js";

const router = express.Router();

const getOrCreateSettings = async () => {
  const existing = await Settings.findOne().sort({ createdAt: -1 });
  if (existing) return existing;
  return Settings.create({});
};

const isNonEmptyString = (value) =>
  typeof value === "string" && value.trim().length > 0;

const normalizeString = (value) =>
  typeof value === "string" ? value.trim() : value;

const toStringOrNull = (value) => {
  if (value === null) return null;
  if (value === undefined) return undefined;
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : "";
  }
  return String(value);
};

const applyIfDefined = (target, key, value) => {
  if (value === undefined) return;
  target[key] = value;
};

const normalizeKeywords = (value) => {
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === "string" ? item.trim() : ""))
      .filter(Boolean);
  }
  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return undefined;
};

// Public settings for customer/guest pages.
router.get("/public", async (req, res) => {
  try {
    const settings = await getOrCreateSettings();
    res.json({
      settings: {
        general: settings.general ?? {},
        appearance: settings.appearance ?? {},
      },
    });
  } catch (error) {
    console.error("Failed to load public settings", error);
    res.status(500).json({ message: "Failed to load settings" });
  }
});

// Admin-only settings management
router.get("/", authenticate, authorizeRoles("admin"), async (req, res) => {
  try {
    const settings = await getOrCreateSettings();
    res.json({ settings });
  } catch (error) {
    console.error("Failed to load settings", error);
    res.status(500).json({ message: "Failed to load settings" });
  }
});

router.patch("/", authenticate, authorizeRoles("admin"), async (req, res) => {
  try {
    const settings = await getOrCreateSettings();

    const { general, appearance } = req.body ?? {};

    if (!general && !appearance) {
      return res
        .status(400)
        .json({ message: "No settings changes were provided" });
    }

    if (general && typeof general === "object") {
      settings.general ??= {};

      applyIfDefined(
        settings.general,
        "businessName",
        toStringOrNull(general.businessName)
      );
      applyIfDefined(
        settings.general,
        "description",
        toStringOrNull(general.description)
      );
      applyIfDefined(
        settings.general,
        "address",
        toStringOrNull(general.address)
      );
      applyIfDefined(settings.general, "phone", toStringOrNull(general.phone));
      applyIfDefined(settings.general, "email", toStringOrNull(general.email));

      if (general.social && typeof general.social === "object") {
        settings.general.social ??= {};
        applyIfDefined(
          settings.general.social,
          "instagram",
          toStringOrNull(general.social.instagram)
        );
        applyIfDefined(
          settings.general.social,
          "facebook",
          toStringOrNull(general.social.facebook)
        );
        applyIfDefined(
          settings.general.social,
          "tiktok",
          toStringOrNull(general.social.tiktok)
        );
      }

      if (general.hours !== undefined) {
        if (!Array.isArray(general.hours)) {
          return res
            .status(400)
            .json({ message: "Hours must be an array" });
        }

        const nextHours = general.hours
          .map((item) => {
            if (!item || typeof item !== "object") return null;
            const day = normalizeString(item.day);
            const open = normalizeString(item.open);
            const close = normalizeString(item.close);
            if (!isNonEmptyString(day)) return null;
            return {
              day,
              open: typeof open === "string" ? open : "",
              close: typeof close === "string" ? close : "",
            };
          })
          .filter(Boolean);

        settings.general.hours = nextHours;
      }
    }

    if (appearance && typeof appearance === "object") {
      settings.appearance ??= {};

      applyIfDefined(
        settings.appearance,
        "themeColor",
        toStringOrNull(appearance.themeColor)
      );
      applyIfDefined(
        settings.appearance,
        "logoUrl",
        toStringOrNull(appearance.logoUrl)
      );
      applyIfDefined(
        settings.appearance,
        "faviconUrl",
        toStringOrNull(appearance.faviconUrl)
      );

      if (appearance.seo && typeof appearance.seo === "object") {
        settings.appearance.seo ??= {};
        applyIfDefined(
          settings.appearance.seo,
          "title",
          toStringOrNull(appearance.seo.title)
        );
        applyIfDefined(
          settings.appearance.seo,
          "description",
          toStringOrNull(appearance.seo.description)
        );
        const keywords = normalizeKeywords(appearance.seo.keywords);
        if (keywords !== undefined) {
          settings.appearance.seo.keywords = keywords;
        }
      }
    }

    await settings.save();

    res.json({ settings });
  } catch (error) {
    console.error("Failed to update settings", error);
    res.status(500).json({ message: "Failed to update settings" });
  }
});

export default router;
